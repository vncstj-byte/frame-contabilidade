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

      const { data: all } = await supabase.from("financial_entries").select("*").order("reference_month");
      setAllEntries(all ?? []);

      setLoading(false);
    }
    loadData();
  }, [selectedPeriod, selectedClient]);

  const dre = calculateDRE(entries);
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
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard label="Receita Bruta" value={formatCurrency(dre.receitaBruta)} icon={<DollarSign className="w-5 h-5" />} iconColor="text-emerald-400" />
        <KPICard label="Total de Custos" value={formatCurrency(dre.totalCustos)} icon={<TrendingDown className="w-5 h-5" />} iconColor="text-red-400" valueColor="text-red-400" />
        <KPICard label="EBITDA / Margem" value={formatCurrency(dre.ebitda)} icon={<TrendingUp className="w-5 h-5" />} iconColor="text-emerald-400" />
        <KPICard label="Margem Líquida" value={formatPercent(dre.margemLucro)} icon={<Percent className="w-5 h-5" />} iconColor="text-primary" />
      </div>

      {/* Saúde Financeira */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-primary font-semibold text-sm tracking-wider uppercase">Saúde Financeira — Gabarito Frame</h3>
          <span className={`text-sm px-4 py-1 rounded-full font-medium ${isMargemOk ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
            Margem: {formatPercent(dre.margemLucro)} meta ≥ {DRE_GABARITO.margem}%
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {gaugeItems.map((item) => {
            const ok = item.value <= item.target;
            const ringColor = ok ? "hsl(150 60% 40%)" : "hsl(0 84% 60%)";
            const percent = Math.min((item.value / (item.target * 1.5)) * 100, 100);
            const circumference = 2 * Math.PI * 32;
            const strokeDashoffset = circumference - (percent / 100) * circumference;
            return (
              <div key={item.label} className="flex flex-col items-center">
                <div className="relative w-16 h-16 mb-2">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="32" fill="none" stroke="hsl(218 25% 22%)" strokeWidth="3.5" />
                    <circle
                      cx="36" cy="36" r="32" fill="none"
                      stroke={ringColor} strokeWidth="3.5" strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-xs font-bold ${ok ? "text-emerald-400" : "text-red-400"}`}>
                      {formatPercent(item.value)}
                    </span>
                    <span className="text-[8px] text-muted-foreground">meta ≤{item.target}%</span>
                  </div>
                </div>
                <span className="text-sm text-foreground font-medium">{item.label}</span>
                <span className={`text-[10px] mt-0.5 flex items-center gap-1 ${ok ? "text-emerald-400" : "text-red-400"}`}>
                  {ok ? "✓ Dentro do gabarito" : "✗ Acima do gabarito"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-muted-foreground font-semibold text-sm tracking-wider uppercase mb-3">Evolução do Faturamento</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(218 25% 22%)" />
              <XAxis dataKey="month" stroke="hsl(215 15% 40%)" tick={{ fontSize: 11 }} />
              <YAxis stroke="hsl(215 15% 40%)" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(218 35% 13%)", border: "1px solid hsl(218 25% 22%)", borderRadius: 8 }}
                labelStyle={{ color: "hsl(215 15% 60%)" }}
                formatter={(v) => formatCurrency(Number(v))}
              />
              <Line type="monotone" dataKey="receita" stroke="hsl(150 60% 40%)" strokeWidth={2} dot={{ fill: "hsl(150 60% 40%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-muted-foreground font-semibold text-sm tracking-wider uppercase mb-3">Composição dos Custos por Mês</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={stackedCosts}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(218 25% 22%)" />
              <XAxis dataKey="month" stroke="hsl(215 15% 40%)" tick={{ fontSize: 11 }} />
              <YAxis stroke="hsl(215 15% 40%)" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(218 35% 13%)", border: "1px solid hsl(218 25% 22%)", borderRadius: 8 }}
                formatter={(v) => formatCurrency(Number(v))}
              />
              <Legend />
              <Bar dataKey="Time" stackId="a" fill="hsl(280 65% 55%)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Marketing" stackId="a" fill="hsl(215 15% 60%)" />
              <Bar dataKey="Estrutura" stackId="a" fill="hsl(215 15% 40%)" />
              <Bar dataKey="Impostos" stackId="a" fill="hsl(215 15% 75%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom: Benchmark + Mini DRE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-muted-foreground font-semibold text-sm tracking-wider uppercase mb-3">Real vs Gabarito Frame (%)</h3>
          <div className="space-y-3">
            {gaugeItems.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-muted-foreground/70">{formatPercent(item.value)}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(item.value / (item.target * 1.5) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Margem</span>
                <span className="text-muted-foreground/70">{formatPercent(dre.margemLucro)}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(dre.margemLucro / (DRE_GABARITO.margem * 1.5) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-muted-foreground font-semibold text-sm tracking-wider uppercase">DRE — Resultado do Exercício</h3>
            <span className="text-xs text-muted-foreground/50">% da Receita Bruta</span>
          </div>
          <div className="space-y-0.5">
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

function KPICard({ label, value, icon, iconColor, valueColor }: { label: string; value: string; icon: React.ReactNode; iconColor?: string; valueColor?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-muted-foreground font-semibold tracking-[0.12em] uppercase">{label}</span>
        <div className={`${iconColor ?? "text-muted-foreground"} opacity-50`}>{icon}</div>
      </div>
      <p className={`text-xl font-bold font-[family-name:var(--font-heading)] tracking-tight ${valueColor ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

function DRERow({ label, value, percent, target, prefix, highlight, highlightColor, isMargin }: {
  label: string; value: number; percent: number; target?: number; prefix?: string; highlight?: boolean; highlightColor?: "emerald" | "amber"; isMargin?: boolean;
}) {
  const ok = target ? (isMargin ? percent >= target : percent <= target) : true;
  const bgClass = highlight
    ? highlightColor === "emerald" ? "bg-emerald-500/8" : "bg-secondary/50"
    : "";
  const labelClass = highlight
    ? highlightColor === "emerald" ? "font-semibold text-emerald-400" : "font-semibold text-foreground"
    : "";
  return (
    <div className={`flex items-center justify-between py-1.5 px-3 rounded-lg ${bgClass}`}>
      <span className="text-sm text-muted-foreground">
        {prefix && <span className="text-muted-foreground/50 mr-1">{prefix}</span>}
        <span className={labelClass}>{label}</span>
        {target && <span className="text-muted-foreground/30 ml-2 text-xs">≤{target}%</span>}
      </span>
      <div className="flex items-center gap-4">
        {target && (
          ok ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />
        )}
        <span className="text-sm text-muted-foreground w-16 text-right">{formatPercent(percent)}</span>
        <span className={`text-sm font-semibold w-28 text-right ${value < 0 ? "text-red-400" : highlightColor === "emerald" ? "text-emerald-400" : "text-foreground"}`}>
          {value < 0 ? "- " : ""}{formatCurrency(Math.abs(value))}
        </span>
      </div>
    </div>
  );
}
