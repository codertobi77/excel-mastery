import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ user: null }, { status: 200 })

    // fetch user document (credits/plan/etc.)
    const userDoc = await convex.query((api as any).users.getByClerkId, { clerkId: userId }).catch(() => null)

    return NextResponse.json({
      plan: userDoc?.plan ?? 'FREE',
      credits: userDoc?.credits ?? 0,
      lastConversationId: userDoc?.lastConversationId ?? null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


