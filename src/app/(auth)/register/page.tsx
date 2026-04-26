"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "cliente",
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-foreground mb-2">Verifique seu email</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Enviamos um link de confirmação para <strong className="text-foreground">{email}</strong>.
            Clique no link para ativar sua conta.
          </p>
          <Link href="/login">
            <button className="border border-border text-foreground font-medium px-6 py-2.5 rounded-lg hover:bg-secondary transition-colors">
              Voltar ao login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Image src="/logo-frame.png" alt="FRAME" width={160} height={64} className="object-contain mx-auto mb-4" priority />
            <p className="text-muted-foreground text-sm">Crie sua conta de cliente</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="fullName" className="text-xs text-muted-foreground font-medium tracking-wider block">NOME COMPLETO</label>
              <input
                id="fullName"
                type="text"
                placeholder="Seu nome"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm focus:border-primary/50 outline-none transition-colors placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-xs text-muted-foreground font-medium tracking-wider block">EMAIL</label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm focus:border-primary/50 outline-none transition-colors placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs text-muted-foreground font-medium tracking-wider block">SENHA</label>
              <input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm focus:border-primary/50 outline-none transition-colors placeholder:text-muted-foreground/40"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>

            <p className="text-sm text-muted-foreground text-center">
              Já tem conta?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Fazer login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
