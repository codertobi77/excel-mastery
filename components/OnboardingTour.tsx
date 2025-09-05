"use client"

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

type Step = { title: string; description: string }

export default function OnboardingTour() {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress || ''
  const userDoc = useQuery((api as any).users.getByEmail, email ? { email } : 'skip')
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!userDoc) return
    try {
      const key = `tour_seen_${user?.id}_${userDoc.plan || 'FREE'}`
      const seen = localStorage.getItem(key)
      if (!seen) setOpen(true)
    } catch {}
  }, [user?.id, userDoc])

  const steps: Step[] = useMemo(() => {
    const common: Step[] = [
      { title: 'Tableau de bord', description: 'Accédez à votre progression et aux sections principales.' },
      { title: 'Tuteur IA', description: 'Posez vos questions sur Excel et obtenez des réponses guidées.' },
      { title: 'Cours', description: 'Suivez des cours adaptés à votre niveau et vos objectifs.' },
      { title: 'Exercices', description: 'Mettez en pratique avec des exercices corrigés.' },
    ]
    if ((userDoc?.plan || 'FREE') === 'PRO') {
      return [
        ...common,
        { title: 'Fonctionnalités Pro', description: 'Accès illimité, support prioritaire et génération de contenus avancés.' },
      ]
    }
    return [
      ...common,
      { title: 'Crédits', description: 'Votre plan Free inclut des crédits limités (affichés près de votre avatar).' },
      { title: 'Passer à Pro', description: 'Débloquez tout avec un essai gratuit de 14 jours.' },
    ]
  }, [userDoc?.plan])

  if (!userDoc) return null

  const key = `tour_seen_${user?.id}_${userDoc.plan || 'FREE'}`

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v)
      if (!v) try { localStorage.setItem(key, '1') } catch {}
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{steps[index]?.title || 'Bienvenue'}</DialogTitle>
          <DialogDescription>
            {steps[index]?.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">Étape {index + 1} / {steps.length}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setOpen(false)
              try { localStorage.setItem(key, '1') } catch {}
            }}>Ignorer</Button>
            {index < steps.length - 1 ? (
              <Button onClick={() => setIndex((i) => Math.min(i + 1, steps.length - 1))}>Suivant</Button>
            ) : (
              <Button onClick={() => {
                setOpen(false)
                try { localStorage.setItem(key, '1') } catch {}
              }}>Terminer</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


