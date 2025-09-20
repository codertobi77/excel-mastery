"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizProps {
  quiz: Array<{
    question: string;
    options: string[];
    correct_answer: string;
  }>;
}

export function Quiz({ quiz }: QuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  const handleSelectAnswer = (questionIndex: number, answer: string) => {
    // Allow changing answer only if not submitted
    if (!submitted[questionIndex]) {
      setSelectedAnswers(prev => ({
        ...prev,
        [questionIndex]: answer,
      }));
    }
  };

  const handleSubmit = (questionIndex: number) => {
    if (selectedAnswers[questionIndex] !== undefined) {
      setSubmitted(prev => ({
        ...prev,
        [questionIndex]: true,
      }));
    }
  };

  if (!quiz || quiz.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">Mini-Quiz</h3>
      <div className="space-y-6">
        {quiz.map((q, index) => {
          const isSubmitted = submitted[index];
          const selectedAnswer = selectedAnswers[index];
          const isCorrect = selectedAnswer === q.correct_answer;

          return (
            <Card key={index} className="bg-muted/40">
              <CardHeader>
                <CardTitle>Question {index + 1}</CardTitle>
                <CardDescription>{q.question}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {q.options.map((option, optionIndex) => {
                    const isSelected = selectedAnswer === option;
                    let buttonVariant: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link" = "outline";
                    let feedbackIcon = null;

                    if (isSubmitted) {
                      if (isSelected) {
                        buttonVariant = isCorrect ? "secondary" : "destructive";
                        feedbackIcon = isCorrect ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                      } else if (option === q.correct_answer) {
                        buttonVariant = "secondary";
                        feedbackIcon = <CheckCircle className="h-5 w-5 text-green-500" />;
                      }
                    } else if (isSelected) {
                      buttonVariant = "default";
                    }

                    return (
                      <Button
                        key={optionIndex}
                        variant={buttonVariant}
                        className="w-full justify-between text-left h-auto p-3"
                        onClick={() => handleSelectAnswer(index, option)}
                        disabled={isSubmitted}
                      >
                        <span>{option}</span>
                        {feedbackIcon}
                      </Button>
                    );
                  })}
                </div>
                {!isSubmitted ? (
                  <Button onClick={() => handleSubmit(index)} disabled={selectedAnswer === undefined}>
                    Valider
                  </Button>
                ) : (
                    isCorrect ? (
                        <p className="text-sm font-medium text-green-600">Bonne réponse !</p>
                    ) : (
                        <p className="text-sm font-medium text-red-600">
                            Incorrect. La bonne réponse était : {q.correct_answer}
                        </p>
                    )
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
