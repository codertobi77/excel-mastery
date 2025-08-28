"use client"
import { useParams } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = params?.id as string
  const { user } = useUser()
  const userEmail = user?.primaryEmailAddress?.emailAddress || ""
  const userDoc = useQuery((api as any).users.getByEmail, userEmail ? { email: userEmail } : undefined)
  const detail = useQuery((api as any).courses.getCourseDetail, userDoc?._id && courseId ? { userId: userDoc._id, courseId } : "skip") as any
  const toggleLesson = useMutation((api as any).userProgress.toggleLesson)

  if (!detail || !userDoc?._id) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement du cours...
      </div>
    )
  }

  if (!detail?.course) return <div className="p-6">Cours introuvable</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{detail.course.title}</h1>
        <p className="text-muted-foreground">{detail.course.description}</p>
      </div>

      <div className="space-y-6">
        {detail.chapters.map((ch: any) => (
          <div key={ch._id} className="border rounded-lg p-4">
            <div className="font-semibold mb-3">{ch.title}</div>
            <div className="space-y-2">
              {ch.lessons.map((l: any) => (
                <div key={l._id} className="flex items-start gap-3">
                  <Checkbox
                    checked={Boolean(l.completed)}
                    onCheckedChange={async (v) => {
                      try {
                        await toggleLesson({ userId: userDoc._id, lessonId: l._id, completed: Boolean(v) })
                        toast.success('Mise à jour enregistrée')
                      } catch (e) {
                        toast.error('Mise à jour impossible')
                      }
                    }}
                  />
                  <div>
                    <div className="font-medium">{l.title}</div>
                    <div className="mt-1 text-sm whitespace-pre-wrap">{l.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <Button variant="outline" asChild>
          <a href="/dashboard/courses">Retour aux cours</a>
        </Button>
      </div>
    </div>
  )
}
