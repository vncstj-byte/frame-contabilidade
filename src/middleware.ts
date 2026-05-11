import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register", "/auth/callback", "/forgot-password", "/reset-password", "/api/auth/", "/onboarding", "/api/profile"];

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

  const accessToken = session?.access_token;
  const userId = session?.user?.id;
  if (!accessToken || !userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const exp = session.expires_at;
  if (exp && exp < Math.floor(Date.now() / 1000)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const profileRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=role,status`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!profileRes.ok) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const profiles = await profileRes.json();
  const profile = profiles?.[0];

  if (!profile || profile.status === "inativo") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && profile.role === "cliente") {
    return NextResponse.redirect(new URL("/client", request.url));
  }

  if (pathname.startsWith("/client") && profile.role !== "cliente") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo-frame.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
