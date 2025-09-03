"use client"
import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'

export default function AppBootstrap() {
  const { user } = useUser()
  const setUser = useAppStore((s) => s.setUser)
  const setLastConversationId = useAppStore((s) => s.setLastConversationId)
  const prevUserIdRef = useRef<string | null>(null)
  const prevEmailRef = useRef<string | null>(null)
  const prevUpdatedAtRef = useRef<number | null>(null)

  useEffect(() => {
    // register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    // hydrate from Clerk
    if (user) {
      setUser({
        userId: user.id,
        fullName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
        email: user.primaryEmailAddress?.emailAddress || '',
        avatarUrl: user.imageUrl || '',
      })
    }
    // auth toasts on state transitions
    const prev = prevUserIdRef.current
    const curr = user?.id || null
    if (prev === null && curr) {
      // new session; detect sign up (first creation) vs sign in
      const createdAt = user?.createdAt ? new Date(user.createdAt).getTime() : 0
      const now = Date.now()
      const justCreated = createdAt && Math.abs(now - createdAt) < 5 * 60 * 1000
      toast.success(justCreated ? 'Inscription réussie - bienvenue !' : 'Connexion réussie')
    } else if (prev && curr === null) {
      toast.success('Déconnexion réussie')
    }
    prevUserIdRef.current = curr

    // profile change toasts (email/password or other security updates)
    const currentEmail = user?.primaryEmailAddress?.emailAddress || null
    const currentUpdatedAt = user?.updatedAt ? new Date(user.updatedAt).getTime() : null
    if (prevEmailRef.current && currentEmail && prevEmailRef.current !== currentEmail) {
      toast.success('Adresse e-mail mise à jour')
    }
    // if updatedAt changed without email change, assume security settings change (e.g., password)
    if (
      prevUpdatedAtRef.current && currentUpdatedAt &&
      currentUpdatedAt !== prevUpdatedAtRef.current &&
      currentEmail === prevEmailRef.current
    ) {
      toast.success('Paramètres de sécurité mis à jour')
    }
    prevEmailRef.current = currentEmail
    prevUpdatedAtRef.current = currentUpdatedAt
  }, [user, setUser])

  useEffect(() => {
    // fetch consolidated info
    const run = async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (data?.lastConversationId) setLastConversationId(data.lastConversationId)
        if (data?.plan || data?.credits !== undefined) {
          setUser({ plan: data.plan, credits: data.credits })
        }
        // If profile is complete and no plan yet, notify plan modal
        if (data?.plan === 'FREE' || data?.plan === undefined) {
          const pm: any = (window as any).Clerk?.user?.publicMetadata || {}
          const isComplete = Boolean(pm?.profileCompleted || (pm?.gender && pm?.age && pm?.nationality))
          if (isComplete) {
            try { window.dispatchEvent(new CustomEvent('PROFILE_COMPLETED')) } catch {}
          }
        }
        // ask SW to prefetch common endpoints
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'PREFETCH',
            urls: ['/api/conversations', '/api/courses'],
          })
        }
      } catch {}
    }
    run()
  }, [setUser, setLastConversationId])

  return null
}


