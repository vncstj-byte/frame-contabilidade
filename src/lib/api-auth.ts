import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export type AuthResult =
  | { ok: true; userId: string; profile: Profile }
  | { ok: false; status: number; message: string };

export async function authenticateRequest(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, message: "Não autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status === "inativo") {
    return { ok: false, status: 403, message: "Acesso negado" };
  }

  return { ok: true, userId: user.id, profile };
}

export function requireAdmin(auth: Extract<AuthResult, { ok: true }>) {
  return auth.profile.role === "admin" || auth.profile.role === "gestor";
}
