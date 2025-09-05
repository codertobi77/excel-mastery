import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import crypto from 'crypto'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(req: Request) {
  try {
    const MONEROO_WEBHOOK_SECRET = process.env.MONEROO_WEBHOOK_SECRET
    if (!MONEROO_WEBHOOK_SECRET) {
      console.error('Missing MONEROO_WEBHOOK_SECRET')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const rawBody = await req.text()
    console.log('Moneroo webhook raw body:', rawBody)

    // Verify webhook signature (HMAC per doc): header x-moneroo-signature
    const headerPayload = await headers()
    const signature = headerPayload.get('x-moneroo-signature') || ''
    
    console.log('Webhook signature verification:', {
      hasSignature: !!signature,
      hasSecret: !!MONEROO_WEBHOOK_SECRET,
      signatureLength: signature.length
    })

    // Compute expected signature: HMAC SHA256 (assumed per doc)
    const expected = crypto.createHmac('sha256', MONEROO_WEBHOOK_SECRET).update(rawBody).digest('hex')
    if (expected !== signature) {
      console.error('Webhook signature mismatch:', {
        expected: expected.substring(0, 8) + '...',
        received: signature.substring(0, 8) + '...'
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody)
    console.log('Moneroo webhook received:', {
      event: event.event,
      type: event.type,
      data: event.data
    })

    // Handle different webhook events
    // Moneroo uses "event" field, not "type"
    const eventType = event.event || event.type
    switch (eventType) {
      case 'payment.success':
      case 'payment.succeeded':
        await handlePaymentSuccess(event.data)
        break
      case 'payment.failed':
        await handlePaymentFailure(event.data)
        break
      case 'payment.cancelled':
        await handlePaymentCancellation(event.data)
        break
      default:
        console.log('Unhandled webhook event type:', eventType)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Moneroo webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handlePaymentSuccess(paymentData: any) {
  try {
    console.log('Processing payment success:', paymentData)
    
    const userId = paymentData.metadata?.user_id
    if (!userId) {
      console.error('No user_id in payment metadata:', paymentData.metadata)
      return
    }

    const interval = paymentData.metadata?.interval
    const trialDays = Number(paymentData.metadata?.trial_days || 0)
    let trialEndsAt: number | null = null
    if (trialDays > 0) {
      trialEndsAt = Date.now() + trialDays * 24 * 60 * 60 * 1000
    }

    console.log('Updating user plan:', {
      userId,
      plan: 'PRO',
      interval,
      trialDays,
      trialEndsAt
    })

    // Update user plan to PRO
    const planResult = await convex.mutation((api as any).users.updatePlan, {
      clerkId: userId,
      plan: 'PRO',
    })
    console.log('Convex updatePlan result:', planResult)

    // Update subscription metadata
    const metaResult = await convex.mutation((api as any).users.updateSubscriptionMeta, {
      clerkId: userId,
      interval,
      trialEndsAt: trialEndsAt ?? undefined,
    })
    console.log('Convex updateSubscriptionMeta result:', metaResult)

    console.log('User successfully upgraded to PRO plan:', userId)
  } catch (error) {
    console.error('Error handling payment success:', error)
    throw error // Re-throw to ensure webhook returns error status
  }
}

async function handlePaymentFailure(paymentData: any) {
  console.log('Payment failed:', paymentData.id)
  // Could send notification email or update user status
}

async function handlePaymentCancellation(paymentData: any) {
  console.log('Payment cancelled:', paymentData.id)
  // Could update user status or send follow-up email
}
