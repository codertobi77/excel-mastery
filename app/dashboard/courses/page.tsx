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
import { useUser } from "@clerk/nextjs";

export default function DashboardCoursesPage() {
  const courses = useQuery((api as any).courses.list);
  const { user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const userDoc = useQuery((api as any).users.getByEmail, userEmail ? { email: userEmail } : undefined);
  const progress = useQuery((api as any).userProgress.getByUser, userDoc?._id ? { userId: userDoc._id } : undefined);
  const upsertLevel = useMutation((api as any).userProgress.upsertLevel);

  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [selectingLevel, setSelectingLevel] = useState<string | null>(null);
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
                    await Promise.all([
                      fetch("/api/content", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: "course", topic: "Bases d'Excel pour débutants" }),
                      }),
                      fetch("/api/content", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: "course", topic: "Formules essentielles (SOMME, MOYENNE, SI)" }),
                      }),
                    ]);
                    fetch('/api/courses', { method: 'POST' }).catch(() => {})
                    toast.success("Deux cours débutants ont été générés");
                    setOnboardingOpen(false);
                  } else {
                    // Start AI-generated placement test flow
                    setOnboardingOpen(false);
                    toast.message("Test de positionnement", { description: "Génération du test selon votre niveau..." });
                    // TODO: navigate to a dedicated test page or open test modal
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
                await fetch("/api/content", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
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


