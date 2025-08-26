// Deprecated: custom JWT/PG auth replaced by Clerk. This route is intentionally disabled.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, message: "Legacy auth route disabled. Use Clerk sign-in." },
    { status: 410 }
  );
}
