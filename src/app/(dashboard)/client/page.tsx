"use client";

import { useEffect, useState } from "react";
import { useApp } from "../layout";
import { parsePeriodMonths, formatCurrency, formatPercent, DRE_GABARITO } from "@/lib/constants";
import { calculateDRE } from "@/lib/dreCalculator";
import type { FinancialEntry, Client } from "@/types/database";
import { CheckCircle, XCircle } from "lucide-react";

export default function ClientDashboard() {
  const { selectedPeriod, profile } = useApp();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [clientInfo, setClientInfo] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const months = parsePeriodMonths(selectedPeriod);
      const params = new URLSearchParams({ months: months.join(",") });
      const res = await fetch(`/api/financial-entries?${params}`);
      const { data } = await res.json();
      setEntries(data ?? []);
      setLoading(false);
    }
    loadData();
  }, [selectedPeriod]);

  const dre = calculateDRE(entries);

  const gaugeItems = [
    { label: "Time", value: dre.percentTime, target: DRE_GABARITO.time },
    { label: "Marketing", value: dre.percentMarketing, target: DRE_GABARITO.marketing },
    { label: "Estrutura", value: dre.percentEstrutura, target: DRE_GABARITO.estrutura },
    { label: "Impostos", value: dre.percentImpostos, target: DRE_GABARITO.impostos },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="bg-card border border-border rounded-xl px-5 py-3 md:py-4 text-center md:text-left">
        <h2 className="text-lg md:text-2xl font-bold font-[family-name:var(--font-heading)] tracking-tight text-foreground">Meu Financeiro</h2>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-card border border-border rounded-xl p-4 md:p-5">
          <span className="text-[10px] md:text-xs text-muted-foreground font-semibold tracking-wider">RECEITAS</span>
          <p className="text-lg md:text-2xl font-bold font-[family-name:var(--font-heading)] text-emerald-400 mt-1 md:mt-2">{formatCurrency(dre.receitaBruta)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 md:p-5">
          <span className="text-[10px] md:text-xs text-muted-foreground font-semibold tracking-wider">DESPESAS</span>
          <p className="text-lg md:text-2xl font-bold font-[family-name:var(--font-heading)] text-red-400 mt-1 md:mt-2">{formatCurrency(dre.totalCustos)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 md:p-5">
          <span className="text-[10px] md:text-xs text-muted-foreground font-semibold tracking-wider">RESULTADO</span>
          <p className={`text-lg md:text-2xl font-bold font-[family-name:var(--font-heading)] mt-1 md:mt-2 ${dre.ebitda >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(dre.ebitda)}</p>
        </div>
      </div>

      {/* Saúde financeira */}
      <div>
        <div className="bg-card border border-border rounded-xl px-5 py-3 mb-4 text-center md:text-left">
          <h3 className="text-primary font-semibold text-sm tracking-wider">SAÚDE FINANCEIRA</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {gaugeItems.map((item) => {
            const ok = item.value <= item.target;
            return (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4 flex flex-col items-center">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 flex items-center justify-center mb-2 md:mb-3 ${ok ? "border-emerald-500/40" : "border-red-500/40"}`}>
                  <span className={`text-sm md:text-lg font-bold ${ok ? "text-emerald-400" : "text-red-400"}`}>{formatPercent(item.value)}</span>
                </div>
                <span className="text-xs md:text-sm text-foreground font-medium">{item.label}</span>
                <span className={`text-[10px] md:text-xs mt-1 flex items-center gap-1 ${ok ? "text-emerald-400" : "text-red-400"}`}>
                  {ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {ok ? "Dentro do gabarito" : "Acima"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lançamentos */}
      <div>
        <div className="bg-card border border-border rounded-xl px-5 py-3 mb-4 text-center md:text-left">
          <h3 className="text-primary font-semibold text-sm tracking-wider">LANÇAMENTOS DO PERÍODO</h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 md:p-6">
        {entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum lançamento neste período.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left pb-3">Data</th>
                <th className="text-left pb-3">Tipo</th>
                <th className="text-left pb-3">Categoria</th>
                <th className="text-left pb-3">Descrição</th>
                <th className="text-right pb-3">Valor</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border/30">
                  <td className="py-3 text-muted-foreground">{new Date(entry.entry_date).toLocaleDateString("pt-BR")}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${entry.entry_type === "Receita" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {entry.entry_type}
                    </span>
                  </td>
                  <td className="py-3 text-foreground/80">{entry.category}</td>
                  <td className="py-3 text-muted-foreground">{entry.description || "-"}</td>
                  <td className={`py-3 text-right font-semibold ${entry.entry_type === "Receita" ? "text-emerald-400" : "text-red-400"}`}>
                    {formatCurrency(entry.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      </div>
    </div>
  );
}
