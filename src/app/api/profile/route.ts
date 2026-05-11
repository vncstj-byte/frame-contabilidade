import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET() {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  return NextResponse.json({ data: auth.profile });
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.full_name !== undefined) updates.full_name = body.full_name;
  if (body.cpf !== undefined) updates.cpf = body.cpf;
  if (body.onboarding_complete !== undefined) updates.onboarding_complete = body.onboarding_complete;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", auth.userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
  return NextResponse.json({ data });
}
