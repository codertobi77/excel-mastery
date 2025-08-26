import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateCourse, generateExercise, generatePersonalizedContent } from "@/lib/ai-content";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { type, topic, difficulty } = await req.json();
    const content = await generatePersonalizedContent(userId);

    if (type === "course") {
      const courseData = await generateCourse(topic || content.topics[0]);
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
      return NextResponse.json({ id: courseId });
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


