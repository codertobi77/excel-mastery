"use client"
import { useState } from "react"
import { MessageSkeleton } from "@/components/placeholders"
import { Loader2, FileText, Download, Upload } from "lucide-react"
import { toast } from "sonner"
import MiniExcelGrid from "@/components/mini-excel/Grid"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PracticePage() {
  const { user } = useUser()
  const router = useRouter()
  // This mutation is not used in the new flow, but we keep it for now.
  const decrementCredits = useMutation((api as any).users.decrementCreditsByClerkId)

  const [skill, setSkill] = useState("Tableaux croisés dynamiques")
  const [difficulty, setDifficulty] = useState("Intermediate")
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function generateMiniProject() {
    if (!skill.trim() || !difficulty) {
        toast.error("Veuillez spécifier une compétence et une difficulté.");
        return;
    }
    setLoading(true)
    setProject(null)
    try {
      // The credit gating is now handled by the proxy, but we could keep a client-side check
      // For simplicity, we'll rely on the backend proxy for now.

      const res = await fetch("/api/actions/generate_mini_project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill_focus: skill, difficulty }),
      })

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "La génération du projet a échoué.");
      }

      const data = await res.json()
      setProject(data)
      if (!data) toast.info("L'agent n'a pas pu générer de projet.")
    } catch (e: any) {
        toast.error(e.message || "Une erreur est survenue.");
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-2xl font-bold">Zone de Pratique</h2>
        <p className="text-muted-foreground">
          Utilisez la feuille de calcul ci-dessous pour travailler sur votre mini-projet ou pour vous entraîner librement.
        </p>
        <div className="rounded-lg overflow-hidden border">
          <MiniExcelGrid />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Générateur de Projet</h2>
        <Card>
            <CardHeader>
                <CardTitle>Créez votre défi</CardTitle>
                <CardDescription>
                    Générez un mini-projet personnalisé pour mettre en pratique une compétence spécifique.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label htmlFor="skill-input" className="text-sm font-medium">Compétence à pratiquer</label>
                    <Input
                        id="skill-input"
                        placeholder="Ex: RECHERCHEV, Power Query..."
                        value={skill}
                        onChange={(e) => setSkill(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="difficulty-select" className="text-sm font-medium">Difficulté</label>
                     <Select value={difficulty} onValueChange={setDifficulty}>
                        <SelectTrigger id="difficulty-select">
                            <SelectValue placeholder="Choisir une difficulté" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Beginner">Débutant</SelectItem>
                            <SelectItem value="Intermediate">Intermédiaire</SelectItem>
                            <SelectItem value="Advanced">Avancé</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={generateMiniProject} disabled={loading} className="w-full">
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {loading ? "Génération en cours..." : "Générer un mini-projet"}
                </Button>
            </CardContent>
        </Card>

        {loading && <MessageSkeleton />}

        {project && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-start gap-2">
                        <FileText className="h-6 w-6 mt-1 text-primary" />
                        <span>{project.title}</span>
                    </CardTitle>
                    <CardDescription>{project.context}</CardDescription>
                </CardHeader>
                <CardContent>
                    <h4 className="font-semibold mb-2">Instructions :</h4>
                    <ul className="list-decimal list-inside space-y-2 text-sm">
                        {project.instructions.map((inst: string, i: number) => (
                            <li key={i}>{inst}</li>
                        ))}
                    </ul>
                    <div className="flex gap-4 mt-6">
                        <Button variant="outline" asChild>
                            <a href={project.data_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Données
                            </a>
                        </Button>
                         <Button variant="outline" asChild>
                            <a href={project.solution_url} target="_blank" rel="noopener noreferrer">
                                <Upload className="h-4 w-4 mr-2" />
                                Solution
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  )
}
