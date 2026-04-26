"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const months = parsePeriodMonths(selectedPeriod);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [entriesRes, clientRes] = await Promise.all([
        supabase.from("financial_entries").select("*").eq("client_id", user.id).in("reference_month", months).order("entry_date", { ascending: false }),
        supabase.from("clients").select("*").eq("user_id", user.id).single(),
      ]);

      setEntries(entriesRes.data ?? []);
      setClientInfo(clientRes.data);
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
    return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Meu Financeiro</h2>
        {clientInfo && <p className="text-gray-400 text-sm">{clientInfo.nome_empresa}</p>}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#2c2c40] border border-white/[0.16] rounded-2xl p-5">
          <span className="text-xs text-gray-500 font-semibold tracking-wider">RECEITAS</span>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{formatCurrency(dre.receitaBruta)}</p>
        </div>
        <div className="bg-[#2c2c40] border border-white/[0.16] rounded-2xl p-5">
          <span className="text-xs text-gray-500 font-semibold tracking-wider">DESPESAS</span>
          <p className="text-2xl font-bold text-red-400 mt-2">{formatCurrency(dre.totalCustos)}</p>
        </div>
        <div className="bg-[#2c2c40] border border-white/[0.16] rounded-2xl p-5">
          <span className="text-xs text-gray-500 font-semibold tracking-wider">RESULTADO</span>
          <p className={`text-2xl font-bold mt-2 ${dre.ebitda >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(dre.ebitda)}</p>
        </div>
      </div>

      {/* Saúde financeira */}
      <div className="bg-[#2c2c40] border border-white/[0.16] rounded-2xl p-6">
        <h3 className="text-[#cea165] font-semibold text-sm tracking-wider mb-6">SAÚDE FINANCEIRA</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {gaugeItems.map((item) => {
            const ok = item.value <= item.target;
            return (
              <div key={item.label} className="flex flex-col items-center">
                <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center mb-3 ${ok ? "border-emerald-500/40" : "border-red-500/40"}`}>
                  <span className={`text-lg font-bold ${ok ? "text-emerald-400" : "text-red-400"}`}>{formatPercent(item.value)}</span>
                </div>
                <span className="text-sm text-white font-medium">{item.label}</span>
                <span className={`text-xs mt-1 flex items-center gap-1 ${ok ? "text-emerald-400" : "text-red-400"}`}>
                  {ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {ok ? "Dentro do gabarito" : "Acima"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lançamentos */}
      <div className="bg-[#2c2c40] border border-white/[0.16] rounded-2xl p-6">
        <h3 className="text-[#cea165] font-semibold text-sm tracking-wider mb-4">LANÇAMENTOS DO PERÍODO</h3>
        {entries.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum lançamento neste período.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-white/10">
                <th className="text-left pb-3">Data</th>
                <th className="text-left pb-3">Tipo</th>
                <th className="text-left pb-3">Categoria</th>
                <th className="text-left pb-3">Descrição</th>
                <th className="text-right pb-3">Valor</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-white/5">
                  <td className="py-3 text-gray-300">{new Date(entry.entry_date).toLocaleDateString("pt-BR")}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${entry.entry_type === "Receita" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {entry.entry_type}
                    </span>
                  </td>
                  <td className="py-3 text-gray-300">{entry.category}</td>
                  <td className="py-3 text-gray-500">{entry.description || "-"}</td>
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
  );
}
