import type { FinancialEntry } from "@/types/database";
import { formatCurrency } from "./constants";

export interface DREResult {
  receitaBruta: number;
  custosImpostos: number;
  receitaLiquida: number;
  custosTime: number;
  custosEstrutura: number;
  custosMarketing: number;
  totalCustos: number;
  ebitda: number;
  margemLucro: number;
  percentImpostos: number;
  percentTime: number;
  percentEstrutura: number;
  percentMarketing: number;
}

export function calculateDRE(entries: FinancialEntry[]): DREResult {
  const receitas = entries.filter((e) => e.entry_type === "Receita");
  const despesas = entries.filter((e) => e.entry_type === "Despesa");

  const receitaBruta = receitas.reduce((sum, e) => sum + e.amount, 0);

  const custosImpostos = despesas
    .filter((e) => e.category_group === "Impostos")
    .reduce((sum, e) => sum + e.amount, 0);

  const receitaLiquida = receitaBruta - custosImpostos;

  const custosTime = despesas
    .filter((e) => e.category_group === "Time")
    .reduce((sum, e) => sum + e.amount, 0);

  const custosEstrutura = despesas
    .filter((e) => e.category_group === "Infraestrutura")
    .reduce((sum, e) => sum + e.amount, 0);

  const custosMarketing = despesas
    .filter((e) => e.category_group === "Comercial")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCustos = custosImpostos + custosTime + custosEstrutura + custosMarketing;
  const ebitda = receitaBruta - totalCustos;
  const margemLucro = receitaBruta > 0 ? (ebitda / receitaBruta) * 100 : 0;

  const percentImpostos = receitaBruta > 0 ? (custosImpostos / receitaBruta) * 100 : 0;
  const percentTime = receitaBruta > 0 ? (custosTime / receitaBruta) * 100 : 0;
  const percentEstrutura = receitaBruta > 0 ? (custosEstrutura / receitaBruta) * 100 : 0;
  const percentMarketing = receitaBruta > 0 ? (custosMarketing / receitaBruta) * 100 : 0;

  return {
    receitaBruta,
    custosImpostos,
    receitaLiquida,
    custosTime,
    custosEstrutura,
    custosMarketing,
    totalCustos,
    ebitda,
    margemLucro,
    percentImpostos,
    percentTime,
    percentEstrutura,
    percentMarketing,
  };
}

export function getExpenseBreakdown(entries: FinancialEntry[]) {
  const despesas = entries.filter((e) => e.entry_type === "Despesa");
  const groups = ["Impostos", "Time", "Infraestrutura", "Comercial"];

  return groups.map((group) => {
    const total = despesas
      .filter((e) => e.category_group === group)
      .reduce((sum, e) => sum + e.amount, 0);
    return { name: group === "Infraestrutura" ? "Estrutura" : group, value: total };
  });
}

export function calculateMonthlyData(entries: FinancialEntry[]) {
  const monthMap = new Map<string, { receita: number; despesa: number }>();

  entries.forEach((e) => {
    const current = monthMap.get(e.reference_month) || { receita: 0, despesa: 0 };
    if (e.entry_type === "Receita") {
      current.receita += e.amount;
    } else {
      current.despesa += e.amount;
    }
    monthMap.set(e.reference_month, current);
  });

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: month.slice(5),
      monthFull: month,
      receita: data.receita,
      despesa: data.despesa,
      resultado: data.receita - data.despesa,
    }));
}

export function getStackedCostData(entries: FinancialEntry[]) {
  const despesas = entries.filter((e) => e.entry_type === "Despesa");
  const monthMap = new Map<string, Record<string, number>>();

  despesas.forEach((e) => {
    const current = monthMap.get(e.reference_month) || {};
    const group = e.category_group === "Infraestrutura" ? "Estrutura" : e.category_group;
    current[group] = (current[group] || 0) + e.amount;
    monthMap.set(e.reference_month, current);
  });

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: month.slice(2).replace("-", "/"),
      Time: data.Time || 0,
      Marketing: data.Comercial || 0,
      Estrutura: data.Estrutura || 0,
      Impostos: data.Impostos || 0,
    }));
}
