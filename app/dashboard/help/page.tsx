"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Loader2, LifeBuoy, BookOpen, Mail, ExternalLink } from "lucide-react"

export default function HelpPage() {
  const [sending, setSending] = useState(false)
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
      <header className="flex items-center gap-2 sm:gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <LifeBuoy className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Aide</h1>
          <p className="text-sm sm:text-base text-muted-foreground">FAQ, guides et assistance</p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* FAQs */}
        <div className="border rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Questions fréquentes</h2>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {[
              {
                q: "Comment démarrer avec le Tuteur IA ?",
                a: "Allez dans Tuteur IA, posez votre question dans le champ prévu et appuyez sur Entrée. Utilisez les exemples proposés pour vous inspirer.",
              },
              {
                q: "Comment générer un cours personnalisé ?",
                a: "Dans Cours, choisissez votre niveau (ou passez le test) puis générez des cours adaptés à vos objectifs.",
              },
              {
                q: "Comment sauvegarder ma progression ?",
                a: "Votre progression est automatiquement enregistrée. Vous pouvez reprendre un cours depuis la dernière leçon non terminée.",
              },
            ].map((item, idx) => (
              <details key={idx} className="group border rounded-md p-3">
                <summary className="cursor-pointer font-medium list-none flex items-center justify-between">
                  <span>{item.q}</span>
                  <span className="text-muted-foreground group-open:hidden">+</span>
                  <span className="text-muted-foreground hidden group-open:inline">−</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Guides & ressources */}
        <div className="border rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Guides & ressources</h2>
          </div>
          <ul className="space-y-2 text-sm sm:text-base">
            <li>
              <a href="/dashboard/courses" className="text-primary hover:underline">Découvrir les cours disponibles</a>
            </li>
            <li>
              <a href="/dashboard/tutor" className="text-primary hover:underline">Utiliser le Tuteur IA efficacement</a>
            </li>
            <li>
              <a href="/dashboard/practice" className="text-primary hover:underline">S'exercer avec des exercices ciblés</a>
            </li>
          </ul>
        </div>
      </section>

      <Separator />

      {/* Contact */}
      <section className="border rounded-lg p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Contacter le support</h2>
        </div>
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setSending(true)
            try {
              const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Utilisateur', email, description: message }),
              })
              if (!res.ok) throw new Error('failed')
              setEmail("")
              setMessage("")
            } finally {
              setSending(false)
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="help-email">Email</Label>
            <Input id="help-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="help-message">Message</Label>
            <Textarea id="help-message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Décrivez votre besoin..." required />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={sending}>
              {sending ? (<span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Envoi...</span>) : 'Envoyer'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
