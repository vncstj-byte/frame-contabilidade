import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) {
    return NextResponse.redirect(new URL("/forgot-password?error=missing", request.url), 303);
  }

  const supabase = createAdminClient();
  const origin = new URL(request.url).origin;

  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await supabase.from("password_reset_tokens").insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    const resetUrl = `${origin}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch {
      // silently fail to not leak whether email exists
    }
  }

  // Always redirect with success to not leak whether email exists
  return NextResponse.redirect(new URL("/login?success=reset-sent", request.url), 303);
}
