"use client"

import { useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function PlanSelectionModal() {
  const { user } = useUser()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const publicMetadata: any = user?.publicMetadata || {}
  const profileCompleted = Boolean(publicMetadata?.profileCompleted || (publicMetadata?.gender && publicMetadata?.age && publicMetadata?.nationality))
  const nationality = String(publicMetadata?.nationality || '')

  // Show when profile is complete and no subscription chosen yet
  useEffect(() => {
    if (!user) return
    // If user has plan in private metadata or external system, you could fetch from /api/me
    // For now, rely on /api/me hydration via AppBootstrap to set store, or show on first complete
    if (profileCompleted) setOpen(true)
  }, [user, profileCompleted])

  // Also react immediately after profile update completes
  useEffect(() => {
    const handler = () => {
      setOpen(true)
    }
    window.addEventListener('PROFILE_COMPLETED', handler)
    return () => window.removeEventListener('PROFILE_COMPLETED', handler)
  }, [])

  async function chooseFree() {
    setOpen(false)
  }

  async function choosePro() {
    if (!nationality) return
    setBusy(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: nationality, plan: 'PRO' }),
      })
      if (!res.ok) throw new Error('Checkout init failed')
      const data = await res.json()
      // Moneroo-only
      router.push('/payments/moneroo?interval=month&trial=true')
      setOpen(false)
    } catch (e) {
      // fallback: go to generic subscribe page
      router.push('/subscribe')
    } finally {
      setBusy(false)
    }
  }

  const PricingHint = useMemo(() => {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <div className="text-sm font-semibold">Gratuit</div>
          <div className="text-sm text-muted-foreground mt-1">50 crédits offerts</div>
          <Button onClick={chooseFree} className="mt-3" variant="secondary">Choisir Free</Button>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-semibold">Pro</div>
          <div className="text-sm text-muted-foreground mt-1">Essai gratuit 14 jours • 2 mois offerts/an</div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button onClick={choosePro} disabled={busy}>{busy ? 'Redirection...' : 'Mensuel – Essai 14j'}</Button>
            <Button onClick={() => router.push('/payments/moneroo?interval=year&trial=true')} variant="outline" disabled={busy}>Annuel – 2 mois offerts</Button>
          </div>
        </div>
      </div>
    )
  }, [busy])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choisissez votre plan</DialogTitle>
          <DialogDescription>
            Sélectionnez le plan qui vous convient. Vous pourrez changer à tout moment.
          </DialogDescription>
        </DialogHeader>
        {PricingHint}
      </DialogContent>
    </Dialog>
  )
}


