"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, BookOpen } from "lucide-react"

interface KeyTakeawaysProps {
  takeaways: string[]
}

export function KeyTakeaways({ takeaways }: KeyTakeawaysProps) {
  if (!takeaways || takeaways.length === 0) return null

  return (
    <Card className="my-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <BookOpen className="h-5 w-5" />
          Points clés à retenir
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {takeaways.map((takeaway, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">{takeaway}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
