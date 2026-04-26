import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET() {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  return NextResponse.json({ data: auth.profile });
}

export async function PUT() {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  return NextResponse.json({ data: auth.profile });
}
