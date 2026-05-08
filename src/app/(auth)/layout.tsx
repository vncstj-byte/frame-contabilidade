"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const timeout = setTimeout(() => setReady(true), 3000);

    async function checkAuth() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          clearTimeout(timeout);
          if (profile?.role === "cliente") {
            router.replace("/client");
          } else {
            router.replace("/admin/dashboard");
          }
          return;
        }
      } catch {
        // auth check failed — show login form anyway
      }

      clearTimeout(timeout);
      setReady(true);
    }

    checkAuth();
    return () => clearTimeout(timeout);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse text-sm">Carregando...</p>
      </div>
    );
  }

  return <>{children}</>;
}
