"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCPF } from "@/lib/constants";

export default function OnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Informe seu nome completo");
      return;
    }

    setSaving(true);
    setError("");

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName.trim(),
        cpf: cpf.replace(/\D/g, "") || null,
        onboarding_complete: true,
      }),
    });

    if (res.ok) {
      router.replace("/");
    } else {
      setError("Erro ao salvar. Tente novamente.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Bem-vindo!</h1>
          <p className="text-muted-foreground mt-2">Complete seu cadastro para acessar a plataforma</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nome completo *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
              required
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">CPF</label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
