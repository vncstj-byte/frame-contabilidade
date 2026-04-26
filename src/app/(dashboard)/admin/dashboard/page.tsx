"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "../../layout";
import { parsePeriodMonths, formatCurrency, formatPercent, DRE_GABARITO } from "@/lib/constants";
import { calculateDRE, getExpenseBreakdown, calculateMonthlyData, getStackedCostData } from "@/lib/dreCalculator";
import type { FinancialEntry } from "@/types/database";
import { DollarSign, TrendingDown, TrendingUp, Percent, CheckCircle, XCircle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from "recharts";

export default function DashboardPage() {
  const { selectedPeriod, selectedClient, profile } = useApp();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [allEntries, setAllEntries] = useState<FinancialEntry[]>([]);
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

      // Load all entries for trend charts
      const { data: all } = await supabase.from("financial_entries").select("*").order("reference_month");
      setAllEntries(all ?? []);

      setLoading(false);
    }
    loadData();
  }, [selectedPeriod, selectedClient]);

  const dre = calculateDRE(entries);
  const expenseBreakdown = getExpenseBreakdown(entries);
  const monthlyData = calculateMonthlyData(allEntries);
  const stackedCosts = getStackedCostData(allEntries);

  const gaugeItems = [
    { label: "Time", value: dre.percentTime, target: DRE_GABARITO.time },
    { label: "Marketing", value: dre.percentMarketing, target: DRE_GABARITO.marketing },
    { label: "Estrutura", value: dre.percentEstrutura, target: DRE_GABARITO.estrutura },
    { label: "Impostos", value: dre.percentImpostos, target: DRE_GABARITO.impostos },
  ];

  const isMargemOk = dre.margemLucro >= DRE_GABARITO.margem;

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard label="RECEITA BRUTA" value={formatCurrency(dre.receitaBruta)} icon={<DollarSign className="w-5 h-5 text-emerald-400" />} />
        <KPICard label="TOTAL DE CUSTOS" value={formatCurrency(dre.totalCustos)} icon={<TrendingDown className="w-5 h-5 text-red-400" />} valueColor="text-red-400" />
        <KPICard label="EBITDA / MARGEM" value={formatCurrency(dre.ebitda)} icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} />
        <KPICard label="MARGEM LÍQUIDA" value={formatPercent(dre.margemLucro)} icon={<Percent className="w-5 h-5 text-[#cea165]" />} />
      </div>

      {/* Saúde Financeira — Gabarito FRAME */}
      <div className="bg-gradient-to-br from-[#2c2c40] to-[#161622] border border-white/[0.16] rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[#cea165] font-semibold text-sm tracking-wider">SAÚDE FINANCEIRA — GABARITO FRAME</h3>
          <span className={`text-sm px-4 py-1.5 rounded-full ${isMargemOk ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
            Margem: {formatPercent(dre.margemLucro)} meta ≥ {DRE_GABARITO.margem}%
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {gaugeItems.map((item) => {
            const ok = item.value <= item.target;
            const ringColor = ok ? "#22c55e" : "#ef4444";
            const percent = Math.min((item.value / (item.target * 1.5)) * 100, 100);
            const circumference = 2 * Math.PI * 38;
            const strokeDashoffset = circumference - (percent / 100) * circumference;
            return (
              <div key={item.label} className="flex flex-col items-center">
                <div className="relative w-20 h-20 mb-3">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r="38" fill="none" stroke="#ffffff08" strokeWidth="4" />
                    <circle
                      cx="44" cy="44" r="38" fill="none"
                      stroke={ringColor} strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-sm font-bold ${ok ? "text-emerald-400" : "text-red-400"}`}>
                      {formatPercent(item.value)}
                    </span>
                    <span className="text-[9px] text-gray-500">meta ≤{item.target}%</span>
                  </div>
                </div>
                <span className="text-sm text-white font-medium">{item.label}</span>
                <span className={`text-[11px] mt-0.5 flex items-center gap-1 ${ok ? "text-emerald-400" : "text-red-400"}`}>
                  {ok ? "✓" : "✗"} {ok ? "Dentro do gabarito" : "Acima do gabarito"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue trend */}
        <div className="bg-[#2c2c40] border border-white/[0.16] rounded-2xl p-6">
          <h3 className="text-gray-400 font-semibold text-sm tracking-wider mb-4">EVOLUÇÃO DO FATURAMENTO</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" stroke="#666" tick={{ fontSize: 12 }} />
              <YAxis stroke="#666" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#2c2c40", border: "1px solid #ffffff10", borderRadius: 12 }}
                labelStyle={{ color: "#999" }}
                formatter={(v) => formatCurrency(Number(v))}
              />
              <Line type="monotone" dataKey="receita" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stacked costs */}
        <div className="bg-[#2c2c40] border border-white/[0.16] rounded-2xl p-6">
          <h3 className="text-gray-400 font-semibold text-sm tracking-wider mb-4">COMPOSIÇÃO DOS CUSTOS POR MÊS</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stackedCosts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" stroke="#666" tick={{ fontSize: 12 }} />
              <YAxis stroke="#666" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#2c2c40", border: "1px solid #ffffff10", borderRadius: 12 }}
                formatter={(v) => formatCurrency(Number(v))}
              />
              <Legend />
              <Bar dataKey="Time" stackId="a" fill="#c084fc" />
              <Bar dataKey="Marketing" stackId="a" fill="#a3a3a3" />
              <Bar dataKey="Estrutura" stackId="a" fill="#737373" />
              <Bar dataKey="Impostos" stackId="a" fill="#d4d4d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row: Benchmark + DRE mini */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Benchmark chart */}
        <div className="bg-[#2c2c40] border border-white/[0.16] rounded-2xl p-6">
          <h3 className="text-gray-400 font-semibold text-sm tracking-wider mb-4">REAL VS GABARITO FRAME (%)</h3>
          <div className="space-y-4">
            {gaugeItems.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-gray-500">{formatPercent(item.value)}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c9a84c] to-[#d4b355]"
                    style={{ width: `${Math.min(item.value / (item.target * 1.5) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Margem</span>
                <span className="text-gray-500">{formatPercent(dre.margemLucro)}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#c9a84c] to-[#d4b355]"
                  style={{ width: `${Math.min(dre.margemLucro / (DRE_GABARITO.margem * 1.5) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mini DRE */}
        <div className="bg-[#2c2c40] border border-white/[0.16] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-semibold text-sm tracking-wider">DRE — RESULTADO DO EXERCÍCIO</h3>
            <span className="text-xs text-gray-500">% da Receita Bruta</span>
          </div>
          <div className="space-y-2">
            <DRERow label="Receita Bruta" value={dre.receitaBruta} percent={100} highlight highlightColor="emerald" />
            <DRERow label="Impostos" value={-dre.custosImpostos} percent={dre.percentImpostos} target={DRE_GABARITO.impostos} prefix="(-)" />
            <DRERow label="Receita Líquida" value={dre.receitaLiquida} percent={dre.receitaBruta > 0 ? (dre.receitaLiquida / dre.receitaBruta) * 100 : 0} />
            <DRERow label="Custos — Time" value={-dre.custosTime} percent={dre.percentTime} target={DRE_GABARITO.time} prefix="(-)" />
            <DRERow label="Custos — Estrutura" value={-dre.custosEstrutura} percent={dre.percentEstrutura} target={DRE_GABARITO.estrutura} prefix="(-)" />
            <DRERow label="Custos — Marketing" value={-dre.custosMarketing} percent={dre.percentMarketing} target={DRE_GABARITO.marketing} prefix="(-)" />
            <DRERow label="Margem / Lucro" value={dre.ebitda} percent={dre.margemLucro} target={DRE_GABARITO.margem} highlight isMargin />
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, icon, valueColor }: { label: string; value: string; icon: React.ReactNode; valueColor?: string }) {
  return (
    <div className="bg-gradient-to-br from-[#2c2c40] to-[#161622] border border-white/[0.16] rounded-2xl p-6 hover:border-white/10 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-gray-500 font-semibold tracking-[0.15em] uppercase">{label}</span>
        <div className="opacity-60 group-hover:opacity-100 transition-opacity">{icon}</div>
      </div>
      <p className={`text-[28px] font-bold tracking-tight ${valueColor ?? "text-white"}`}>{value}</p>
    </div>
  );
}

function DRERow({ label, value, percent, target, prefix, highlight, highlightColor, isMargin }: {
  label: string; value: number; percent: number; target?: number; prefix?: string; highlight?: boolean; highlightColor?: "emerald" | "amber"; isMargin?: boolean;
}) {
  const ok = target ? (isMargin ? percent >= target : percent <= target) : true;
  const bgClass = highlight
    ? highlightColor === "emerald" ? "bg-emerald-500/10" : "bg-white/5"
    : "";
  const labelClass = highlight
    ? highlightColor === "emerald" ? "font-semibold text-emerald-400" : "font-semibold text-white"
    : "";
  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${bgClass}`}>
      <span className="text-sm text-gray-300">
        {prefix && <span className="text-gray-500 mr-1">{prefix}</span>}
        <span className={labelClass}>{label}</span>
        {target && <span className="text-gray-600 ml-2 text-xs">≤{target}%</span>}
      </span>
      <div className="flex items-center gap-4">
        {target && (
          ok ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />
        )}
        <span className="text-sm text-gray-400 w-16 text-right">{formatPercent(percent)}</span>
        <span className={`text-sm font-semibold w-28 text-right ${value < 0 ? "text-red-400" : highlightColor === "emerald" ? "text-emerald-400" : "text-white"}`}>
          {value < 0 ? "- " : ""}{formatCurrency(Math.abs(value))}
        </span>
      </div>
    </div>
  );
}
