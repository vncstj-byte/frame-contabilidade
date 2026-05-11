import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET() {
  const auth = await authenticateRequest();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("contrato_url")
    .eq("user_id", auth.userId)
    .single();

  if (!client?.contrato_url) {
    return NextResponse.json({ error: "Nenhum contrato encontrado" }, { status: 404 });
  }

  const { data: signed } = await supabase.storage
    .from("contracts")
    .createSignedUrl(client.contrato_url, 60);

  if (!signed?.signedUrl) {
    return NextResponse.json({ error: "Erro ao gerar link" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
