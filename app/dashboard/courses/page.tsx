"use client"
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Card from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { CardGridSkeleton } from "@/components/placeholders";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUser, useAuth } from "@clerk/nextjs";

export default function DashboardCoursesPage() {
  const courses = useQuery((api as any).courses.list);
  const { user } = useUser();
  const { getToken } = useAuth();
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const userDoc = useQuery((api as any).users.getByEmail, userEmail ? { email: userEmail } : undefined);
  const progress = useQuery((api as any).userProgress.getByUser, userDoc?._id ? { userId: userDoc._id } : "skip");
  const upsertLevel = useMutation((api as any).userProgress.upsertLevel);

  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [selectingLevel, setSelectingLevel] = useState<string | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [testLoading, setTestLoading] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const hasProgress = useMemo(() => !!progress?._id, [progress]);

  useEffect(() => {
    if (userDoc?._id === undefined) return;
    if (!hasProgress) {
      setOnboardingOpen(true);
    }
  }, [userDoc?._id, hasProgress]);

  async function generateOutline() {
    if (!topic.trim()) return;
    setLoading(true);
    setDraft("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "Tu es un créateur de cours Excel. Propose un plan de cours clair et progressif.",
          messages: [{ role: "user", content: `Sujet: ${topic}. Fais un plan de cours détaillé avec sections et objectifs.` }],
          temperature: 0.4,
          max_tokens: 1200
        })
      });
      const data = await res.json();
      setDraft(data.content || "");
      if (!data?.content) toast.info("Contenu généré vide");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Mes cours</h2>
      {testLoading && (
        <div className="mb-4 p-4 bg-muted rounded-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Génération du test de positionnement...</span>
        </div>
      )}
      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quel est votre niveau en Excel ?</DialogTitle>
            <DialogDescription>
              Sélectionnez votre niveau actuel pour personnaliser votre parcours.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2">
            {[
              { key: "BEGINNER", label: "Débutant" },
              { key: "INTERMEDIATE", label: "Intermédiaire" },
              { key: "ADVANCED", label: "Avancé" },
            ].map((lvl) => (
              <Button
                key={lvl.key}
                variant={selectingLevel === lvl.key ? "default" : "outline"}
                onClick={() => setSelectingLevel(lvl.key)}
              >
                {lvl.label}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button
              disabled={!selectingLevel || !userDoc?._id}
              onClick={async () => {
                if (!selectingLevel || !userDoc?._id) return;
                try {
                  // Save chosen level
                  await upsertLevel({ userId: userDoc._id, skillLevel: selectingLevel });
                  if (selectingLevel === "BEGINNER") {
                    // Generate two beginner courses quickly
                    const token = await getToken();
                    await Promise.all([
                      fetch("/api/content", {
                        method: "POST",
                        headers: { 
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ type: "course", topic: "Bases d'Excel pour débutants" }),
                      }),
                      fetch("/api/content", {
                        method: "POST",
                        headers: { 
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ type: "course", topic: "Formules essentielles (SOMME, MOYENNE, SI)" }),
                      }),
                    ]);
                    fetch('/api/courses', { method: 'POST' }).catch(() => {})
                    toast.success("Deux cours débutants ont été générés");
                    setOnboardingOpen(false);
                  } else {
                    // Start AI-generated placement test flow
                    setOnboardingOpen(false);
                    setTestLoading(true);
                    try {
                      const res = await fetch("/api/ai", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          system: `Tu es un expert Excel qui crée des tests de positionnement. Génère un test de 5 questions pour le niveau ${selectingLevel === "INTERMEDIATE" ? "intermédiaire" : "avancé"}. Chaque question doit avoir 4 options (A, B, C, D) avec une seule bonne réponse.`,
                          messages: [{ 
                            role: "user", 
                            content: `Crée un test de positionnement Excel niveau ${selectingLevel === "INTERMEDIATE" ? "intermédiaire" : "avancé"} avec exactement 5 questions. Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après. Format exact: [{"question": "Question texte", "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"], "correctAnswer": "A", "explanation": "Explication de la réponse"}]` 
                          }],
                          temperature: 0.3,
                          max_tokens: 1500
                        })
                      });
                      const data = await res.json();
                      if (data.content) {
                        try {
                          // Try to extract JSON from the response (AI might add extra text)
                          let jsonContent = data.content;
                          
                          // Find JSON array in the response
                          const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
                          if (jsonMatch) {
                            jsonContent = jsonMatch[0];
                          }
                          
                          const questions = JSON.parse(jsonContent);
                          
                          // Validate the structure
                          if (Array.isArray(questions) && questions.length > 0) {
                            setTestQuestions(questions);
                            setTestOpen(true);
                          } else {
                            throw new Error("Invalid questions format");
                          }
                        } catch (e) {
                          console.error("Test parsing error:", e);
                          console.error("AI response:", data.content);
                          toast.error("Erreur lors du parsing du test. Réessayez.");
                        }
                      } else {
                        toast.error("Réponse vide de l'IA");
                      }
                    } catch (e) {
                      toast.error("Impossible de générer le test");
                    } finally {
                      setTestLoading(false);
                    }
                  }
                } catch (e) {
                  toast.error("Impossible d'initialiser votre parcours");
                }
              }}
            >
              Continuer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Placement Test Modal */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test de positionnement - Niveau {selectingLevel === "INTERMEDIATE" ? "Intermédiaire" : "Avancé"}</DialogTitle>
            <DialogDescription>
              Question {currentQuestionIndex + 1} sur {testQuestions.length}
            </DialogDescription>
          </DialogHeader>
          
          {testQuestions[currentQuestionIndex] && (
            <div className="space-y-4">
              <div className="text-lg font-medium">
                {testQuestions[currentQuestionIndex].question}
              </div>
              
              <div className="space-y-2">
                {testQuestions[currentQuestionIndex].options.map((option: string, index: number) => (
                  <Button
                    key={index}
                    variant={userAnswers[currentQuestionIndex] === option.split('.')[0] ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => {
                      const newAnswers = [...userAnswers];
                      newAnswers[currentQuestionIndex] = option.split('.')[0];
                      setUserAnswers(newAnswers);
                    }}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Précédent
              </Button>
              
              {currentQuestionIndex < testQuestions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  disabled={!userAnswers[currentQuestionIndex]}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    // Calculate wrong answers and generate courses
                    const wrong = testQuestions
                      .map((q, i) => ({ question: q.question, userAnswer: userAnswers[i], correctAnswer: q.correctAnswer, explanation: q.explanation }))
                      .filter((q, i) => userAnswers[i] !== q.correctAnswer)
                      .map(q => q.question);
                    
                    setWrongAnswers(wrong);
                    setTestOpen(false);
                    
                    if (wrong.length > 0) {
                      toast.message("Génération des cours", { description: `Création de ${wrong.length} cours basés sur vos erreurs...` });
                      
                      // Generate courses based on wrong answers
                      try {
                        const token = await getToken();
                        await Promise.all(
                          wrong.slice(0, 3).map(async (question) => {
                            const topic = question.split(' ').slice(0, 5).join(' '); // Extract key words
                            await fetch("/api/content", {
                              method: "POST",
                              headers: { 
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                              },
                              body: JSON.stringify({ type: "course", topic }),
                            });
                          })
                        );
                        fetch('/api/courses', { method: 'POST' }).catch(() => {});
                        toast.success(`${Math.min(wrong.length, 3)} cours personnalisés ont été générés`);
                      } catch (e) {
                        toast.error("Erreur lors de la génération des cours");
                      }
                    } else {
                      toast.success("Excellent ! Vous maîtrisez déjà ce niveau");
                    }
                  }}
                  disabled={!userAnswers[currentQuestionIndex]}
                >
                  Terminer le test
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="mb-6 p-4 border rounded-md space-y-3">
        <div className="flex gap-2">
          <input className="flex-1 border rounded px-3 py-2" placeholder="Sujet de cours (ex: Tableaux croisés dynamiques)" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <button className="px-4 py-2 rounded bg-primary text-white flex items-center gap-2 disabled:opacity-50" onClick={generateOutline} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Génération..." : "Générer un plan"}
          </button>
        </div>
        {draft && <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded">{draft}</pre>}
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
            onClick={async () => {
              if (!topic.trim()) return;
              setCreating(true);
              try {
                const token = await getToken();
                await fetch("/api/content", {
                  method: "POST",
                  headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                  },
                  body: JSON.stringify({ type: "course", topic }),
                });
                // Invalidate Next cache tag for courses
                fetch('/api/courses', { method: 'POST' }).catch(() => {})
                // Live query should update automatically
                setDraft("");
                toast.success("Cours créé");
              } finally {
                setCreating(false);
              }
            }}
            disabled={creating}
          >
            <span className="inline-flex items-center gap-2">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {creating ? "Création..." : "Créer le cours"}
            </span>
          </button>
        </div>
      </div>
      {courses ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c: any) => (
            <Card key={c._id} title={c.title} description={c.description} />
          ))}
        </div>
      ) : (
        <CardGridSkeleton />
      )}
    </div>
  )
}


