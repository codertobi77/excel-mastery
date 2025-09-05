import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

type CheckoutBody = {
  country: string
  plan: 'PRO'
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { country, plan } = (await req.json()) as CheckoutBody
    if (plan !== 'PRO') return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    // Moneroo-only routing now
    const normalized = (country || '').toUpperCase()
    return NextResponse.json({
      providers: ['MONEROO'],
      plan,
      country: normalized,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


