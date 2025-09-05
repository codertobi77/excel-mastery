"use client"

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrencyForCountry, PRO_USD_MONTHLY, PRO_USD_ANNUAL } from '@/lib/billing'
import { COUNTRIES } from '@/lib/countries'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEffect, useMemo, useState } from 'react'
import { formatPrice } from '@/lib/currency'

export default function PlansPage() {
  const router = useRouter()
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress || ''
  const userDoc = useQuery((api as any).users.getByEmail, email ? { email } : 'skip')
  const [fx, setFx] = useState<Record<string, number> | null>(null)
  const [selectedCountry, setSelectedCountry] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/fx', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (data?.rates) setFx(data.rates)
      } catch {}
    }
    load()
  }, [])

  const nationality = (userDoc?.nationality || selectedCountry || '').toUpperCase()
  const currency = getCurrencyForCountry(nationality)
  const monthlyDisplay = useMemo(() => {
    if (!fx) return formatPrice(PRO_USD_MONTHLY, currency)
    const rate = fx[currency]
    if (!rate || typeof rate !== 'number') return formatPrice(PRO_USD_MONTHLY, currency)
    return formatPrice(PRO_USD_MONTHLY * rate, currency)
  }, [fx, currency])
  const annualDisplay = useMemo(() => {
    if (!fx) return formatPrice(PRO_USD_ANNUAL, currency)
    const rate = fx[currency]
    if (!rate || typeof rate !== 'number') return formatPrice(PRO_USD_ANNUAL, currency)
    return formatPrice(PRO_USD_ANNUAL * rate, currency)
  }, [fx, currency])
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Choisissez votre plan</h1>
        <p className="text-muted-foreground mt-2">Passez à Pro à tout moment</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gratuit</CardTitle>
            <CardDescription>Parfait pour commencer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">0€</div>
            <ul className="space-y-2 mb-6 text-sm">
              <li>50 crédits inclus</li>
              <li>Cours de base</li>
              <li>Communauté</li>
            </ul>
            <Button className="w-full" onClick={() => router.push('/dashboard')}>Continuer en Free</Button>
          </CardContent>
        </Card>
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Pro
              <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded">Recommandé</span>
            </CardTitle>
            <CardDescription>Essai gratuit 14 jours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{monthlyDisplay}<span className="text-sm font-normal">/mois</span></div>
            <div className="text-xs text-muted-foreground mb-4">Annuel: {annualDisplay} (2 mois offerts)</div>
            <ul className="space-y-2 mb-6 text-sm">
              <li>Accès illimité à tous les services</li>
              <li>Tuteur IA personnel</li>
              <li>Exercices avancés</li>
              <li>Support prioritaire</li>
            </ul>
            {!userDoc?.nationality && (
              <div className="mb-4">
                <label className="text-sm font-medium">Pays (pour la devise)</label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner votre pays" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button 
                className="w-full" 
                disabled={!nationality}
                onClick={() => router.push(`/payments/moneroo?interval=month&trial=true&nationality=${encodeURIComponent(nationality)}`)}
              >
                Mensuel – Essai 14j
              </Button>
              <Button 
                className="w-full" 
                variant="outline" 
                disabled={!nationality}
                onClick={() => router.push(`/payments/moneroo?interval=year&trial=true&nationality=${encodeURIComponent(nationality)}`)}
              >
                Annuel – 2 mois offerts
              </Button>
            </div>
            {!nationality && (
              <p className="text-xs text-muted-foreground mt-2">Veuillez sélectionner votre pays pour continuer</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


