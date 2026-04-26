"use client";

import { useEffect, useState } from "react";
import { useApp } from "../../layout";
import { parsePeriodMonths, formatCurrency, CATEGORY_OPTIONS, getCurrentYearMonth } from "@/lib/constants";
import type { FinancialEntry, EntryType, CategoryGroup } from "@/types/database";
import { Plus, Receipt, Edit2, Trash2, Check, X } from "lucide-react";

function getCategoryGroup(category: string): CategoryGroup {
  for (const [group, cats] of Object.entries(CATEGORY_OPTIONS)) {
    if (cats.includes(category)) return group as CategoryGroup;
  }
  return "Honorários";
}

const emptyForm = {
  client_id: "",
  reference_month: getCurrentYearMonth(),
  entry_date: new Date().toISOString().slice(0, 10),
  entry_type: "Receita" as EntryType,
  category: "",
  amount: "",
  description: "",
};

export default function EntriesPage() {
  const { selectedPeriod, selectedClient, clients } = useApp();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    ...emptyForm,
    client_id: selectedClient !== "all" ? selectedClient : "",
  });

  useEffect(() => {
    loadEntries();
  }, [selectedPeriod, selectedClient]);

  useEffect(() => {
    if (selectedClient !== "all") {
      setForm((f) => ({ ...f, client_id: selectedClient }));
    }
  }, [selectedClient]);

  async function loadEntries() {
    setLoading(true);
    const months = parsePeriodMonths(selectedPeriod);
    const params = new URLSearchParams({ months: months.join(",") });
    if (selectedClient !== "all") params.set("client_id", selectedClient);
    const res = await fetch(`/api/financial-entries?${params}`);
    const { data } = await res.json();
    setEntries(data ?? []);
    setLoading(false);
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      client_id: selectedClient !== "all" ? selectedClient : "",
    });
    setEditingId(null);
  }

  function startEdit(entry: FinancialEntry) {
    setEditingId(entry.id);
    setForm({
      client_id: entry.client_id ?? "",
      reference_month: entry.reference_month,
      entry_date: entry.entry_date,
      entry_type: entry.entry_type,
      category: entry.category,
      amount: String(entry.amount),
      description: entry.description ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const categoryGroup = getCategoryGroup(form.category);
    const payload = {
      client_id: form.client_id || null,
      reference_month: form.reference_month,
      entry_date: form.entry_date,
      entry_type: form.entry_type,
      category_group: categoryGroup,
      category: form.category,
      amount: Number(form.amount),
      description: form.description || null,
    };

    if (editingId) {
      await fetch("/api/financial-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...payload }),
      });
    } else {
      await fetch("/api/financial-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    resetForm();
    setSaving(false);
    loadEntries();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/financial-entries?id=${id}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    loadEntries();
  }

  const filteredEntries = entries.filter((e) => {
    if (filterMonth !== "all" && e.reference_month !== filterMonth) return false;
    if (filterType !== "all" && e.entry_type !== filterType) return false;
    return true;
  });

  const inputClass = "w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm focus:border-primary/50 outline-none transition-colors";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Receipt className="w-8 h-8 text-muted-foreground" />
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] tracking-tight text-foreground">Lançamentos</h2>
          <p className="text-muted-foreground text-sm">Registre suas receitas e despesas mensais</p>
        </div>
      </div>

      {/* Entry Form */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-primary font-semibold text-sm tracking-wider flex items-center gap-2">
            {editingId ? <><Edit2 className="w-4 h-4" /> EDITAR LANÇAMENTO</> : <><Plus className="w-4 h-4" /> NOVO LANÇAMENTO</>}
          </h3>
          {editingId && (
            <button onClick={resetForm} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <X className="w-3.5 h-3.5" /> Cancelar edição
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground font-medium tracking-wider mb-1 block">CLIENTE</label>
            <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className={inputClass}>
              <option value="">Selecione o cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.nome_empresa}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium tracking-wider mb-1 block">MÊS DE REFERÊNCIA</label>
              <input type="month" value={form.reference_month} onChange={(e) => setForm({ ...form, reference_month: e.target.value })} className={inputClass} required />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium tracking-wider mb-1 block">DATA DO LANÇAMENTO</label>
              <input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} className={inputClass} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium tracking-wider mb-1 block">TIPO</label>
              <select value={form.entry_type} onChange={(e) => setForm({ ...form, entry_type: e.target.value as EntryType })} className={inputClass}>
                <option value="Receita">Receita</option>
                <option value="Despesa">Despesa</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium tracking-wider mb-1 block">CATEGORIA</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} required>
                <option value="">Selecione a categoria</option>
                {Object.entries(CATEGORY_OPTIONS).map(([group, cats]) => (
                  <optgroup key={group} label={group}>
                    {cats.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium tracking-wider mb-1 block">VALOR (R$)</label>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" className={inputClass} required />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium tracking-wider mb-1 block">DESCRIÇÃO (OPCIONAL)</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição..." className={inputClass} />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {editingId ? (
              <>{saving ? "Salvando..." : "Salvar Alterações"}</>
            ) : (
              <><Plus className="w-4 h-4" />{saving ? "Registrando..." : "Registrar Lançamento"}</>
            )}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-primary font-semibold text-sm tracking-wider">HISTÓRICO DE LANÇAMENTOS</h3>
          <div className="flex gap-2">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-muted-foreground"
            >
              <option value="all">Todos os meses</option>
              {[...new Set(entries.map((e) => e.reference_month))].sort().map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-muted-foreground"
            >
              <option value="all">Todos</option>
              <option value="Receita">Receitas</option>
              <option value="Despesa">Despesas</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : filteredEntries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum lançamento encontrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left pb-3 font-medium">Data</th>
                <th className="text-left pb-3 font-medium">Tipo</th>
                <th className="text-left pb-3 font-medium">Grupo</th>
                <th className="text-left pb-3 font-medium">Categoria</th>
                <th className="text-left pb-3 font-medium">Descrição</th>
                <th className="text-right pb-3 font-medium">Valor</th>
                <th className="text-right pb-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className={`border-b border-border/30 ${editingId === entry.id ? "bg-primary/5" : ""}`}>
                  <td className="py-3 text-muted-foreground">{new Date(entry.entry_date).toLocaleDateString("pt-BR")}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      entry.entry_type === "Receita" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {entry.entry_type}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground/60 text-xs">{entry.category_group}</td>
                  <td className="py-3 text-foreground/80">{entry.category}</td>
                  <td className="py-3 text-muted-foreground">{entry.description || "-"}</td>
                  <td className={`py-3 text-right font-semibold ${entry.entry_type === "Receita" ? "text-emerald-400" : "text-red-400"}`}>
                    {formatCurrency(entry.amount)}
                  </td>
                  <td className="py-3 text-right">
                    {confirmDeleteId === entry.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-red-400">Excluir?</span>
                        <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-300"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(entry)} className="text-muted-foreground hover:text-primary transition-colors" title="Editar"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmDeleteId(entry.id)} className="text-muted-foreground hover:text-red-400 transition-colors" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
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
