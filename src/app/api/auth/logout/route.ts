import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(`${origin}/login`, 302);

  const cookieStore = await cookies();
  cookieStore.getAll().forEach((cookie) => {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", { maxAge: 0, path: "/" });
    }
  });

  return response;
}
