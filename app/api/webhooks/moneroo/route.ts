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

    // Verify webhook signature (HMAC per doc): header x-moneroo-signature
    const headerPayload = await headers()
    const signature = headerPayload.get('x-moneroo-signature') || ''
    const rawBody = await req.text()

    // Compute expected signature: HMAC SHA256 (assumed per doc)
    const expected = crypto.createHmac('sha256', MONEROO_WEBHOOK_SECRET).update(rawBody).digest('hex')
    if (expected !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody)
    console.log('Moneroo webhook received:', event.type)

    // Handle different webhook events
    switch (event.type) {
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
        console.log('Unhandled webhook event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Moneroo webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handlePaymentSuccess(paymentData: any) {
  try {
    const userId = paymentData.metadata?.user_id
    if (!userId) {
      console.error('No user_id in payment metadata')
      return
    }

    // Update user plan to PRO
    await convex.mutation((api as any).users.updatePlan, {
      clerkId: userId,
      plan: 'PRO',
    })

    console.log('User upgraded to PRO plan:', userId)
  } catch (error) {
    console.error('Error handling payment success:', error)
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
