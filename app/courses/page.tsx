'use client'
import { Button } from "../../components/ui/button";
import { Navigation } from "../../components/navigation";
import { redirect } from "next/navigation";
import Card from "../../components/ui/card"; // Import the Card component
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface CourseDoc {
  _id: string;
  title: string;
  description: string;
}

export default function CoursesPage() {
  // Route learning features exclusively via dashboard
  redirect("/dashboard/courses");
  const courses = useQuery(api.courses.list) as CourseDoc[] | undefined;

  return (
    <div className="min-h-screen flex flex-col items-center bg-background">
      <Navigation />
      <main className="flex-1 container py-8">
        <h1 className="text-4xl font-bold mb-6 text-center">Cours & Tutoriels</h1>
        <p className="text-lg text-muted-foreground mb-8 text-center">
          Des formations personnalisées pour tous les niveaux, de débutant à expert.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8">
          {courses && courses.length > 0 ? (
            courses.map(course => (
              <Card key={course._id} title={course.title} description={course.description} />
            ))
          ) : (
            <p className="text-center text-muted-foreground">Aucun cours disponible pour le moment.</p>
          )}
        </div>
      </main>
    </div>
  );
}
