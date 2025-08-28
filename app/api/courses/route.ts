import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

const COURSES_TAG = 'courses'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function GET() {
  const list = await convex.query((api as any).courses.list).catch(() => [])
  return NextResponse.json(list, { status: 200, headers: { 'Cache-Tag': COURSES_TAG } })
}

export async function POST() {
  revalidateTag(COURSES_TAG)
  return NextResponse.json({ ok: true })
}


