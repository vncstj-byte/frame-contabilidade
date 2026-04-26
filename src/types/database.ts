export type UserRole = "admin" | "gestor" | "cliente";
export type EntryType = "Receita" | "Despesa";
export type CategoryGroup =
  | "Honorários"
  | "Impostos"
  | "Time"
  | "Infraestrutura"
  | "Comercial";
export type ContractType = "Pack" | "Mensal" | "Anual";
export type UserStatus = "ativo" | "inativo";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  fee_mensal: number | null;
  status: UserStatus;
  data_vencimento: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  nome_empresa: string;
  cnpj: string | null;
  endereco: string | null;
  nome_socio: string | null;
  cpf_socio: string | null;
  tipo_contrato: ContractType | null;
  valor_contrato: number | null;
  prazo_contrato: string | null;
  data_inicio_contrato: string | null;
  data_termino_contrato: string | null;
  contrato_url: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialEntry {
  id: string;
  client_id: string | null;
  reference_month: string;
  entry_type: EntryType;
  category_group: CategoryGroup;
  category: string;
  amount: number;
  description: string | null;
  entry_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardUpdate {
  id: string;
  reference_month: string;
  updated_at: string;
  updated_by: string;
}
