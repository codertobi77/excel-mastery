import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const ADMIN_EMAIL = process.env.FEEDBACK_ADMIN_EMAIL || process.env.NEXT_PUBLIC_FEEDBACK_ADMIN_EMAIL

export async function POST(req: Request) {
  try {
    const { name, email, description } = await req.json()
    if (!name || !email || !description) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }
    if (!resend || !ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Service de messagerie non configuré' }, { status: 500 })
    }

    const subject = `Feedback - ${name}`
    // Corps du mail: uniquement le contenu du champ description
    const html = `${escapeHtml(description)}`

    await resend.emails.send({
      from: 'no-reply@resend.dev',
      to: ADMIN_EMAIL,
      replyTo: email,
      subject,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 })
  }
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}


