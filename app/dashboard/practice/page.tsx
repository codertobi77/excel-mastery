"use client"
import { useState } from "react"
import { MessageSkeleton } from "@/components/placeholders"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import MiniExcelGrid from "@/components/mini-excel/Grid"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

export default function PracticePage() {
  const { user } = useUser()
  const router = useRouter()
  const decrementCredits = useMutation((api as any).users.decrementCreditsByClerkId)
  const [skill, setSkill] = useState("")
  const [exercise, setExercise] = useState("")
  const [loading, setLoading] = useState(false)

  async function generateExercise() {
    if (!skill.trim()) return
    setLoading(true)
    setExercise("")
    try {
      // Gate by plan/credits
      try {
        const me = await fetch('/api/me', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null)
        const plan = me?.plan || 'FREE'
        const credits = typeof me?.credits === 'number' ? me.credits : 0
        if (plan !== 'PRO') {
          if (credits <= 0) {
            toast.error('Crédits épuisés. Passez au plan Pro pour usage illimité.')
            router.push('/payments/moneroo?interval=month&trial=true')
            return
          }
          try {
            if (user?.id) await decrementCredits({ clerkId: user.id, amount: 1 })
          } catch {}
        }
      } catch {}

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
      <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto">
        <h3 className="text-base sm:text-lg font-semibold">Feuille de calcul</h3>
        <div className="rounded-lg overflow-hidden border">
          <MiniExcelGrid />
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Astuce: Essayez des formules comme =SUM(A1:B2), =AVERAGE(A1:A5)</p>
      </div>
    </div>
  )
}


