"use client";

import { useEffect, useState } from "react";
import { useApp } from "../../layout";
import { formatCurrency, parsePeriodMonths, getCurrentYearMonth, getGroupedPeriodOptions, formatYearMonth } from "@/lib/constants";
import type { Profile, Client, FinancialEntry } from "@/types/database";
import { Users, UserPlus, Mail, Trash2, Shield, Edit2, ChevronDown, Plus, Power, X, Check } from "lucide-react";

const emptyClientForm = {
  nome_empresa: "", cnpj: "", endereco: "", nome_socio: "", cpf_socio: "",
  tipo_contrato: "Mensal", valor_contrato: "", prazo_contrato: "",
  data_inicio_contrato: new Date().toISOString().slice(0, 10),
  data_termino_contrato: "", user_email: "",
};

export default function AdminPanelPage() {
  const { clients } = useApp();
  const [users, setUsers] = useState<Profile[]>([]);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [allClients, setAllClients] = useState<Client[]>(clients);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentYearMonth());
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("gestor");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [periodOpen, setPeriodOpen] = useState(false);

  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientForm, setClientForm] = useState({ ...emptyClientForm });
  const [confirmDeleteClient, setConfirmDeleteClient] = useState<string | null>(null);

  const year = new Date().getFullYear();
  const periodOptions = getGroupedPeriodOptions(year);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  async function loadData() {
    setLoading(true);
    const months = parsePeriodMonths(selectedPeriod);
    const params = new URLSearchParams({ months: months.join(",") });

    const [usersRes, entriesRes, clientsRes] = await Promise.all([
      fetch("/api/profiles"),
      fetch(`/api/financial-entries?${params}`),
      fetch("/api/clients"),
    ]);

    const { data: usersData } = await usersRes.json();
    const { data: entriesData } = await entriesRes.json();
    const { data: clientsData } = await clientsRes.json();

    setUsers(usersData ?? []);
    setEntries(entriesData ?? []);
    setAllClients(clientsData ?? []);
    setLoading(false);
  }

  const activeClients = allClients.length;
  const totalReceita = entries.filter((e) => e.entry_type === "Receita").reduce((s, e) => s + e.amount, 0);
  const totalDespesa = entries.filter((e) => e.entry_type === "Despesa").reduce((s, e) => s + e.amount, 0);
  const resultado = totalReceita - totalDespesa;

  async function handleChangeRole(userId: string, newRole: string) {
    await fetch("/api/profiles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, role: newRole }),
    });
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole as Profile["role"] } : u));
  }

  async function handleToggleStatus(userId: string, currentStatus: string) {
    const newStatus = currentStatus === "ativo" ? "inativo" : "ativo";
    await fetch("/api/profiles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, status: newStatus }),
    });
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: newStatus as Profile["status"] } : u));
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviteStatus("enviando");
    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    if (res.ok) {
      setInviteStatus("Convite enviado!");
      setInviteEmail("");
      setTimeout(() => setInviteStatus(null), 3000);
      loadData();
    } else {
      const data = await res.json().catch(() => ({}));
      setInviteStatus(data.error || "Erro ao enviar convite");
      setTimeout(() => setInviteStatus(null), 4000);
    }
  }

  function openEditClient(c: Client) {
    setEditingClientId(c.id);
    setClientForm({
      nome_empresa: c.nome_empresa,
      cnpj: c.cnpj ?? "",
      endereco: c.endereco ?? "",
      nome_socio: c.nome_socio ?? "",
      cpf_socio: c.cpf_socio ?? "",
      tipo_contrato: c.tipo_contrato ?? "Mensal",
      valor_contrato: c.valor_contrato ? String(c.valor_contrato) : "",
      prazo_contrato: c.prazo_contrato ?? "",
      data_inicio_contrato: c.data_inicio_contrato ?? "",
      data_termino_contrato: c.data_termino_contrato ?? "",
      user_email: "",
    });
    setClientFormOpen(true);
  }

  function openNewClient() {
    setEditingClientId(null);
    setClientForm({ ...emptyClientForm });
    setClientFormOpen(true);
  }

  async function handleSaveClient(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
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
    };

    if (editingClientId) {
      await fetch("/api/clients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingClientId, ...payload }),
      });
    } else {
      await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setClientFormOpen(false);
    setEditingClientId(null);
    setClientForm({ ...emptyClientForm });
    loadData();
  }

  async function handleDeleteClient(id: string) {
    await fetch(`/api/clients?id=${id}`, { method: "DELETE" });
    setConfirmDeleteClient(null);
    loadData();
  }

  const inputClass = "bg-background border border-border rounded-lg px-4 py-2.5 text-foreground text-sm outline-none focus:border-primary/50 transition-colors";

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-muted-foreground" />
          <div>
            <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] tracking-tight text-foreground">Painel Admin</h2>
            <p className="text-muted-foreground text-sm">Gestão de usuários e permissões</p>
          </div>
        </div>
      </div>

      {/* Controle Financeiro */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-primary font-semibold text-sm tracking-wider">CONTROLE FINANCEIRO</h3>
          <div className="relative">
            <button
              onClick={() => setPeriodOpen(!periodOpen)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-lg px-4 py-2 hover:bg-secondary transition-colors"
            >
              {formatYearMonth(selectedPeriod)}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${periodOpen ? "rotate-180" : ""}`} />
            </button>
            {periodOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border/50 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-2">
                {periodOptions.months.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSelectedPeriod(opt.value); setPeriodOpen(false); }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${selectedPeriod === opt.value ? "bg-primary/10 text-primary font-medium" : "text-popover-foreground/60 hover:bg-secondary hover:text-popover-foreground"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Exibindo: {formatYearMonth(selectedPeriod)}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <FinCard label="CLIENTES ATIVOS" value={String(activeClients)} icon={<Users className="w-5 h-5 text-emerald-400" />} />
          <FinCard label="FATURAMENTO BRUTO" value={formatCurrency(totalReceita)} />
          <FinCard label="DESPESAS" value={formatCurrency(totalDespesa)} valueColor="text-red-400" />
          <FinCard label="LUCRO DO PERÍODO" value={formatCurrency(resultado)} valueColor={resultado >= 0 ? "text-emerald-400" : "text-red-400"} />
        </div>
      </div>

      {/* Gestão de Usuários */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-primary font-semibold text-sm tracking-wider mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" /> GESTÃO DE USUÁRIOS
        </h3>

        {/* Invite */}
        <div className="flex gap-2 mb-2">
          <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 flex-1">
            <UserPlus className="w-4 h-4 text-primary" />
            <input
              type="email"
              placeholder="email@exemplo.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              className="flex-1 bg-transparent text-foreground text-sm py-3 outline-none placeholder:text-muted-foreground/40"
            />
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground"
          >
            <option value="admin">Admin</option>
            <option value="gestor">Gestor</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={inviteStatus === "enviando"}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Mail className="w-4 h-4" /> Convidar
          </button>
        </div>
        {inviteStatus && inviteStatus !== "enviando" && (
          <p className={`text-xs mb-4 ${inviteStatus.includes("Erro") ? "text-red-400" : "text-emerald-400"}`}>{inviteStatus}</p>
        )}

        {/* Users table */}
        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
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
              <tr key={u.id} className="border-b border-border/30">
                <td className="py-3 text-foreground">{u.full_name}</td>
                <td className="py-3 text-muted-foreground">{u.email}</td>
                <td className="py-3">
                  <span className="text-xs bg-primary/15 text-primary px-2 py-1 rounded-full capitalize">{u.role}</span>
                </td>
                <td className="py-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleChangeRole(u.id, e.target.value)}
                    className="bg-background border border-border rounded text-sm text-muted-foreground px-2 py-1"
                  >
                    <option value="admin">Admin</option>
                    <option value="gestor">Gestor</option>
                    <option value="cliente">Cliente</option>
                  </select>
                </td>
                <td className="py-3">
                  <button
                    onClick={() => handleToggleStatus(u.id, u.status)}
                    className={`text-xs px-2 py-1 rounded-full cursor-pointer transition ${u.status === "ativo" ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}
                  >
                    {u.status === "ativo" ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="py-3">
                  <button
                    onClick={() => handleToggleStatus(u.id, u.status)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title={u.status === "ativo" ? "Desativar" : "Reativar"}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Role descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <RoleCard title="ADMIN" color="text-primary" items={["Acesso total ao sistema", "Convidar e gerenciar usuários", "Controle financeiro completo", "Gestão de clientes", "Configurações da plataforma"]} />
          <RoleCard title="GESTOR" color="text-amber-600" items={["Cadastrar e editar clientes", "Lançar receitas e despesas", "Visualizar dashboard", "Acessar DRE", "Sem acesso ao painel Admin"]} />
          <RoleCard title="CLIENTE" color="text-muted-foreground" items={["Visualizar seu dashboard", "Visualizar seu DRE", "Visualizar seus lançamentos", "Sem acesso ao Admin", "Sem acesso a outros clientes"]} />
        </div>
      </div>

      {/* Gestão de Clientes */}
      <div className="bg-card border border-primary/15 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-primary font-semibold text-sm tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> GESTÃO DE CLIENTES
          </h3>
          <button
            onClick={openNewClient}
            className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Cadastrar Cliente
          </button>
        </div>

        {/* Client form */}
        {clientFormOpen && (
          <form onSubmit={handleSaveClient} className="bg-background border border-border rounded-xl p-4 mb-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-foreground">{editingClientId ? "Editar Cliente" : "Novo Cliente"}</h4>
              <button type="button" onClick={() => { setClientFormOpen(false); setEditingClientId(null); }}>
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Nome da Empresa *" value={clientForm.nome_empresa} onChange={(e) => setClientForm({ ...clientForm, nome_empresa: e.target.value })} required className={inputClass} />
              <input placeholder="CNPJ" value={clientForm.cnpj} onChange={(e) => setClientForm({ ...clientForm, cnpj: e.target.value })} className={inputClass} />
              <input placeholder="Endereço" value={clientForm.endereco} onChange={(e) => setClientForm({ ...clientForm, endereco: e.target.value })} className={`${inputClass} col-span-2`} />
              <input placeholder="Nome do Sócio" value={clientForm.nome_socio} onChange={(e) => setClientForm({ ...clientForm, nome_socio: e.target.value })} className={inputClass} />
              <input placeholder="CPF do Sócio" value={clientForm.cpf_socio} onChange={(e) => setClientForm({ ...clientForm, cpf_socio: e.target.value })} className={inputClass} />
              <select value={clientForm.tipo_contrato} onChange={(e) => setClientForm({ ...clientForm, tipo_contrato: e.target.value })} className={inputClass}>
                <option value="Pack">Pack</option>
                <option value="Mensal">Mensal</option>
                <option value="Anual">Anual</option>
              </select>
              <input placeholder="Valor do Contrato (R$)" type="number" step="0.01" value={clientForm.valor_contrato} onChange={(e) => setClientForm({ ...clientForm, valor_contrato: e.target.value })} className={inputClass} />
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data de Início</label>
                <input type="date" value={clientForm.data_inicio_contrato} onChange={(e) => setClientForm({ ...clientForm, data_inicio_contrato: e.target.value })} className={`w-full ${inputClass}`} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data de Término</label>
                <input type="date" value={clientForm.data_termino_contrato} onChange={(e) => setClientForm({ ...clientForm, data_termino_contrato: e.target.value })} className={`w-full ${inputClass}`} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setClientFormOpen(false); setEditingClientId(null); }} className="text-sm text-muted-foreground px-4 py-2 hover:text-foreground transition-colors">Cancelar</button>
              <button type="submit" className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2 rounded-lg transition-colors">
                {editingClientId ? "Salvar Alterações" : "Cadastrar"}
              </button>
            </div>
          </form>
        )}

        {/* Clients table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left pb-3 font-medium">CLIENTE</th>
              <th className="text-left pb-3 font-medium">CNPJ</th>
              <th className="text-left pb-3 font-medium">TIPO</th>
              <th className="text-left pb-3 font-medium">VALOR</th>
              <th className="text-left pb-3 font-medium">INÍCIO</th>
              <th className="text-left pb-3 font-medium">TÉRMINO</th>
              <th className="text-left pb-3 font-medium">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {allClients.map((c) => (
              <tr key={c.id} className="border-b border-border/30">
                <td className="py-3">
                  <div className="text-foreground font-medium">{c.nome_empresa}</div>
                  <div className="text-xs text-muted-foreground">{c.nome_socio}</div>
                </td>
                <td className="py-3 text-muted-foreground">{c.cnpj ?? "-"}</td>
                <td className="py-3">
                  <span className="text-xs bg-primary/15 text-primary px-2 py-1 rounded-full">{c.tipo_contrato ?? "-"}</span>
                </td>
                <td className="py-3 text-foreground">{c.valor_contrato ? formatCurrency(c.valor_contrato) : "-"}</td>
                <td className="py-3 text-muted-foreground">{c.data_inicio_contrato ? new Date(c.data_inicio_contrato).toLocaleDateString("pt-BR") : "-"}</td>
                <td className="py-3 text-muted-foreground">{c.data_termino_contrato ? new Date(c.data_termino_contrato).toLocaleDateString("pt-BR") : "-"}</td>
                <td className="py-3">
                  {confirmDeleteClient === c.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400">Excluir?</span>
                      <button onClick={() => handleDeleteClient(c.id)} className="text-red-400 hover:text-red-300"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDeleteClient(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => openEditClient(c)} className="text-muted-foreground hover:text-primary transition-colors" title="Editar"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDeleteClient(c.id)} className="text-muted-foreground hover:text-red-400 transition-colors" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinCard({ label, value, icon, valueColor }: { label: string; value: string; icon?: React.ReactNode; valueColor?: string }) {
  return (
    <div className="bg-background border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium tracking-wider">{label}</span>
        {icon}
      </div>
      <p className={`text-xl font-bold font-[family-name:var(--font-heading)] ${valueColor ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

function RoleCard({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div className="bg-background border border-border rounded-xl p-4">
      <h4 className={`font-bold text-sm mb-3 ${color}`}>{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-xs text-muted-foreground flex items-start gap-1.5">
            <span className="text-muted-foreground/40 mt-0.5">•</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
