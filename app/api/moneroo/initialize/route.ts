import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { amount, currency, description, customerEmail, returnUrl, cancelUrl, country, displayCurrency } = body

    // Validate required fields
    if (!amount || !currency || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const MONEROO_SECRET_KEY = process.env.MONEROO_SECRET_KEY
    if (!MONEROO_SECRET_KEY) {
      return NextResponse.json({ error: 'Moneroo not configured' }, { status: 500 })
    }

    // Initialize payment with Moneroo API
    const monerooResponse = await fetch('https://api.moneroo.io/v1/payments/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MONEROO_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to cents
        currency: currency,
        description: description,
        customer: {
          email: customerEmail,
          country: country,
        },
        return_url: returnUrl,
        cancel_url: cancelUrl,
        metadata: {
          user_id: userId,
          plan: 'PRO',
          email: customerEmail,
          country,
          display_currency: displayCurrency,
        },
      }),
    })

    if (!monerooResponse.ok) {
      const errorData = await monerooResponse.text()
      console.error('Moneroo API error:', errorData)
      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 })
    }

    const paymentData = await monerooResponse.json()
    
    return NextResponse.json({
      paymentUrl: paymentData.payment_url,
      paymentId: paymentData.id,
    })
  } catch (error) {
    console.error('Moneroo initialization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
