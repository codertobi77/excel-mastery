import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

const CONVERSATIONS_TAG = 'conversations'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json([], { status: 200 })
  const list = await convex.query((api as any).conversations.listByClerk, { clerkId: userId }).catch(() => [])
  return NextResponse.json(list, { status: 200, headers: { 'Cache-Tag': CONVERSATIONS_TAG } })
}

export async function POST() {
  revalidateTag(CONVERSATIONS_TAG)
  return NextResponse.json({ ok: true })
}


