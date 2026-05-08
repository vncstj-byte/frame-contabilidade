import Image from "next/image";
import Link from "next/link";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const { error, success } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(220 40% 6%) 0%, hsl(30 20% 8%) 100%)" }}>
      <div className="w-full max-w-sm relative z-10 border border-primary/40 rounded-2xl p-10">
        <div className="flex flex-col items-center mb-12">
          <Image src="/logo-frame.png" alt="FRAME" width={320} height={115} className="object-contain" priority />
          <p className="text-muted-foreground/20 text-[11px] tracking-[0.2em] uppercase -mt-10">Contabilidade para Advogados</p>
        </div>

        <form action="/api/auth/login" method="POST" className="space-y-5">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error === "invalid" ? "Email ou senha inválidos." : "Preencha todos os campos."}
            </div>
          )}

          {success === "password-reset" && (
            <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg text-sm">
              Senha atualizada com sucesso. Faça login.
            </div>
          )}

          {success === "reset-sent" && (
            <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg text-sm">
              Link de recuperação enviado para o seu email.
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[11px] text-muted-foreground/60 font-semibold tracking-[0.15em] uppercase block">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              required
              className="w-full bg-transparent border border-primary/40 rounded-xl px-4 py-3 text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[11px] text-muted-foreground/60 font-semibold tracking-[0.15em] uppercase block">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="w-full bg-transparent border border-primary/40 rounded-xl px-4 py-3 text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/20"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/85 text-primary-foreground font-semibold py-3 rounded-xl transition-all mt-4 shadow-lg shadow-primary/25"
          >
            Entrar
          </button>

          <div className="text-center pt-2 space-y-2">
            <Link href="/forgot-password" className="text-sm text-muted-foreground/50 hover:text-primary transition-colors block">
              Esqueceu a senha?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
