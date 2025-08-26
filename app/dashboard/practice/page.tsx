"use client"
import { useState } from "react"
import { MessageSkeleton } from "@/components/placeholders"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

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
      <h2 className="text-xl font-semibold mb-4">Exercices</h2>
      <div className="mb-6 p-4 border rounded-md space-y-3">
        <div className="flex gap-2">
          <input className="flex-1 border rounded px-3 py-2" placeholder="Compétence (ex: RECHERCHEV, Index/Match)" value={skill} onChange={(e) => setSkill(e.target.value)} />
          <button className="px-4 py-2 rounded bg-primary text-white flex items-center gap-2 disabled:opacity-50" onClick={generateExercise} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Génération..." : "Générer un exercice"}
          </button>
        </div>
        {loading && (
          <div className="p-3">
            <MessageSkeleton />
          </div>
        )}
        {!loading && exercise && (
          <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded">{exercise}</pre>
        )}
      </div>
    </div>
  )
}


