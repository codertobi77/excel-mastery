"use client"

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getCurrencyForCountry, PRO_USD_PRICE } from '@/lib/billing'
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
  const [fx, setFx] = useState<Record<string, number> | null>(null)

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
      const nationality = (searchParams.get('nationality') || '').toUpperCase()
      const currency = getCurrencyForCountry(nationality)
      const amount = PRO_USD_PRICE // canonical USD price for charge

      const response = await fetch('/api/moneroo/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          description: 'Excel Mastery Pro Plan',
          customerEmail: searchParams.get('email') || '',
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
      
      if (data.paymentUrl) {
        // Redirect to Moneroo payment page
        window.location.href = data.paymentUrl
      } else {
        throw new Error('No payment URL received')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initialization failed')
      setLoading(false)
    }
  }

  const displayPrice = useMemo(() => {
    const nationality = (searchParams.get('nationality') || '').toUpperCase()
    const currency = getCurrencyForCountry(nationality)
    if (!fx) return formatPrice(PRO_USD_PRICE, currency)
    const rate = fx[currency]
    if (!rate || typeof rate !== 'number') return formatPrice(PRO_USD_PRICE, currency)
    const converted = PRO_USD_PRICE * rate
    return formatPrice(converted, currency)
  }, [fx, searchParams])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-10 text-center">
        <h1 className="text-xl font-semibold mb-2">Initialisation du paiement...</h1>
        <p className="text-muted-foreground mb-4">Redirection vers Moneroo en cours...</p>
        <p className="text-sm text-muted-foreground">Montant: {displayPrice}</p>
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

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-xl font-semibold">Paiement Moneroo</h1>
      <p className="text-muted-foreground mt-2">Redirection en cours...</p>
      <p className="text-sm text-muted-foreground mt-2">Montant: {displayPrice}</p>
    </div>
  )
}


