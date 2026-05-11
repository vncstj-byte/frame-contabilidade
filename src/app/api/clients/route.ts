import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest, requireAdmin } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

const CLIENT_FIELDS = [
  "nome_empresa", "cnpj", "rua", "numero", "complemento", "bairro",
  "cidade", "estado", "cep", "nome_socio", "cpf_socio", "tipo_contrato",
  "valor_contrato", "prazo_contrato", "data_inicio_contrato",
  "data_termino_contrato", "contrato_url", "user_id",
] as const;

function pickClientFields(body: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const key of CLIENT_FIELDS) {
    if (key in body) result[key] = body[key];
  }
  return result;
}

export async function GET() {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!requireAdmin(auth)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const rl = rateLimit(auth.userId, 60);
  if (!rl.ok) return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });

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
  const allowed = pickClientFields(body);
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").insert(allowed).select().single();

  if (error) return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
  audit({ userId: auth.userId, userEmail: auth.profile.email, action: "create", resource: "clients", resourceId: data?.id, details: { nome_empresa: body.nome_empresa }, ip: request.headers.get("x-forwarded-for") ?? undefined });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!requireAdmin(auth)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await request.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const updates = pickClientFields(body);
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").update(updates).eq("id", id).select().single();

  if (error) return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  audit({ userId: auth.userId, userEmail: auth.profile.email, action: "update", resource: "clients", resourceId: id, ip: request.headers.get("x-forwarded-for") ?? undefined });
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
  audit({ userId: auth.userId, userEmail: auth.profile.email, action: "delete", resource: "clients", resourceId: id, ip: request.headers.get("x-forwarded-for") ?? undefined });
  return NextResponse.json({ ok: true });
}
