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
import { Progress } from "@/components/ui/progress";
import Markdown from "@/components/markdown";
import { generatePlacementTest, correctPlacementTest, generateCourse, generateCourseFromTopic } from "@/lib/ai-content";

export default function DashboardCoursesPage() {
  const { user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const userDoc = useQuery((api as any).users.getByEmail, userEmail ? { email: userEmail } : undefined);
  const courses = useQuery((api as any).courses.listWithProgress, userDoc?._id ? { userId: userDoc._id } : "skip");
  const { getToken } = useAuth();
  const progress = useQuery((api as any).userProgress.getByUser, userDoc?._id ? { userId: userDoc._id } : "skip");
  const upsertLevel = useMutation((api as any).userProgress.upsertLevel);
  const toggleLesson = useMutation((api as any).userProgress.toggleLesson);
  const savePlacementResult = useMutation((api as any).userProgress.savePlacementResult);
  const upsertUser = useMutation((api as any).users.upsertFromClerk);
  const decrementCredits = useMutation((api as any).users.decrementCreditsByClerkId);

  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [selectingLevel, setSelectingLevel] = useState<string | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [mustTakeTest, setMustTakeTest] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultsSummary, setResultsSummary] = useState<string>("");
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [testLoading, setTestLoading] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<any>(null);
  const [courseGenerationLoading, setCourseGenerationLoading] = useState(false);
  const hasProgress = useMemo(() => !!progress?._id, [progress]);
  const isProgressLoaded = useMemo(() => progress !== undefined, [progress]);

  const [resumeOpen, setResumeOpen] = useState(false);
  const [resumeCourse, setResumeCourse] = useState<any | null>(null);

  useEffect(() => {
    // Debug: log the states
    console.log('Modal debug:', {
      userDocId: userDoc?._id,
      isProgressLoaded,
      hasProgress,
      progress,
      userEmail,
      user: !!user,
      shouldShowModal: userDoc?._id && isProgressLoaded && !hasProgress
    });
    
    // If user is loaded but userDoc doesn't exist, create it
    if (user && userEmail && !userDoc && userDoc !== undefined) {
      console.log('Creating user in Convex...');
      upsertUser({
        email: userEmail,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        image: user.imageUrl || undefined,
      }).catch(console.error);
      return; // Let the effect re-run after user creation
    }
    
    // Only show onboarding if:
    // 1. User is loaded
    // 2. UserDoc exists
    // 3. Progress query has completed (not undefined)
    // 4. User has no progress record
    if (user && userDoc?._id && isProgressLoaded && !hasProgress) {
      console.log('Opening onboarding modal');
      setOnboardingOpen(true);
    }
  }, [user, userDoc, isProgressLoaded, hasProgress, progress, userEmail, upsertUser]);

  async function generateOutline() {
    if (!topic.trim()) return;
    setLoading(true);
    setDraft("");
    try {
      // Gate by plan/credits
      try {
        const me = await fetch('/api/me', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null)
        const plan = me?.plan || 'FREE'
        const credits = typeof me?.credits === 'number' ? me.credits : 0
        if (plan !== 'PRO') {
          if (credits <= 0) {
            toast.error('Crédits épuisés. Passez au plan Pro pour usage illimité.')
            return
          }
        }
      } catch {}

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
      {!isProgressLoaded && userDoc?._id && (
        <div className="mb-4 p-4 bg-muted rounded-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Vérification de votre profil...</span>
        </div>
      )}
      {testLoading && (
        <div className="mb-4 p-4 bg-muted rounded-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Génération du test de positionnement...</span>
        </div>
      )}
      {courseGenerationLoading && (
        <div className="mb-4 p-4 bg-muted rounded-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Correction du test et génération du cours personnalisé...</span>
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
                    console.log("Token for course generation:", token ? "Present" : "Missing");
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
                    setMustTakeTest(true);
                    setTestLoading(true);
                    try {
                      const testData = await generatePlacementTest(selectingLevel as "BEGINNER" | "INTERMEDIATE" | "ADVANCED");
                      if (testData.questions && testData.questions.length === 10) {
                        setTestQuestions(testData.questions);
                        setTestOpen(true);
                        toast.success("Test de positionnement généré avec succès");
                      } else {
                        throw new Error("Test invalide généré");
                      }
                    } catch (e) {
                      console.error("Test generation error:", e);
                      toast.error("Impossible de générer le test. Réessayez.");
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
      <Dialog open={testOpen || mustTakeTest} onOpenChange={(v) => { setTestOpen(v); if (!v) setMustTakeTest(false); }}>
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
                    variant={userAnswers[currentQuestionIndex] === index ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => {
                      const newAnswers = [...userAnswers];
                      newAnswers[currentQuestionIndex] = index;
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
                    setTestOpen(false);
                    setMustTakeTest(false);
                    setCourseGenerationLoading(true);
                    
                    try {
                      // Correct the test using our new function
                      const correctionResult = await correctPlacementTest(
                        selectingLevel as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
                        testQuestions,
                        userAnswers
                      );
                      
                      setTestResult(correctionResult);
                      
                      // Generate summary for display
                      const summary = `Score: ${correctionResult.score}/10\nRésultat: ${correctionResult.result === "SUCCESS" ? "Réussi" : "Échec"}\n\nAnalyse détaillée:\n${correctionResult.review.map((r: any, i: number) => `Question ${i + 1}: ${r.isCorrect ? "✓" : "✗"} - ${r.analysis}`).join('\n\n')}`;
                      setResultsSummary(summary);
                      
                      // Save results to database
                      if (userDoc?._id) {
                        await savePlacementResult({ 
                          userId: userDoc._id, 
                          level: selectingLevel!, 
                          analysis: summary, 
                          answersJson: JSON.stringify(correctionResult.review) 
                        });
                      }
                      
                      setResultsOpen(true);
                      
                      // Generate personalized course based on test results
                      if (correctionResult.result === "FAIL" || correctionResult.score < 7) {
                        toast.message("Génération du cours personnalisé", { 
                          description: "Création d'un parcours adapté à votre niveau réel..." 
                        });
                        
                        try {
                          const course = await generateCourse(
                            selectingLevel as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
                            correctionResult
                          );
                          
                          // Save the generated course to database
                          const token = await getToken();
                          await fetch("/api/content", {
                            method: "POST",
                            headers: { 
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({ 
                              type: "course", 
                              topic: course.title,
                              courseData: course
                            }),
                          });
                          
                          fetch('/api/courses', { method: 'POST' }).catch(() => {});
                          toast.success("Cours personnalisé généré avec succès !");
                        } catch (e) {
                          console.error("Course generation error:", e);
                          toast.error("Erreur lors de la génération du cours personnalisé");
                        }
                      } else {
                        toast.success("Excellent ! Vous maîtrisez déjà ce niveau");
                      }
                    } catch (e) {
                      console.error("Test correction error:", e);
                      toast.error("Erreur lors de la correction du test");
                    } finally {
                      setCourseGenerationLoading(false);
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

      {/* Results Modal */}
      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Résultats du test de positionnement</DialogTitle>
            <DialogDescription>
              {testResult && (
                <div className="flex items-center gap-4 mt-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    testResult.result === "SUCCESS" 
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}>
                    Score: {testResult.score}/10
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    testResult.result === "SUCCESS" 
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                      : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                  }`}>
                    {testResult.result === "SUCCESS" ? "Niveau confirmé" : "Niveau ajusté"}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {testResult && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <h3 className="font-semibold mb-2">Analyse détaillée par question :</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {testResult.review.map((review: any, index: number) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      review.isCorrect 
                        ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" 
                        : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                    }`}>
                      <div className="flex items-start gap-2">
                        <span className={`text-lg ${review.isCorrect ? "text-green-600" : "text-red-600"}`}>
                          {review.isCorrect ? "✓" : "✗"}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">Question {index + 1}</p>
                          <p className="text-sm text-muted-foreground mb-2">{review.question}</p>
                          <p className="text-xs">
                            <strong>Votre réponse :</strong> {review.options[review.userAnswer] || "Non répondue"}<br/>
                            <strong>Bonne réponse :</strong> {review.options[review.correctAnswer]}
                          </p>
                          <p className="text-xs mt-1 text-muted-foreground">{review.analysis}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setResultsOpen(false)}>Fermer</Button>
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
                // Gate by plan/credits and decrement for FREE
                try {
                  const me = await fetch('/api/me', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null)
                  const plan = me?.plan || 'FREE'
                  const credits = typeof me?.credits === 'number' ? me.credits : 0
                  if (plan !== 'PRO') {
                    if (credits <= 0) {
                      toast.error('Crédits épuisés. Passez au plan Pro pour usage illimité.')
                      return
                    }
                    try {
                      if (user?.id) await decrementCredits({ clerkId: user.id, amount: 1 })
                    } catch {}
                  }
                } catch {}

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
          {courses.map((cp: any) => (
            <div key={cp.course._id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{cp.course.title}</h3>
                {cp.percentage === 100 ? (
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Badge: Terminé</span>
                ) : cp.percentage >= 50 ? (
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Badge: En progrès</span>
                ) : (
                  <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded">Badge: À commencer</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{cp.course.description}</p>
              <div className="mb-2 text-sm">{cp.completedLessons}/{cp.totalLessons} leçons</div>
              <Progress value={cp.percentage} />
              <div className="mt-3 flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResumeCourse(cp);
                    setResumeOpen(true);
                  }}
                >
                  {cp.percentage === 0 ? 'Commencer' : 'Reprendre'}
                </Button>
                <Button variant="secondary" asChild>
                  <a href={`/dashboard/courses/${cp.course._id}`}>Détails</a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <CardGridSkeleton />
      )}

      {/* Resume Modal */}
      <Dialog open={resumeOpen} onOpenChange={setResumeOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {resumeCourse?.percentage === 0 ? 'Commencer le cours' : 'Reprendre le cours'} - {resumeCourse?.course.title}
            </DialogTitle>
            <DialogDescription>
              {resumeCourse?.nextLesson ? `Prochaine leçon: ${resumeCourse.nextLesson.title}` : 'Cours terminé'}
            </DialogDescription>
          </DialogHeader>
          {resumeCourse?.nextLesson && (
            <div className="space-y-3">
              <div className="prose dark:prose-invert">
                <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded border">{resumeCourse.nextLesson.content}</pre>
              </div>
            </div>
          )}
          <DialogFooter>
            {resumeCourse?.nextLesson ? (
              <Button
                onClick={async () => {
                  try {
                    await toggleLesson({ userId: userDoc._id, lessonId: resumeCourse.nextLesson._id, completed: true });
                    toast.success('Leçon marquée comme terminée');
                    setResumeOpen(false);
                  } catch (e) {
                    toast.error("Impossible de marquer la leçon");
                  }
                }}
              >
                Marquer comme terminée
              </Button>
            ) : (
              <Button onClick={() => setResumeOpen(false)}>Fermer</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


