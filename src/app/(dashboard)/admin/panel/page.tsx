"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "../../layout";
import { formatCurrency, formatCNPJ, formatCPF, formatCEP, parsePeriodMonths, getCurrentYearMonth, getGroupedPeriodOptions, formatYearMonth } from "@/lib/constants";
import type { Profile, Client, FinancialEntry } from "@/types/database";
import { Users, UserPlus, Mail, Trash2, Shield, Edit2, ChevronDown, Plus, Power, X, Check, FileUp, FileText } from "lucide-react";

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

const emptyClientForm = {
  nome_empresa: "", cnpj: "", rua: "", numero: "", complemento: "",
  bairro: "", cidade: "", estado: "", cep: "",
  nome_socio: "", cpf_socio: "",
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
  const [userTab, setUserTab] = useState<"admin" | "clientes">("admin");

  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);

  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientForm, setClientForm] = useState({ ...emptyClientForm });
  const [confirmDeleteClient, setConfirmDeleteClient] = useState<string | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [savingClient, setSavingClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

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

  async function handleSaveUserName() {
    if (!editingUser || !editUserName.trim()) return;
    await fetch("/api/profiles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingUser.id, full_name: editUserName }),
    });
    setUsers((prev) => prev.map((u) => u.id === editingUser.id ? { ...u, full_name: editUserName } : u));
    setEditingUser(null);
  }

  async function handleDeleteUser(id: string) {
    await fetch(`/api/profiles?id=${id}`, { method: "DELETE" });
    setConfirmDeleteUser(null);
    loadData();
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviteStatus("enviando");
    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      if (data.warning) {
        setInviteStatus(`⚠ ${data.warning}\nSenha temporária: ${data.tempPassword}`);
      } else {
        setInviteStatus("✓ Convite enviado com sucesso!");
      }
      setInviteEmail("");
      loadData();
      setTimeout(() => setInviteStatus(null), data.warning ? 15000 : 3000);
    } else {
      setInviteStatus(data.error || "Erro ao enviar convite");
      setTimeout(() => setInviteStatus(null), 5000);
    }
  }

  function openEditClient(c: Client) {
    setEditingClientId(c.id);
    setClientForm({
      nome_empresa: c.nome_empresa,
      cnpj: c.cnpj ? formatCNPJ(c.cnpj) : "",
      rua: c.rua ?? "",
      numero: c.numero ?? "",
      complemento: c.complemento ?? "",
      bairro: c.bairro ?? "",
      cidade: c.cidade ?? "",
      estado: c.estado ?? "",
      cep: c.cep ? formatCEP(c.cep) : "",
      nome_socio: c.nome_socio ?? "",
      cpf_socio: c.cpf_socio ? formatCPF(c.cpf_socio) : "",
      tipo_contrato: c.tipo_contrato ?? "Mensal",
      valor_contrato: c.valor_contrato ? String(c.valor_contrato) : "",
      prazo_contrato: c.prazo_contrato ?? "",
      data_inicio_contrato: c.data_inicio_contrato ?? "",
      data_termino_contrato: c.data_termino_contrato ?? "",
      user_email: users.find((u) => u.id === c.user_id)?.email ?? "",
    });
    setContractFile(null);
    setClientFormOpen(true);
  }

  function openNewClient() {
    setEditingClientId(null);
    setClientForm({ ...emptyClientForm });
    setClientFormOpen(true);
  }

  async function handleSaveClient(e: React.FormEvent) {
    e.preventDefault();
    setSavingClient(true);

    const payload: Record<string, unknown> = {
      nome_empresa: clientForm.nome_empresa,
      cnpj: clientForm.cnpj.replace(/\D/g, "") || null,
      rua: clientForm.rua || null,
      numero: clientForm.numero || null,
      complemento: clientForm.complemento || null,
      bairro: clientForm.bairro || null,
      cidade: clientForm.cidade || null,
      estado: clientForm.estado || null,
      cep: clientForm.cep.replace(/\D/g, "") || null,
      nome_socio: clientForm.nome_socio || null,
      cpf_socio: clientForm.cpf_socio.replace(/\D/g, "") || null,
      tipo_contrato: clientForm.tipo_contrato,
      valor_contrato: clientForm.valor_contrato ? Number(clientForm.valor_contrato) : null,
      prazo_contrato: clientForm.prazo_contrato || null,
      data_inicio_contrato: clientForm.data_inicio_contrato || null,
      data_termino_contrato: clientForm.data_termino_contrato || null,
    };

    if (clientForm.user_email) {
      const existingUser = users.find((u) => u.email === clientForm.user_email);
      if (existingUser) {
        payload.user_id = existingUser.id;
      } else {
        const invRes = await fetch("/api/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: clientForm.user_email, role: "cliente", full_name: clientForm.nome_socio || clientForm.nome_empresa }),
        });
        const invData = await invRes.json().catch(() => ({}));
        if (invRes.ok && invData.ok) {
          const updatedUsers = await fetch("/api/profiles").then((r) => r.json()).then((d) => d.data ?? []);
          const newUser = updatedUsers.find((u: Profile) => u.email === clientForm.user_email);
          if (newUser) payload.user_id = newUser.id;
        }
      }
    }

    if (contractFile) {
      const ext = contractFile.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(fileName, contractFile);
      if (!uploadError && uploadData) {
        payload.contrato_url = uploadData.path;
      }
    }

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
    setContractFile(null);
    setSavingClient(false);
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-primary font-semibold text-sm tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> GESTÃO DE USUÁRIOS
          </h3>
          <div className="flex bg-background border border-border rounded-lg p-0.5">
            <button
              onClick={() => setUserTab("admin")}
              className={`text-xs font-medium px-4 py-1.5 rounded-md transition-colors ${userTab === "admin" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Administrativos ({users.filter((u) => u.role !== "cliente").length})
            </button>
            <button
              onClick={() => setUserTab("clientes")}
              className={`text-xs font-medium px-4 py-1.5 rounded-md transition-colors ${userTab === "clientes" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Clientes ({users.filter((u) => u.role === "cliente").length})
            </button>
          </div>
        </div>

        {/* Invite (só na aba admin) */}
        {userTab === "admin" && (
          <>
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
              <div className={`text-xs mb-4 whitespace-pre-line rounded-lg p-3 ${inviteStatus.includes("⚠") ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : inviteStatus.includes("Erro") ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                {inviteStatus}
              </div>
            )}
          </>
        )}

        {/* Users table */}
        <table className="w-full text-sm mt-2">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left pb-3 font-medium">NOME</th>
              <th className="text-left pb-3 font-medium">EMAIL</th>
              <th className="text-left pb-3 font-medium">PERFIL</th>
              {userTab === "admin" && <th className="text-left pb-3 font-medium">ALTERAR PERFIL</th>}
              <th className="text-left pb-3 font-medium">STATUS</th>
              <th className="text-left pb-3 font-medium">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {users.filter((u) => userTab === "admin" ? u.role !== "cliente" : u.role === "cliente").map((u) => (
              <tr key={u.id} className="border-b border-border/30">
                <td className="py-3 text-foreground">
                  {editingUser?.id === u.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editUserName}
                        onChange={(e) => setEditUserName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveUserName()}
                        className="bg-background border border-border rounded px-2 py-1 text-sm text-foreground outline-none focus:border-primary/50 w-40"
                        autoFocus
                      />
                      <button onClick={handleSaveUserName} className="text-emerald-400 hover:text-emerald-300"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    u.full_name
                  )}
                </td>
                <td className="py-3 text-muted-foreground">{u.email}</td>
                <td className="py-3">
                  <span className="text-xs bg-primary/15 text-primary px-2 py-1 rounded-full capitalize">{u.role}</span>
                </td>
                {userTab === "admin" && (
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
                )}
                <td className="py-3">
                  {userTab === "clientes" ? (
                    u.onboarding_complete
                      ? <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">Cadastrado</span>
                      : <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">Aguardando</span>
                  ) : (
                    <button
                      onClick={() => handleToggleStatus(u.id, u.status)}
                      className={`text-xs px-2 py-1 rounded-full cursor-pointer transition ${u.status === "ativo" ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}
                    >
                      {u.status === "ativo" ? "Ativo" : "Inativo"}
                    </button>
                  )}
                </td>
                <td className="py-3">
                  {confirmDeleteUser === u.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400">Excluir?</span>
                      <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-300"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDeleteUser(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingUser(u); setEditUserName(u.full_name); }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="Editar nome"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteUser(u.id)}
                        className="text-muted-foreground hover:text-red-400 transition-colors"
                        title="Excluir usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.filter((u) => userTab === "admin" ? u.role !== "cliente" : u.role === "cliente").length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground text-sm">Nenhum usuário nesta categoria</td></tr>
            )}
          </tbody>
        </table>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="Nome da Empresa *" value={clientForm.nome_empresa} onChange={(e) => setClientForm({ ...clientForm, nome_empresa: e.target.value })} required className={inputClass} />
              <input placeholder="CNPJ" value={clientForm.cnpj} onChange={(e) => setClientForm({ ...clientForm, cnpj: formatCNPJ(e.target.value) })} maxLength={18} className={inputClass} />
              <input placeholder="Email do Cliente" type="email" value={clientForm.user_email} onChange={(e) => setClientForm({ ...clientForm, user_email: e.target.value })} className={inputClass} />
              <input placeholder="Nome do Sócio" value={clientForm.nome_socio} onChange={(e) => setClientForm({ ...clientForm, nome_socio: e.target.value })} className={inputClass} />
              <input placeholder="CPF do Sócio" value={clientForm.cpf_socio} onChange={(e) => setClientForm({ ...clientForm, cpf_socio: formatCPF(e.target.value) })} maxLength={14} className={inputClass} />
            </div>

            <div className="border-t border-border/50 pt-4 mt-2">
              <p className="text-xs text-muted-foreground font-medium tracking-wider mb-3">ENDEREÇO</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input placeholder="Rua / Logradouro" value={clientForm.rua} onChange={(e) => setClientForm({ ...clientForm, rua: e.target.value })} className={`${inputClass} md:col-span-2`} />
                <input placeholder="Número" value={clientForm.numero} onChange={(e) => setClientForm({ ...clientForm, numero: e.target.value })} className={inputClass} />
                <input placeholder="Complemento" value={clientForm.complemento} onChange={(e) => setClientForm({ ...clientForm, complemento: e.target.value })} className={inputClass} />
                <input placeholder="Bairro" value={clientForm.bairro} onChange={(e) => setClientForm({ ...clientForm, bairro: e.target.value })} className={inputClass} />
                <input placeholder="Cidade" value={clientForm.cidade} onChange={(e) => setClientForm({ ...clientForm, cidade: e.target.value })} className={inputClass} />
                <select value={clientForm.estado} onChange={(e) => setClientForm({ ...clientForm, estado: e.target.value })} className={inputClass}>
                  <option value="">UF</option>
                  {ESTADOS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
                <input placeholder="CEP" value={clientForm.cep} onChange={(e) => setClientForm({ ...clientForm, cep: formatCEP(e.target.value) })} maxLength={9} className={inputClass} />
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 mt-2">
              <p className="text-xs text-muted-foreground font-medium tracking-wider mb-3">CONTRATO</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="mt-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => setContractFile(e.target.files?.[0] ?? null)}
                />
                {contractFile ? (
                  <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm text-foreground truncate flex-1">{contractFile.name}</span>
                    <button type="button" onClick={() => { setContractFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-muted-foreground hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-primary/40 rounded-lg px-4 py-4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FileUp className="w-5 h-5" />
                    <span className="text-sm">Anexar contrato (PDF ou Word)</span>
                  </button>
                )}
                {editingClientId && allClients.find((c) => c.id === editingClientId)?.contrato_url && !contractFile && (
                  <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Contrato já anexado. Envie um novo para substituir.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setClientFormOpen(false); setEditingClientId(null); }} className="text-sm text-muted-foreground px-4 py-2 hover:text-foreground transition-colors">Cancelar</button>
              <button type="submit" disabled={savingClient} className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50">
                {savingClient ? "Salvando..." : editingClientId ? "Salvar Alterações" : "Cadastrar"}
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
              <th className="text-left pb-3 font-medium">ACESSO</th>
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
                <td className="py-3">
                  {(() => {
                    if (!c.user_id) return <span className="text-xs bg-zinc-500/20 text-zinc-400 px-2 py-1 rounded-full">Sem convite</span>;
                    const linkedUser = users.find((u) => u.id === c.user_id);
                    if (!linkedUser) return <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">Pendente</span>;
                    if (!linkedUser.onboarding_complete) return <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">Aguardando cadastro</span>;
                    return <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">Ativo</span>;
                  })()}
                </td>
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
