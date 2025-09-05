import { NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    console.log('Testing webhook for user:', userId)

    // Simulate payment success data
    const mockPaymentData = {
      id: 'test_payment_' + Date.now(),
      metadata: {
        user_id: userId,
        plan: 'PRO',
        interval: 'month',
        trial_days: 14,
        email: 'test@example.com',
        country: 'BENIN'
      }
    }

    // Update user plan to PRO
    const planResult = await convex.mutation((api as any).users.updatePlan, {
      clerkId: userId,
      plan: 'PRO',
    })
    console.log('Convex updatePlan result:', planResult)

    // Update subscription metadata
    const metaResult = await convex.mutation((api as any).users.updateSubscriptionMeta, {
      clerkId: userId,
      interval: 'PRO_MONTH',
      trialEndsAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
    })
    console.log('Convex updateSubscriptionMeta result:', metaResult)

    console.log('Test webhook completed successfully for user:', userId)

    return NextResponse.json({ 
      success: true, 
      message: 'User plan updated to PRO',
      userId 
    })
  } catch (error) {
    console.error('Test webhook error:', error)
    return NextResponse.json({ 
      error: 'Test webhook failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
