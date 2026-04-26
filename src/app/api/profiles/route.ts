import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest, requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!requireAdmin(auth)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").order("full_name");

  if (error) return NextResponse.json({ error: "Erro ao buscar perfis" }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (auth.profile.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await request.json();
  const { id, role, status } = body;

  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const updates: Record<string, string> = {};
  if (role) updates.role = role;
  if (status) updates.status = status;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  return NextResponse.json({ data });
}
