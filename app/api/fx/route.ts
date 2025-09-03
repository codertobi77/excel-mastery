import { NextResponse } from 'next/server'

// Simple FX proxy endpoint using a public API (you can swap providers)
// Note: For production, prefer a paid, reliable provider (e.g., OpenExchangeRates, CurrencyLayer)

const PROVIDER_URL = 'https://api.exchangerate.host/latest?base=USD'

// In-memory cache (5 minutes)
let cached: { rates: Record<string, number>; timestamp: number } | null = null
const TTL_MS = 5 * 60 * 1000

export async function GET() {
  try {
    const now = Date.now()
    if (cached && now - cached.timestamp < TTL_MS) {
      return NextResponse.json({ base: 'USD', rates: cached.rates, timestamp: cached.timestamp })
    }

    const res = await fetch(PROVIDER_URL, { cache: 'no-store' })
    if (!res.ok) {
      // Fallback to cache if available
      if (cached) return NextResponse.json({ base: 'USD', rates: cached.rates, timestamp: cached.timestamp })
      return NextResponse.json({ error: 'FX fetch failed' }, { status: 502 })
    }
    const data = await res.json()
    const rates = data?.rates || {}
    cached = { rates, timestamp: now }
    return NextResponse.json({ base: 'USD', rates, timestamp: now })
  } catch (e: any) {
    // Fallback to cache if available
    if (cached) return NextResponse.json({ base: 'USD', rates: cached.rates, timestamp: cached.timestamp })
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


