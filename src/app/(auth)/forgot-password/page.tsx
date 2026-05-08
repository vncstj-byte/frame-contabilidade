import Image from "next/image";
import Link from "next/link";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(220 40% 6%) 0%, hsl(30 20% 8%) 100%)" }}>
      <div className="w-full max-w-sm relative z-10 border border-primary/40 rounded-2xl p-10">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo-frame.png" alt="FRAME" width={240} height={86} className="object-contain" priority />
        </div>

        <h2 className="text-lg font-semibold text-center mb-2">Recuperar senha</h2>
        <p className="text-sm text-muted-foreground/60 text-center mb-6">
          Informe seu email para receber o link de recuperação.
        </p>

        <form action="/api/auth/forgot-password" method="POST" className="space-y-5">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error === "not-found" ? "Email não encontrado." : "Erro ao enviar. Tente novamente."}
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

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/85 text-primary-foreground font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/25"
          >
            Enviar link de recuperação
          </button>

          <Link href="/login" className="text-sm text-muted-foreground/50 hover:text-primary transition-colors block text-center pt-2">
            Voltar ao login
          </Link>
        </form>
      </div>
    </div>
  );
}
