import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest, requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!requireAdmin(auth)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").select("*").order("nome_empresa");

  if (error) return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!requireAdmin(auth)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await request.json();
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").insert(body).select().single();

  if (error) return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!requireAdmin(auth)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").update(updates).eq("id", id).select().single();

  if (error) return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!requireAdmin(auth)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
