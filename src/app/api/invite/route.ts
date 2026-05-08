import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInviteEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "gestor") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { email, role, full_name } = await request.json();
  if (!email || !role) {
    return NextResponse.json({ error: "Email e role são obrigatórios" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
  const alreadyExists = existingUsers?.users?.some(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (alreadyExists) {
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
    });

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: "Erro ao criar perfil" }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const loginUrl = `${origin}/login`;

  try {
    await sendInviteEmail(email, role, tempPassword, loginUrl);
  } catch {
    // User was created but email failed — don't rollback, just warn
    return NextResponse.json({
      ok: true,
      warning: "Usuário criado, mas o email não foi enviado. Informe a senha manualmente.",
      tempPassword,
    });
  }

  return NextResponse.json({ ok: true });
}
