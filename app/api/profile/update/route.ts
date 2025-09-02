import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const gender = typeof body.gender === 'string' ? body.gender : undefined
    const age = typeof body.age === 'number' ? body.age : undefined
    const nationality = typeof body.nationality === 'string' ? body.nationality : undefined

    // Update Clerk publicMetadata
    const cc = await clerkClient()
    await cc.users.updateUser(userId, {
      publicMetadata: {
        gender,
        age,
        nationality,
        profileCompleted: Boolean(gender && age && nationality),
      },
    })

    // Fetch email to sync Convex
    const user = await cc.users.getUser(userId)
    const email = user?.emailAddresses?.[0]?.emailAddress
    if (email) {
      await convex.mutation((api as any).users.updateProfileByEmail, {
        email,
        gender,
        age,
        nationality,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


