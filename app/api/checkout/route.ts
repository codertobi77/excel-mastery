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

    // Determine providers by country
    const normalized = (country || '').toUpperCase()
    const providers: Array<'CLERK' | 'MONEROO'> = []
    // Example routing: EU -> Clerk card; Africa -> Moneroo; fallback both if available
    const EU = new Set(['FR','BE','DE','ES','IT','NL','PT','IE','FI','SE','NO','DK','PL','AT','CZ','HU','RO','BG','HR','SI','SK','EE','LV','LT','GR','LU','MT','CY'])
    const AFRICA = new Set(['CM','SN','CI','GH','NG','KE','ZA','MA','TN','DZ'])
    if (EU.has(normalized)) providers.push('CLERK')
    if (AFRICA.has(normalized)) providers.push('MONEROO')
    if (providers.length === 0) providers.push('CLERK')

    // Create a placeholder checkout session URL(s)
    // TODO: Integrate real providers. For now, just return routing info.
    return NextResponse.json({
      providers,
      plan,
      country: normalized,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


