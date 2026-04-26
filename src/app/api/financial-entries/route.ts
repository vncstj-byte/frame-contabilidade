import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest, requireAdmin } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const rl = rateLimit(auth.userId, 120);
  if (!rl.ok) return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });

  const supabase = await createClient();
  const { searchParams } = request.nextUrl;
  const months = searchParams.get("months")?.split(",") ?? [];
  const clientId = searchParams.get("client_id");
  const all = searchParams.get("all") === "true";

  if (auth.profile.role === "cliente") {
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", auth.userId)
      .single();

    if (!client) return NextResponse.json({ data: [] });

    let query = supabase.from("financial_entries").select("*").eq("client_id", client.id);
    if (!all && months.length > 0) {
      query = query.in("reference_month", months);
    }
    query = query.order("reference_month", { ascending: false });
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
    return NextResponse.json({ data: data ?? [] });
  }

  if (!requireAdmin(auth)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  let query = supabase.from("financial_entries").select("*");
  if (!all) {
    if (months.length > 0) query = query.in("reference_month", months);
    if (clientId && clientId !== "all") query = query.eq("client_id", clientId);
  }
  query = query.order("reference_month", { ascending: false });
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!requireAdmin(auth)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await request.json();
  const { client_id, reference_month, entry_date, type, category_group, category, amount, description } = body;

  if (!client_id || !reference_month || !type || !category_group || !category || !amount) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("financial_entries")
    .insert({
      client_id,
      reference_month,
      entry_date: entry_date || new Date().toISOString().slice(0, 10),
      type,
      category_group,
      category,
      amount: Number(amount),
      description: description || null,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Erro ao criar lançamento" }, { status: 500 });
  audit({ userId: auth.userId, userEmail: auth.profile.email, action: "create", resource: "financial_entries", resourceId: data?.id, details: { client_id, category }, ip: request.headers.get("x-forwarded-for") ?? undefined });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!requireAdmin(auth)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  if (updates.amount) updates.amount = Number(updates.amount);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("financial_entries")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  audit({ userId: auth.userId, userEmail: auth.profile.email, action: "update", resource: "financial_entries", resourceId: id, ip: request.headers.get("x-forwarded-for") ?? undefined });
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
  const { error } = await supabase.from("financial_entries").delete().eq("id", id);

  if (error) return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  audit({ userId: auth.userId, userEmail: auth.profile.email, action: "delete", resource: "financial_entries", resourceId: id, ip: request.headers.get("x-forwarded-for") ?? undefined });
  return NextResponse.json({ ok: true });
}
