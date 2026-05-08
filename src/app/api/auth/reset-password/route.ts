import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;
  const token = formData.get("token") as string;

  if (password !== confirm) {
    return NextResponse.redirect(new URL(`/reset-password?token=${token}&error=mismatch`, request.url), 303);
  }

  if (!password || password.length < 6) {
    return NextResponse.redirect(new URL(`/reset-password?token=${token}&error=weak`, request.url), 303);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return NextResponse.redirect(new URL(`/reset-password?token=${token}&error=failed`, request.url), 303);
  }

  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login?success=password-reset", request.url), 303);
}
