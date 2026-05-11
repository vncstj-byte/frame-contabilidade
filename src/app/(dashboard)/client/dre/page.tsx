"use client";

import { useEffect, useState } from "react";
import { useApp } from "../../layout";
import { parsePeriodMonths, formatCurrency, formatPercent, formatYearMonth, DRE_GABARITO } from "@/lib/constants";
import { calculateDRE } from "@/lib/dreCalculator";
import type { FinancialEntry } from "@/types/database";
import { Printer, CheckCircle, XCircle, FileSpreadsheet } from "lucide-react";

export default function ClientDREPage() {
  const { selectedPeriod } = useApp();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
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

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl px-5 py-3 md:py-4 flex items-center justify-between">
        <h2 className="text-lg md:text-2xl font-bold font-[family-name:var(--font-heading)] tracking-tight text-foreground">DRE</h2>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-xs md:text-sm text-primary"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Imprimir</span>
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border">
          <p className="text-xs text-primary font-semibold tracking-wider mb-1">FRAME CONTABILIDADE PARA ADVOGADOS</p>
          <h3 className="text-sm md:text-lg font-bold text-foreground">DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO</h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Período: <strong className="text-foreground">{formatYearMonth(selectedPeriod)}</strong>
          </p>
        </div>

        <div className="p-4 md:p-6 overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left pb-3 font-medium">DESCRIÇÃO</th>
                <th className="text-right pb-3 font-medium">VALOR</th>
                <th className="text-right pb-3 font-medium">%</th>
                <th className="text-right pb-3 font-medium hidden sm:table-cell">GABARITO</th>
              </tr>
            </thead>
            <tbody>
              <DRERow label="RECEITA BRUTA" value={dre.receitaBruta} percent={100} highlight color="text-emerald-400" />
              <DRERow label="(-) Impostos" value={dre.custosImpostos} percent={dre.percentImpostos} target={DRE_GABARITO.impostos} color="text-red-400" indent />
              <DRERow label="RECEITA LÍQUIDA" value={dre.receitaLiquida} percent={dre.receitaBruta > 0 ? (dre.receitaLiquida / dre.receitaBruta) * 100 : 0} highlight color="text-emerald-400" />
              <DRERow label="(-) Time" value={dre.custosTime} percent={dre.percentTime} target={DRE_GABARITO.time} color="text-red-400" indent />
              <DRERow label="(-) Estrutura" value={dre.custosEstrutura} percent={dre.percentEstrutura} target={DRE_GABARITO.estrutura} color="text-red-400" indent />
              <DRERow label="(-) Marketing" value={dre.custosMarketing} percent={dre.percentMarketing} target={DRE_GABARITO.marketing} color="text-red-400" indent />
              <DRERow label="Total custos" value={dre.totalCustos} percent={dre.receitaBruta > 0 ? (dre.totalCustos / dre.receitaBruta) * 100 : 0} />
              <DRERow label="EBITDA" value={dre.ebitda} percent={dre.receitaBruta > 0 ? (dre.ebitda / dre.receitaBruta) * 100 : 0} highlight />

              <tr className="border-t border-border">
                <td className="pt-4 pb-2 font-bold text-foreground text-xs md:text-sm">MARGEM DE LUCRO</td>
                <td></td>
                <td className={`pt-4 pb-2 text-right text-lg md:text-2xl font-bold ${dre.margemLucro >= DRE_GABARITO.margem ? "text-emerald-400" : "text-red-400"}`}>
                  {formatPercent(dre.margemLucro)}
                </td>
                <td className="pt-4 pb-2 text-right hidden sm:table-cell">
                  <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    {dre.margemLucro >= DRE_GABARITO.margem
                      ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      : <XCircle className="w-3.5 h-3.5 text-red-500" />
                    }
                    ≥ {DRE_GABARITO.margem}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-4 md:px-6 py-3 border-t border-border text-[10px] md:text-xs text-muted-foreground/60 text-center md:text-left">
          Frame Contabilidade para Advogados — {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </div>
      </div>
    </div>
  );
}

function DRERow({ label, value, percent, target, highlight, color, indent }: {
  label: string; value: number; percent: number; target?: number; highlight?: boolean; color?: string; indent?: boolean;
}) {
  return (
    <tr className={`border-b border-border/30 ${highlight ? "bg-secondary/30" : ""}`}>
      <td className={`py-2.5 md:py-3 ${indent ? "pl-3 md:pl-4" : ""} ${color ?? "text-muted-foreground"} ${highlight ? "font-semibold" : ""}`}>
        {label}
      </td>
      <td className={`py-2.5 md:py-3 text-right ${color ?? "text-muted-foreground"}`}>
        {formatCurrency(value)}
      </td>
      <td className="py-2.5 md:py-3 text-right text-muted-foreground/70">
        {formatPercent(percent)}
      </td>
      <td className="py-2.5 md:py-3 text-right hidden sm:table-cell">
        {target && (
          <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            {percent <= target
              ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              : <XCircle className="w-3.5 h-3.5 text-red-500" />
            }
            ≤ {target}%
          </span>
        )}
      </td>
    </tr>
  );
}
