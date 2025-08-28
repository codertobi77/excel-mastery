import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateCourse, generateExercise, generatePersonalizedContent } from "@/lib/ai-content";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    // Temporarily bypass auth for debugging
    const { userId } = await auth();
    console.log("Auth check - userId:", userId);
    
    // For now, use a default userId if auth fails
    const effectiveUserId = userId || "temp_user_id";
    console.log("Using userId:", effectiveUserId);

    const { type, topic, difficulty } = await req.json();
    const content = await generatePersonalizedContent(effectiveUserId);

    if (type === "course") {
      const chosenTopic = topic || content.topics[0]
      // Try reuse snapshot first
      try {
        const snap = await convex.query((api as any).courses.getCourseSnapshot, { userId: effectiveUserId, topic: chosenTopic })
        if (snap?.dataJson) {
          const courseData = JSON.parse(snap.dataJson)
          const courseId = await convex.mutation(api.courses.createFullCourse, {
            title: courseData.title,
            description: courseData.description,
            level: courseData.level,
            duration: courseData.duration,
            imageUrl: undefined,
            chapters: courseData.chapters.map((ch: any) => ({
              title: ch.title,
              order: ch.order,
              lessons: ch.lessons.map((ls: any) => ({
                title: ls.title,
                content: ls.content,
                order: ls.order,
                duration: ls.duration,
              })),
            })),
          });
          return NextResponse.json({ id: courseId, reused: true });
        }
      } catch {}

      const courseData = await generateCourse(chosenTopic);
      // Save snapshot
      try {
        await convex.mutation((api as any).courses.saveCourseSnapshot, { userId: effectiveUserId, topic: chosenTopic, dataJson: JSON.stringify(courseData) })
      } catch {}

      const courseId = await convex.mutation(api.courses.createFullCourse, {
        title: courseData.title,
        description: courseData.description,
        level: courseData.level,
        duration: courseData.duration,
        imageUrl: undefined,
        chapters: courseData.chapters.map((ch: any) => ({
          title: ch.title,
          order: ch.order,
          lessons: ch.lessons.map((ls: any) => ({
            title: ls.title,
            content: ls.content,
            order: ls.order,
            duration: ls.duration,
          })),
        })),
      });
      return NextResponse.json({ id: courseId, reused: false });
    }

    if (type === "exercise") {
      const exerciseData = await generateExercise(topic || content.topics[0], content.difficulty);
      return NextResponse.json(exerciseData);
    }

    return NextResponse.json({ error: "Type de contenu non valide" }, { status: 400 });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json({ error: "Erreur lors de la génération du contenu" }, { status: 500 });
  }
}


