"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "../../layout";
import { formatCurrency, parsePeriodMonths, getCurrentYearMonth, getGroupedPeriodOptions, formatYearMonth } from "@/lib/constants";
import type { Profile, Client, FinancialEntry } from "@/types/database";
import { Users, UserPlus, Mail, Trash2, Shield, Eye, Edit2, Archive, ChevronDown, Plus } from "lucide-react";

export default function AdminPanelPage() {
  const { clients } = useApp();
  const [users, setUsers] = useState<Profile[]>([]);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [allClients, setAllClients] = useState<Client[]>(clients);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentYearMonth());
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("gestor");
  const [periodOpen, setPeriodOpen] = useState(false);

  // Client form
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [clientForm, setClientForm] = useState({
    nome_empresa: "", cnpj: "", endereco: "", nome_socio: "", cpf_socio: "",
    tipo_contrato: "Mensal", valor_contrato: "", prazo_contrato: "",
    data_inicio_contrato: new Date().toISOString().slice(0, 10),
    data_termino_contrato: "", user_email: "",
  });

  const supabase = createClient();
  const year = new Date().getFullYear();
  const periodOptions = getGroupedPeriodOptions(year);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  async function loadData() {
    setLoading(true);
    const months = parsePeriodMonths(selectedPeriod);

    const [usersRes, entriesRes, clientsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("full_name"),
      supabase.from("financial_entries").select("*").in("reference_month", months),
      supabase.from("clients").select("*").order("nome_empresa"),
    ]);

    setUsers(usersRes.data ?? []);
    setEntries(entriesRes.data ?? []);
    setAllClients(clientsRes.data ?? []);
    setLoading(false);
  }

  const activeClients = allClients.length;
  const totalReceita = entries.filter((e) => e.entry_type === "Receita").reduce((s, e) => s + e.amount, 0);
  const totalDespesa = entries.filter((e) => e.entry_type === "Despesa").reduce((s, e) => s + e.amount, 0);
  const resultado = totalReceita - totalDespesa;

  async function handleSaveClient(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("clients").insert({
      nome_empresa: clientForm.nome_empresa,
      cnpj: clientForm.cnpj || null,
      endereco: clientForm.endereco || null,
      nome_socio: clientForm.nome_socio || null,
      cpf_socio: clientForm.cpf_socio || null,
      tipo_contrato: clientForm.tipo_contrato,
      valor_contrato: clientForm.valor_contrato ? Number(clientForm.valor_contrato) : null,
      prazo_contrato: clientForm.prazo_contrato || null,
      data_inicio_contrato: clientForm.data_inicio_contrato || null,
      data_termino_contrato: clientForm.data_termino_contrato || null,
    });
    setClientFormOpen(false);
    setClientForm({
      nome_empresa: "", cnpj: "", endereco: "", nome_socio: "", cpf_socio: "",
      tipo_contrato: "Mensal", valor_contrato: "", prazo_contrato: "",
      data_inicio_contrato: new Date().toISOString().slice(0, 10),
      data_termino_contrato: "", user_email: "",
    });
    loadData();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-gray-500" />
          <div>
            <h2 className="text-2xl font-bold text-white">Painel Admin</h2>
            <p className="text-gray-400 text-sm">Gestão de usuários e permissões</p>
          </div>
        </div>
      </div>

      {/* Controle Financeiro */}
      <div className="bg-[#2c2c40] border border-white/[0.16] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#cea165] font-semibold text-sm tracking-wider">⚡ CONTROLE FINANCEIRO</h3>
          <div className="relative">
            <button
              onClick={() => setPeriodOpen(!periodOpen)}
              className="flex items-center gap-1.5 text-sm text-gray-300 border border-white/[0.16] rounded-lg px-4 py-2 hover:border-white/30"
            >
              {formatYearMonth(selectedPeriod)}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {periodOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#2c2c40] border border-white/[0.16] rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2">
                {periodOptions.months.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSelectedPeriod(opt.value); setPeriodOpen(false); }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg ${selectedPeriod === opt.value ? "bg-[#cea165]/20 text-[#cea165]" : "text-gray-300 hover:bg-white/5"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-4">Exibindo: {formatYearMonth(selectedPeriod)}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <FinCard label="CLIENTES ATIVOS" value={String(activeClients)} icon={<Users className="w-5 h-5 text-emerald-400" />} />
          <FinCard label="CLIENTES INATIVOS" value="0" icon={<Users className="w-5 h-5 text-red-400" />} />
          <FinCard label="FATURAMENTO BRUTO" value={formatCurrency(totalReceita)} icon={<span className="text-emerald-400">📈</span>} />
          <FinCard label="DESPESAS" value={formatCurrency(totalDespesa)} icon={<span className="text-red-400">📉</span>} valueColor="text-red-400" />
          <FinCard label="LUCRO DO PERÍODO" value={formatCurrency(resultado)} icon={<span className="text-emerald-400">📊</span>} />
          <FinCard label="CAIXA ACUMULADO" value={formatCurrency(resultado)} icon={<span className="text-blue-400">💰</span>} />
        </div>
      </div>

      {/* Gestão de Usuários */}
      <div className="bg-[#2c2c40] border border-white/[0.16] rounded-2xl p-6">
        <h3 className="text-[#cea165] font-semibold text-sm tracking-wider mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" /> GESTÃO DE USUÁRIOS
        </h3>

        {/* Invite */}
        <div className="flex gap-2 mb-6">
          <div className="flex items-center gap-2 bg-[#13131f] border border-white/[0.16] rounded-lg px-3 flex-1">
            <UserPlus className="w-4 h-4 text-[#cea165]" />
            <span className="text-[#cea165] text-xs font-semibold">CONVIDAR</span>
            <input
              type="email"
              placeholder="email@exemplo.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm py-3 outline-none"
            />
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="bg-[#13131f] border border-white/[0.16] rounded-lg px-3 py-2 text-sm text-gray-300"
          >
            <option value="admin">Admin</option>
            <option value="gestor">Gestor</option>
          </select>
          <button className="bg-[#cea165] hover:bg-[#d4ad72] text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition">
            <Mail className="w-4 h-4" /> Convidar
          </button>
        </div>

        {/* Users table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-white/10">
              <th className="text-left pb-3 font-medium">NOME</th>
              <th className="text-left pb-3 font-medium">EMAIL</th>
              <th className="text-left pb-3 font-medium">PERFIL</th>
              <th className="text-left pb-3 font-medium">ALTERAR PERFIL</th>
              <th className="text-left pb-3 font-medium">STATUS</th>
              <th className="text-left pb-3 font-medium">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5">
                <td className="py-3 text-white">{u.full_name}</td>
                <td className="py-3 text-gray-400">{u.email}</td>
                <td className="py-3">
                  <span className="text-xs bg-[#cea165]/20 text-[#cea165] px-2 py-1 rounded-full capitalize">{u.role}</span>
                </td>
                <td className="py-3">
                  <select className="bg-[#13131f] border border-white/[0.16] rounded text-sm text-gray-300 px-2 py-1" defaultValue={u.role}>
                    <option value="admin">Admin</option>
                    <option value="gestor">Gestor</option>
                  </select>
                </td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${u.status === "ativo" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                    {u.status === "ativo" ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="py-3">
                  <button className="text-gray-500 hover:text-red-400 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Role descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <RoleCard title="ADMIN" color="text-[#cea165]" items={["Acesso total ao sistema", "Convidar e gerenciar usuários", "Controle financeiro completo", "Gestão de clientes", "Configurações da plataforma"]} />
          <RoleCard title="GESTOR" color="text-amber-600" items={["Cadastrar e editar clientes", "Lançar receitas e despesas", "Visualizar dashboard", "Acessar DRE", "Sem acesso ao painel Admin"]} />
          <RoleCard title="CLIENTE" color="text-gray-400" items={["Visualizar seu dashboard", "Visualizar seu DRE", "Visualizar seus lançamentos", "Sem acesso ao Admin", "Sem acesso a outros clientes"]} />
        </div>
      </div>

      {/* Gestão de Clientes */}
      <div className="bg-[#2c2c40] border border-[#cea165]/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#cea165] font-semibold text-sm tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> GESTÃO DE CLIENTES
          </h3>
          <div className="flex gap-2">
            <button className="text-sm text-gray-400 border border-white/[0.16] rounded-lg px-3 py-2 hover:bg-white/5">
              Exibir Arquivados
            </button>
            <button
              onClick={() => setClientFormOpen(!clientFormOpen)}
              className="text-sm bg-[#cea165] hover:bg-[#d4ad72] text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Cadastrar Cliente
            </button>
          </div>
        </div>

        {/* Client form */}
        {clientFormOpen && (
          <form onSubmit={handleSaveClient} className="bg-[#13131f] border border-white/[0.16] rounded-xl p-4 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Nome da Empresa *" value={clientForm.nome_empresa} onChange={(e) => setClientForm({ ...clientForm, nome_empresa: e.target.value })} required className="bg-[#2c2c40] border border-white/[0.16] rounded-lg px-4 py-2.5 text-white text-sm outline-none" />
              <input placeholder="CNPJ" value={clientForm.cnpj} onChange={(e) => setClientForm({ ...clientForm, cnpj: e.target.value })} className="bg-[#2c2c40] border border-white/[0.16] rounded-lg px-4 py-2.5 text-white text-sm outline-none" />
              <input placeholder="Endereço" value={clientForm.endereco} onChange={(e) => setClientForm({ ...clientForm, endereco: e.target.value })} className="bg-[#2c2c40] border border-white/[0.16] rounded-lg px-4 py-2.5 text-white text-sm outline-none col-span-2" />
              <input placeholder="Nome do Sócio" value={clientForm.nome_socio} onChange={(e) => setClientForm({ ...clientForm, nome_socio: e.target.value })} className="bg-[#2c2c40] border border-white/[0.16] rounded-lg px-4 py-2.5 text-white text-sm outline-none" />
              <input placeholder="CPF do Sócio" value={clientForm.cpf_socio} onChange={(e) => setClientForm({ ...clientForm, cpf_socio: e.target.value })} className="bg-[#2c2c40] border border-white/[0.16] rounded-lg px-4 py-2.5 text-white text-sm outline-none" />
              <select value={clientForm.tipo_contrato} onChange={(e) => setClientForm({ ...clientForm, tipo_contrato: e.target.value })} className="bg-[#2c2c40] border border-white/[0.16] rounded-lg px-4 py-2.5 text-white text-sm outline-none">
                <option value="Pack">Pack</option>
                <option value="Mensal">Mensal</option>
                <option value="Anual">Anual</option>
              </select>
              <input placeholder="Valor do Contrato (R$)" type="number" value={clientForm.valor_contrato} onChange={(e) => setClientForm({ ...clientForm, valor_contrato: e.target.value })} className="bg-[#2c2c40] border border-white/[0.16] rounded-lg px-4 py-2.5 text-white text-sm outline-none" />
              <input type="date" value={clientForm.data_inicio_contrato} onChange={(e) => setClientForm({ ...clientForm, data_inicio_contrato: e.target.value })} className="bg-[#2c2c40] border border-white/[0.16] rounded-lg px-4 py-2.5 text-white text-sm outline-none" />
              <input type="date" value={clientForm.data_termino_contrato} onChange={(e) => setClientForm({ ...clientForm, data_termino_contrato: e.target.value })} placeholder="Data de Término" className="bg-[#2c2c40] border border-white/[0.16] rounded-lg px-4 py-2.5 text-white text-sm outline-none" />
              <input placeholder="Email do Cliente" type="email" value={clientForm.user_email} onChange={(e) => setClientForm({ ...clientForm, user_email: e.target.value })} className="bg-[#2c2c40] border border-white/[0.16] rounded-lg px-4 py-2.5 text-white text-sm outline-none col-span-2" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setClientFormOpen(false)} className="text-sm text-gray-400 px-4 py-2">Cancelar</button>
              <button type="submit" className="text-sm bg-[#cea165] hover:bg-[#d4ad72] text-white font-medium px-6 py-2 rounded-lg transition">Salvar</button>
            </div>
          </form>
        )}

        {/* Clients table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-white/10">
              <th className="text-left pb-3 font-medium">CLIENTE</th>
              <th className="text-left pb-3 font-medium">CNPJ</th>
              <th className="text-left pb-3 font-medium">TIPO</th>
              <th className="text-left pb-3 font-medium">VALOR</th>
              <th className="text-left pb-3 font-medium">INÍCIO</th>
              <th className="text-left pb-3 font-medium">TÉRMINO</th>
              <th className="text-left pb-3 font-medium">CONTRATO</th>
              <th className="text-left pb-3 font-medium">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {allClients.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="py-3">
                  <div className="text-white font-medium">{c.nome_empresa}</div>
                  <div className="text-xs text-gray-500">{c.nome_socio}</div>
                </td>
                <td className="py-3 text-gray-400">{c.cnpj ?? "-"}</td>
                <td className="py-3">
                  <span className="text-xs bg-[#cea165]/20 text-[#cea165] px-2 py-1 rounded-full">{c.tipo_contrato ?? "-"}</span>
                </td>
                <td className="py-3 text-white">{c.valor_contrato ? formatCurrency(c.valor_contrato) : "-"}</td>
                <td className="py-3 text-gray-400">{c.data_inicio_contrato ? new Date(c.data_inicio_contrato).toLocaleDateString("pt-BR") : "-"}</td>
                <td className="py-3 text-gray-400">{c.data_termino_contrato ? new Date(c.data_termino_contrato).toLocaleDateString("pt-BR") : "-"}</td>
                <td className="py-3 text-gray-500">—</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button className="text-gray-500 hover:text-[#cea165] transition"><Edit2 className="w-4 h-4" /></button>
                    <button className="text-gray-500 hover:text-[#cea165] transition"><Archive className="w-4 h-4" /></button>
                    <button className="text-gray-500 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinCard({ label, value, icon, valueColor }: { label: string; value: string; icon: React.ReactNode; valueColor?: string }) {
  return (
    <div className="bg-[#13131f] border border-white/[0.16] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium tracking-wider">{label}</span>
        {icon}
      </div>
      <p className={`text-xl font-bold ${valueColor ?? "text-white"}`}>{value}</p>
    </div>
  );
}

function RoleCard({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div className="bg-[#13131f] border border-white/[0.16] rounded-xl p-4">
      <h4 className={`font-bold text-sm mb-3 ${color}`}>{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-xs text-gray-400 flex items-start gap-1.5">
            <span className="text-gray-600 mt-0.5">•</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
