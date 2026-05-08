export const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatYearMonth(ym: string): string {
  const [year, month] = ym.split("-");
  return `${MONTHS_PT[parseInt(month) - 1]} de ${year}`;
}

export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2")
    .replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, "$1-$2");
}

export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, "$1-$2");
}

export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export interface PeriodOption {
  label: string;
  value: string;
  type: "month" | "quarter" | "semester" | "year";
}

export function getPeriodOptions(year: number = new Date().getFullYear()): PeriodOption[] {
  const options: PeriodOption[] = [];

  // Meses
  for (let m = 0; m < 12; m++) {
    const ym = `${year}-${String(m + 1).padStart(2, "0")}`;
    options.push({ label: `${MONTHS_PT[m]} de ${year}`, value: ym, type: "month" });
  }

  return options;
}

export function getGroupedPeriodOptions(year: number = new Date().getFullYear()) {
  const months: PeriodOption[] = [];
  for (let m = 0; m < 12; m++) {
    const ym = `${year}-${String(m + 1).padStart(2, "0")}`;
    months.push({ label: `${MONTHS_PT[m]} de ${year}`, value: ym, type: "month" });
  }

  const quarters: PeriodOption[] = [
    { label: `1º Trimestre de ${year}`, value: `${year}-Q1`, type: "quarter" },
    { label: `2º Trimestre de ${year}`, value: `${year}-Q2`, type: "quarter" },
    { label: `3º Trimestre de ${year}`, value: `${year}-Q3`, type: "quarter" },
    { label: `4º Trimestre de ${year}`, value: `${year}-Q4`, type: "quarter" },
  ];

  const semesters: PeriodOption[] = [
    { label: `1º Semestre de ${year}`, value: `${year}-S1`, type: "semester" },
    { label: `2º Semestre de ${year}`, value: `${year}-S2`, type: "semester" },
  ];

  const annual: PeriodOption[] = [
    { label: `Ano de ${year}`, value: `${year}`, type: "year" },
  ];

  return { months, quarters, semesters, annual };
}

export function parsePeriodMonths(period: string): string[] {
  // Single month: "2026-04"
  if (/^\d{4}-\d{2}$/.test(period)) return [period];

  const year = parseInt(period.split("-")[0] || period);

  // Quarter: "2026-Q1"
  if (period.includes("-Q")) {
    const q = parseInt(period.split("Q")[1]);
    const startMonth = (q - 1) * 3 + 1;
    return [0, 1, 2].map((i) => `${year}-${String(startMonth + i).padStart(2, "0")}`);
  }

  // Semester: "2026-S1"
  if (period.includes("-S")) {
    const s = parseInt(period.split("S")[1]);
    const startMonth = (s - 1) * 6 + 1;
    return Array.from({ length: 6 }, (_, i) => `${year}-${String(startMonth + i).padStart(2, "0")}`);
  }

  // Year: "2026"
  if (/^\d{4}$/.test(period)) {
    return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  }

  return [period];
}

export const CATEGORY_OPTIONS: Record<string, string[]> = {
  Honorários: ["Honorários Iniciais", "Honorários de Sucumbência", "Honorários Mensais"],
  Impostos: ["ISS", "IRPJ", "CSLL", "PIS", "COFINS", "Simples Nacional"],
  Time: ["Salários", "Prêmios", "Benefícios", "Freelancers"],
  Infraestrutura: ["Aluguel", "Internet", "Ferramentas de Gestão", "Software", "Equipamentos"],
  Comercial: ["Marketing", "Publicidade", "Eventos", "Brindes"],
};

export const DRE_GABARITO = {
  impostos: 10,
  time: 35,
  estrutura: 10,
  marketing: 20,
  margem: 25,
};
