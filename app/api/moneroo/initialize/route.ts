import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { amount, currency, description, customerEmail, returnUrl, cancelUrl, country, displayCurrency, interval, trialDays } = body

    console.log('Moneroo initialize request:', { amount, currency, description, customerEmail, country, interval, trialDays })

    // Validate required fields
    if (!amount || !currency || !description) {
      return NextResponse.json({ error: 'Missing required fields', received: { amount, currency, description } }, { status: 400 })
    }

    // Try different possible environment variable names
    const MONEROO_SECRET_KEY = process.env.MONEROO_SECRET_KEY || 
                              process.env.MONEROO_API_KEY || 
                              process.env.MONEROO_KEY
                              
    console.log('Moneroo API key check:', {
      hasSecretKey: !!process.env.MONEROO_SECRET_KEY,
      hasApiKey: !!process.env.MONEROO_API_KEY,
      hasKey: !!process.env.MONEROO_KEY,
      keyLength: MONEROO_SECRET_KEY ? MONEROO_SECRET_KEY.length : 0,
      keyPrefix: MONEROO_SECRET_KEY ? MONEROO_SECRET_KEY.substring(0, 8) + '...' : 'none'
    })
    
    if (!MONEROO_SECRET_KEY) {
      return NextResponse.json({ error: 'Moneroo not configured - no API key found' }, { status: 500 })
    }

    // Prepare Moneroo payload
    const monerooPayload: any = {
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
        interval: interval === 'year' ? 'year' : 'month',
        trial_days: typeof trialDays === 'number' && trialDays > 0 ? Math.min(30, trialDays) : 0,
      },
    }

    // Add subscription only if it's a recurring payment
    if (interval && interval !== 'one-time') {
      monerooPayload.subscription = {
        interval: interval === 'year' ? 'year' : 'month',
        trial_days: typeof trialDays === 'number' && trialDays > 0 ? Math.min(30, trialDays) : 0,
      }
    }

    console.log('Moneroo API payload:', JSON.stringify(monerooPayload, null, 2))
    console.log('Authorization header:', `Bearer ${MONEROO_SECRET_KEY.substring(0, 8)}...`)

    // Initialize payment with Moneroo API
    const monerooResponse = await fetch('https://api.moneroo.io/v1/payments/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MONEROO_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(monerooPayload),
    })

    if (!monerooResponse.ok) {
      const errorData = await monerooResponse.text()
      console.error('Moneroo API error:', {
        status: monerooResponse.status,
        statusText: monerooResponse.statusText,
        body: errorData
      })
      return NextResponse.json({ 
        error: 'Payment initialization failed', 
        details: errorData,
        status: monerooResponse.status 
      }, { status: 500 })
    }

    const paymentData = await monerooResponse.json()
    
    return NextResponse.json({
      paymentUrl: paymentData.payment_url,
      paymentId: paymentData.id,
    })
  } catch (error) {
    console.error('Moneroo initialization error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
