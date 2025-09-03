"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@clerk/nextjs'

export default function ClerkPaymentPage() {
  const router = useRouter()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)

  // Check if user has active subscription
  const hasActiveSubscription = user?.publicMetadata?.subscriptionStatus === 'active'
  const userPlan = user?.publicMetadata?.plan || 'free'

  const handleSubscribe = async (plan: 'pro') => {
    if (!user) {
      router.push('/sign-in')
      return
    }

    setLoading(true)
    try {
      // Redirect to Clerk's built-in billing portal (if enabled)
      // Option A: If you expose a route to Clerk's billing portal, navigate there
      // Replace with your Clerk-hosted billing URL if provided
      window.location.href = '/user/billing' // Typical route if using <UserProfile> with billing, adjust if different
    } catch (error) {
      console.error('Subscription error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Choisissez votre plan</h1>
        <p className="text-muted-foreground mt-2">
          Débloquez toutes les fonctionnalités d'Excel Mastery
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Gratuit</CardTitle>
            <CardDescription>Parfait pour commencer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">0€</div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                50 crédits offerts
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Accès aux cours de base
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Support communautaire
              </li>
            </ul>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/dashboard')}
            >
              {userPlan === 'free' ? 'Plan actuel' : 'Retour au dashboard'}
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Pro
              <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded">
                Recommandé
              </span>
            </CardTitle>
            <CardDescription>Pour les utilisateurs avancés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">29,99€<span className="text-sm font-normal">/mois</span></div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Accès illimité à tous les services
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Tuteur IA personnel
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Exercices avancés
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Support prioritaire
              </li>
            </ul>
            <Button 
              className="w-full"
              onClick={() => handleSubscribe('pro')}
              disabled={loading || hasActiveSubscription}
            >
              {loading ? 'Traitement...' : 
               hasActiveSubscription ? 'Abonnement actif' : 
               userPlan === 'pro' ? 'Plan actuel' : 'Passer à Pro'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Tous les plans incluent une garantie de remboursement de 30 jours.
          <br />
          Vous pouvez changer ou annuler votre plan à tout moment.
        </p>
      </div>
    </div>
  )
}


