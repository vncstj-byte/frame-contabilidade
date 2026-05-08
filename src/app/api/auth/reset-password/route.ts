import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;
  const token = formData.get("token") as string;

  if (!token) {
    return NextResponse.redirect(new URL("/forgot-password?error=invalid", request.url), 303);
  }

  if (password !== confirm) {
    return NextResponse.redirect(new URL(`/reset-password?token=${token}&error=mismatch`, request.url), 303);
  }

  if (!password || password.length < 6) {
    return NextResponse.redirect(new URL(`/reset-password?token=${token}&error=weak`, request.url), 303);
  }

  const supabase = createAdminClient();

  const { data: tokenRecord } = await supabase
    .from("password_reset_tokens")
    .select("*")
    .eq("token", token)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!tokenRecord) {
    return NextResponse.redirect(new URL("/forgot-password?error=expired", request.url), 303);
  }

  const { error } = await supabase.auth.admin.updateUserById(tokenRecord.user_id, {
    password,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/reset-password?token=${token}&error=failed`, request.url), 303);
  }

  await supabase
    .from("password_reset_tokens")
    .update({ used: true })
    .eq("id", tokenRecord.id);

  return NextResponse.redirect(new URL("/login?success=password-reset", request.url), 303);
}
