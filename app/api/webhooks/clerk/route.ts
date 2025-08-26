import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  const convexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)
  const hasWebhookSecret = Boolean(process.env.CLERK_WEBHOOK_SECRET)
  console.log("[ClerkWebhook][GET] Health", { convexUrl, hasWebhookSecret })
  return NextResponse.json({
    ok: true,
    env: {
      convexUrl,
      hasWebhookSecret,
    },
  });
}

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!SIGNING_SECRET) {
    console.error("[ClerkWebhook][POST] Missing CLERK_WEBHOOK_SECRET")
    return NextResponse.json({ error: "Missing CLERK_WEBHOOK_SECRET" }, { status: 500 });
  }

  // Verify signature
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.text();
  console.log("[ClerkWebhook][POST] Raw body length", payload?.length)
  const wh = new Webhook(SIGNING_SECRET);
  let evt: WebhookEvent;
  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
    console.log("[ClerkWebhook][POST] Verified event", { type: evt.type })
  } catch (err) {
    console.error("[ClerkWebhook][POST] Signature verification failed", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (evt.type === "user.created" || evt.type === "user.updated") {
      const user = evt.data;
      const email = user.email_addresses?.[0]?.email_address || "";
      const firstName = user.first_name || "";
      const lastName = user.last_name || "";
      const image = user.image_url || undefined;
      console.log("[ClerkWebhook][POST] Upserting user", { email, firstName, lastName, hasImage: Boolean(image) })

      await convex.mutation(api.users.upsertFromClerk, {
        email,
        firstName,
        lastName,
        image,
      });
      // Best-effort: trigger client notifications through a tag revalidation or queue
      // For now, just log. In production, push to a notification channel.
      if (evt.type === 'user.created') {
        console.log('[ClerkWebhook] user.created -> toast: Inscription réussie - bienvenue !')
      } else if (evt.type === 'user.updated') {
        console.log('[ClerkWebhook] user.updated -> toast: Profil mis à jour (email ou sécurité)')
      }
    }
    console.log("[ClerkWebhook][POST] Completed")
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[ClerkWebhook][POST] Upsert failed", e)
    return NextResponse.json({ error: "Upsert failed" }, { status: 500 });
  }
}


