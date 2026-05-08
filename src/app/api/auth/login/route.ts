import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  let email: string | null = null;
  let password: string | null = null;

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    email = body.email;
    password = body.password;
  } else {
    const formData = await request.formData();
    email = formData.get("email") as string;
    password = formData.get("password") as string;
  }

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?error=missing", request.url), 303);
  }

  const redirectResponse = (path: string) => {
    const res = NextResponse.redirect(new URL(path, request.url), 303);
    cookiesToSet.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options);
    });
    return res;
  };

  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach((c) => cookiesToSet.push(c));
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url), 303);
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const dest = profile?.role === "cliente" ? "/client" : "/admin/dashboard";
  return redirectResponse(dest);
}
