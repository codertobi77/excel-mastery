"use client"
import { useState } from "react"
import { MessageSkeleton } from "@/components/placeholders"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import MiniExcelGrid from "@/components/mini-excel/Grid"

export default function PracticePage() {
  const [skill, setSkill] = useState("")
  const [exercise, setExercise] = useState("")
  const [loading, setLoading] = useState(false)

  async function generateExercise() {
    if (!skill.trim()) return
    setLoading(true)
    setExercise("")
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "Tu es un concepteur d'exercices Excel. Génère un exercice pratique avec énoncé, étapes et correction.",
          messages: [{ role: "user", content: `Compétence ciblée: ${skill}.` }],
          temperature: 0.5,
          max_tokens: 1200
        })
      })
      const data = await res.json()
      const content = data.content || ""
      setExercise(content)
      if (!content) toast.info("Réponse vide")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>        
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Feuille de calcul</h3>
        <MiniExcelGrid />
        <p className="text-xs text-muted-foreground">Astuce: Essayez des formules comme =SUM(A1:B2), =AVERAGE(A1:A5)</p>
      </div>
    </div>
  )
}


