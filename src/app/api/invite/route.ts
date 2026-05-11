import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest, requireAdmin } from "@/lib/api-auth";
import { sendInviteEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!requireAdmin(auth)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { email, role, full_name } = await request.json();
  if (!email || !role) {
    return NextResponse.json({ error: "Email e role são obrigatórios" }, { status: 400 });
  }

  const validRoles = ["admin", "gestor", "cliente"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Role inválido" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  const { data: existing } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Usuário já cadastrado com esse email" }, { status: 400 });
  }

  const tempPassword = crypto.randomBytes(6).toString("base64url");

  const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: full_name || email.split("@")[0] },
  });

  if (createError || !newUser.user) {
    return NextResponse.json(
      { error: createError?.message || "Erro ao criar usuário" },
      { status: 500 }
    );
  }

  const { error: profileError } = await adminSupabase
    .from("profiles")
    .upsert({
      id: newUser.user.id,
      email,
      full_name: full_name || email.split("@")[0],
      role,
      status: "ativo",
      onboarding_complete: false,
    });

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: "Erro ao criar perfil" }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const loginUrl = `${origin}/login`;

  try {
    await sendInviteEmail(email, role, tempPassword, loginUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({
      ok: true,
      warning: `Usuário criado, mas o email falhou: ${message}`,
      tempPassword,
    });
  }

  return NextResponse.json({ ok: true, emailSent: true });
}
