"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "../../layout";
import { parsePeriodMonths, formatCurrency, formatPercent, formatYearMonth, DRE_GABARITO } from "@/lib/constants";
import { calculateDRE } from "@/lib/dreCalculator";
import type { FinancialEntry } from "@/types/database";
import { Printer, CheckCircle, XCircle, FileSpreadsheet } from "lucide-react";

export default function DREPage() {
  const { selectedPeriod, selectedClient } = useApp();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const months = parsePeriodMonths(selectedPeriod);
      let query = supabase.from("financial_entries").select("*").in("reference_month", months);
      if (selectedClient !== "all") {
        query = query.eq("client_id", selectedClient);
      }
      const { data } = await query;
      setEntries(data ?? []);
      setLoading(false);
    }
    loadData();
  }, [selectedPeriod, selectedClient]);

  const dre = calculateDRE(entries);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-8 h-8 text-gray-500" />
          <div>
            <h2 className="text-2xl font-bold text-white">DRE Tradicional</h2>
            <p className="text-gray-400 text-sm">Demonstração do Resultado do Exercício</p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-sm bg-[#cea165]/20 text-amber-400 border border-[#cea165]/30 rounded-lg px-4 py-2 hover:bg-amber-500/30 transition"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
      </div>

      <div className="bg-[#2c2c40] border border-white/[0.16] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#2c2c40] p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#cea165] font-semibold tracking-wider mb-1">FRAME CONTABILIDADE PARA ADVOGADOS</p>
              <h3 className="text-lg font-bold text-white">DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO</h3>
              <p className="text-sm text-gray-400 mt-1">
                Período de Referência: <strong className="text-white">{formatYearMonth(selectedPeriod)}</strong>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Método</p>
              <p className="text-[#cea165] font-bold">FRAME</p>
              <p className="text-xs text-gray-500">Gabarito Orçamentário</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-white/10">
                <th className="text-left pb-3 font-medium">DESCRIÇÃO</th>
                <th className="text-right pb-3 font-medium">VALOR (R$)</th>
                <th className="text-right pb-3 font-medium">% RECEITA</th>
                <th className="text-right pb-3 font-medium">GABARITO</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <DRETableRow label="RECEITA BRUTA" value={dre.receitaBruta} percent={100} highlight color="text-emerald-400" />
              <DRETableRow label="(-) Custos impostos" value={dre.custosImpostos} percent={dre.percentImpostos} target={DRE_GABARITO.impostos} color="text-red-400" indent />
              <DRETableRow label="(=) RECEITA LÍQUIDA" value={dre.receitaLiquida} percent={dre.receitaBruta > 0 ? (dre.receitaLiquida / dre.receitaBruta) * 100 : 0} highlight color="text-emerald-400" />
              <DRETableRow label="(-) Custos time" value={dre.custosTime} percent={dre.percentTime} target={DRE_GABARITO.time} color="text-red-400" indent />
              <DRETableRow label="(-) Custos estrutura" value={dre.custosEstrutura} percent={dre.percentEstrutura} target={DRE_GABARITO.estrutura} color="text-red-400" indent />
              <DRETableRow label="(-) Custos marketing" value={dre.custosMarketing} percent={dre.percentMarketing} target={DRE_GABARITO.marketing} color="text-red-400" indent />
              <DRETableRow label="(-) Total de custos" value={dre.totalCustos} percent={dre.receitaBruta > 0 ? (dre.totalCustos / dre.receitaBruta) * 100 : 0} />
              <DRETableRow label="(=) EBITDA" value={dre.ebitda} percent={dre.receitaBruta > 0 ? (dre.ebitda / dre.receitaBruta) * 100 : 0} highlight />

              <tr className="border-t border-white/10">
                <td className="pt-4 pb-2 font-bold text-white">MARGEM DE LUCRO</td>
                <td></td>
                <td className={`pt-4 pb-2 text-right text-2xl font-bold ${dre.margemLucro >= DRE_GABARITO.margem ? "text-emerald-400" : "text-red-400"}`}>
                  {formatPercent(dre.margemLucro)}
                </td>
                <td className="pt-4 pb-2 text-right">
                  <span className="flex items-center justify-end gap-1 text-xs text-gray-500">
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

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 flex justify-between text-xs text-gray-600">
          <span>Gerado em {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
          <span>Frame Contabilidade para Advogados - Método FRAME</span>
        </div>
      </div>
    </div>
  );
}

function DRETableRow({ label, value, percent, target, highlight, color, indent }: {
  label: string; value: number; percent: number; target?: number; highlight?: boolean; color?: string; indent?: boolean;
}) {
  return (
    <tr className={`border-b border-white/5 ${highlight ? "bg-white/5" : ""}`}>
      <td className={`py-3 ${indent ? "pl-4" : ""} ${color ?? "text-gray-300"} ${highlight ? "font-semibold" : ""}`}>
        {label}
      </td>
      <td className={`py-3 text-right ${color ?? "text-gray-300"}`}>
        {formatCurrency(value)}
      </td>
      <td className="py-3 text-right text-gray-400">
        {formatPercent(percent)}
      </td>
      <td className="py-3 text-right">
        {target && (
          <span className="flex items-center justify-end gap-1 text-xs text-gray-500">
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
