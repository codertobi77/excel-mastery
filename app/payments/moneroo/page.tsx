"use client"

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getCurrencyForCountry, PRO_USD_MONTHLY, PRO_USD_ANNUAL } from '@/lib/billing'
import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { formatPrice } from '@/lib/currency'

export const dynamic = 'force-dynamic'

export default function MonerooPaymentPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-10 text-center">Chargement…</div>}>
      <MonerooPaymentInner />
    </Suspense>
  )
}

function MonerooPaymentInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentData, setPaymentData] = useState<any>(null)
  const [fx, setFx] = useState<Record<string, number> | null>(null)
  const interval = (searchParams.get('interval') || 'month') as 'month' | 'year'
  const trial = searchParams.get('trial') === 'true'
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress || ''
  const userDoc = useQuery((api as any).users.getByEmail, email ? { email } : 'skip')

  useEffect(() => {
    // Initialize Moneroo payment when component mounts
    initializePayment()
  }, [])

  useEffect(() => {
    // Fetch live FX (USD base)
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

  async function initializePayment() {
    setLoading(true)
    setError('')
    
    try {
      // Determine currency by nationality if available (fallback EUR)
      const nationality = ((searchParams.get('nationality') || userDoc?.nationality || '') as string).toUpperCase()
      const currency = getCurrencyForCountry(nationality)
      const amount = interval === 'year' ? PRO_USD_ANNUAL : PRO_USD_MONTHLY

      const response = await fetch('/api/moneroo/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          description: `Excel Mastery Pro (${interval})${trial ? ' - Free Trial' : ''}`,
          interval,
          trialDays: trial ? 14 : 0,
          customerEmail: searchParams.get('email') || email,
          country: nationality,
          displayCurrency: currency,
          returnUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/dashboard?payment=cancelled`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to initialize payment')
      }

      const data = await response.json()
      console.log('Payment initialization response:', data)
      
      if (data.requiresRedirect && data.paymentUrl) {
        // Redirect to Moneroo payment page
        window.location.href = data.paymentUrl
      } else if (data.paymentCompleted) {
        // Payment completed directly, redirect to success page
        window.location.href = '/dashboard?payment=success'
      } else {
        // Payment initiated successfully, show payment instructions
        setPaymentData(data)
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initialization failed')
      setLoading(false)
    }
  }

  const displayPrice = useMemo(() => {
    const nationality = ((searchParams.get('nationality') || userDoc?.nationality || '') as string).toUpperCase()
    const currency = getCurrencyForCountry(nationality)
    const base = interval === 'year' ? PRO_USD_ANNUAL : PRO_USD_MONTHLY
    if (!fx) return formatPrice(base, currency)
    const rate = fx[currency]
    if (!rate || typeof rate !== 'number') return formatPrice(base, currency)
    const converted = base * rate
    return formatPrice(converted, currency)
  }, [fx, searchParams, interval, userDoc?.nationality])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-10 text-center">
        <h1 className="text-xl font-semibold mb-2">Initialisation du paiement...</h1>
        <p className="text-muted-foreground mb-4">Redirection vers Moneroo en cours...</p>
        <p className="text-sm text-muted-foreground">Montant: {displayPrice} {interval === 'year' ? '(annuel - 2 mois offerts)' : '(mensuel)'}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-xl font-semibold mb-4">Erreur de paiement</h1>
        <p className="text-red-500 mb-4">{error}</p>
        <div className="flex gap-2">
          <Button onClick={initializePayment}>Réessayer</Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    )
  }

  if (paymentData) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold mb-2">Paiement initialisé avec succès</h1>
          <p className="text-muted-foreground">Votre paiement a été préparé. Suivez les instructions ci-dessous pour finaliser votre abonnement.</p>
        </div>

        <div className="bg-card border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Détails du paiement</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant:</span>
              <span className="font-semibold">{displayPrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Période:</span>
              <span>{interval === 'year' ? 'Annuel (2 mois offerts)' : 'Mensuel'}</span>
            </div>
            {trial && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Essai gratuit:</span>
                <span className="text-green-600 font-semibold">14 jours</span>
              </div>
            )}
            {paymentData.paymentId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID de paiement:</span>
                <span className="font-mono text-sm">{paymentData.paymentId}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Instructions de paiement</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>✅ Votre paiement a été initialisé avec Moneroo</p>
            <p>📧 Un email avec les instructions détaillées a été envoyé à <strong>{email}</strong></p>
            <p>💳 Les méthodes de paiement disponibles incluent:</p>
            <ul className="ml-4 space-y-1">
              <li>• Virement bancaire</li>
              <li>• Mobile Money (Orange Money, MTN Money, etc.)</li>
              <li>• Cartes bancaires</li>
              <li>• Cryptomonnaies</li>
            </ul>
            <p>🔄 Une fois le paiement confirmé, votre compte sera automatiquement mis à jour</p>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Retour au tableau de bord
          </Button>
          <Button onClick={initializePayment}>
            Nouveau paiement
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-xl font-semibold">Paiement Moneroo</h1>
      <p className="text-muted-foreground mt-2">Redirection en cours...</p>
      <p className="text-sm text-muted-foreground mt-2">Montant: {displayPrice} {interval === 'year' ? '(annuel - 2 mois offerts)' : '(mensuel)'}{trial ? ' • Essai gratuit 14 jours' : ''}</p>
    </div>
  )
}


