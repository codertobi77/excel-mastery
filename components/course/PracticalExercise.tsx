"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Target, Lightbulb, Play } from "lucide-react"
import { useState } from "react"

interface PracticalExerciseProps {
  exercise: {
    title: string
    instructions: string
    expectedResult: string
    tips: string[]
  }
}

export function PracticalExercise({ exercise }: PracticalExerciseProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  return (
    <Card className="my-6 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{exercise.title}</CardTitle>
          </div>
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Exercice pratique
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Play className="h-4 w-4" />
            Instructions
          </h4>
          <div className="text-sm whitespace-pre-line">
            {exercise.instructions}
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Résultat attendu
          </h4>
          <div className="text-sm whitespace-pre-line">
            {exercise.expectedResult}
          </div>
        </div>

        {exercise.tips && exercise.tips.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Conseils pour réussir
            </h4>
            <ul className="text-sm space-y-1">
              {exercise.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">💡</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant={isCompleted ? "default" : "outline"}
            size="sm"
            onClick={() => setIsCompleted(!isCompleted)}
            className={isCompleted ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Exercice terminé
              </>
            ) : (
              "Marquer comme terminé"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
