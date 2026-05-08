import Image from "next/image";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, hsl(220 40% 6%) 0%, hsl(30 20% 8%) 100%)" }}>
        <div className="w-full max-w-sm border border-primary/40 rounded-2xl p-10 text-center">
          <p className="text-destructive">Link inválido ou expirado.</p>
          <a href="/forgot-password" className="text-sm text-primary mt-4 block">Solicitar novo link</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(220 40% 6%) 0%, hsl(30 20% 8%) 100%)" }}>
      <div className="w-full max-w-sm relative z-10 border border-primary/40 rounded-2xl p-10">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo-frame.png" alt="FRAME" width={240} height={86} className="object-contain" priority />
        </div>

        <h2 className="text-lg font-semibold text-center mb-2">Nova senha</h2>
        <p className="text-sm text-muted-foreground/60 text-center mb-6">
          Escolha sua nova senha.
        </p>

        <form action="/api/auth/reset-password" method="POST" className="space-y-5">
          <input type="hidden" name="token" value={token} />

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error === "mismatch" ? "As senhas não coincidem." : "Erro ao atualizar. Tente novamente."}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[11px] text-muted-foreground/60 font-semibold tracking-[0.15em] uppercase block">Nova Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-transparent border border-primary/40 rounded-xl px-4 py-3 text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm" className="text-[11px] text-muted-foreground/60 font-semibold tracking-[0.15em] uppercase block">Confirmar Senha</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-transparent border border-primary/40 rounded-xl px-4 py-3 text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/20"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/85 text-primary-foreground font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/25"
          >
            Salvar nova senha
          </button>
        </form>
      </div>
    </div>
  );
}
