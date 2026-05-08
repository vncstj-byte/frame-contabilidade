import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ROUTES = ["/login", "/register", "/auth/callback", "/api/auth/login", "/api/debug-auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("sb-ejgpwrejtqrquegwrqbq-auth-token");

  if (!authCookie?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let session;
  try {
    const raw = authCookie.value.startsWith("base64-")
      ? atob(authCookie.value.slice(7))
      : authCookie.value;
    session = JSON.parse(raw);
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!session?.access_token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const exp = session.expires_at;
  if (exp && exp < Math.floor(Date.now() / 1000)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const userId = session.user?.id;
  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", userId)
    .single();

  if (!profile || profile.status === "inativo") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && profile.role === "cliente") {
    return NextResponse.redirect(new URL("/client", request.url));
  }

  if (pathname.startsWith("/client") && profile.role !== "cliente") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo-frame.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
