"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import MiniExcelGrid from "@/components/mini-excel/Grid";

interface ExerciseProps {
  exercise: {
    text: string;
    initial_data: Record<string, string | number>;
  };
}

export function InteractiveExercise({ exercise }: ExerciseProps) {
  if (!exercise) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">Exercice Pratique</h3>
      <Card className="bg-muted/40">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
          <CardDescription>{exercise.text}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px] bg-background rounded-md border p-2">
            <MiniExcelGrid initialData={exercise.initial_data} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
