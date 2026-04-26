"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "../../layout";
import { parsePeriodMonths, formatCurrency, CATEGORY_OPTIONS, getCurrentYearMonth } from "@/lib/constants";
import type { FinancialEntry, EntryType, CategoryGroup, Client } from "@/types/database";
import { Plus, Receipt } from "lucide-react";

export default function EntriesPage() {
  const { selectedPeriod, selectedClient, clients } = useApp();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const supabase = createClient();

  const [form, setForm] = useState({
    client_id: selectedClient !== "all" ? selectedClient : "",
    reference_month: getCurrentYearMonth(),
    entry_date: new Date().toISOString().slice(0, 10),
    entry_type: "Receita" as EntryType,
    category_group: "Honorários" as CategoryGroup,
    category: "",
    amount: "",
    description: "",
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
    let query = supabase.from("financial_entries").select("*").in("reference_month", months).order("entry_date", { ascending: false });
    if (selectedClient !== "all") {
      query = query.eq("client_id", selectedClient);
    }
    const { data } = await query;
    setEntries(data ?? []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("financial_entries").insert({
      client_id: form.client_id || null,
      reference_month: form.reference_month,
      entry_date: form.entry_date,
      entry_type: form.entry_type,
      category_group: form.category_group,
      category: form.category,
      amount: Number(form.amount),
      description: form.description || null,
      created_by: user?.id,
    });

    setForm({
      client_id: selectedClient !== "all" ? selectedClient : "",
      reference_month: getCurrentYearMonth(),
      entry_date: new Date().toISOString().slice(0, 10),
      entry_type: "Receita",
      category_group: "Honorários",
      category: "",
      amount: "",
      description: "",
    });
    setSaving(false);
    loadEntries();
  }

  const categories = CATEGORY_OPTIONS[form.category_group] ?? [];

  const filteredEntries = entries.filter((e) => {
    if (filterMonth !== "all" && e.reference_month !== filterMonth) return false;
    if (filterType !== "all" && e.entry_type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Receipt className="w-8 h-8 text-gray-500" />
        <div>
          <h2 className="text-2xl font-bold text-white">Lançamentos</h2>
          <p className="text-gray-400 text-sm">Registre suas receitas e despesas mensais</p>
        </div>
      </div>

      {/* Entry Form */}
      <div className="bg-[#2c2c40] border border-white/[0.16] rounded-2xl p-6">
        <h3 className="text-[#cea165] font-semibold text-sm tracking-wider mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> NOVO LANÇAMENTO
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client */}
          <div>
            <label className="text-xs text-gray-500 font-medium tracking-wider mb-1 block">CLIENTE</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="w-full bg-[#13131f] border border-white/[0.16] rounded-lg px-4 py-3 text-white text-sm focus:border-[#cea165]/50 outline-none"
            >
              <option value="">Selecione o cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.nome_empresa}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium tracking-wider mb-1 block">MÊS DE REFERÊNCIA</label>
              <input
                type="month"
                value={form.reference_month}
                onChange={(e) => setForm({ ...form, reference_month: e.target.value })}
                className="w-full bg-[#13131f] border border-white/[0.16] rounded-lg px-4 py-3 text-white text-sm focus:border-[#cea165]/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium tracking-wider mb-1 block">DATA DO LANÇAMENTO</label>
              <input
                type="date"
                value={form.entry_date}
                onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                className="w-full bg-[#13131f] border border-white/[0.16] rounded-lg px-4 py-3 text-white text-sm focus:border-[#cea165]/50 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium tracking-wider mb-1 block">TIPO</label>
              <select
                value={form.entry_type}
                onChange={(e) => setForm({ ...form, entry_type: e.target.value as EntryType })}
                className="w-full bg-[#13131f] border border-white/[0.16] rounded-lg px-4 py-3 text-white text-sm focus:border-[#cea165]/50 outline-none"
              >
                <option value="Receita">Receita</option>
                <option value="Despesa">Despesa</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium tracking-wider mb-1 block">CATEGORIA</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[#13131f] border border-white/[0.16] rounded-lg px-4 py-3 text-white text-sm focus:border-[#cea165]/50 outline-none"
              >
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
              <label className="text-xs text-gray-500 font-medium tracking-wider mb-1 block">VALOR (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0,00"
                className="w-full bg-[#13131f] border border-white/[0.16] rounded-lg px-4 py-3 text-white text-sm focus:border-[#cea165]/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium tracking-wider mb-1 block">DESCRIÇÃO (OPCIONAL)</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição..."
                className="w-full bg-[#13131f] border border-white/[0.16] rounded-lg px-4 py-3 text-white text-sm focus:border-[#cea165]/50 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#cea165] hover:bg-[#d4ad72] text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {saving ? "Registrando..." : "+ Registrar Lançamento"}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="bg-[#2c2c40] border border-white/[0.16] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#cea165] font-semibold text-sm tracking-wider">HISTÓRICO DE LANÇAMENTOS</h3>
          <div className="flex gap-2">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-[#13131f] border border-white/[0.16] rounded-lg px-3 py-1.5 text-sm text-gray-300"
            >
              <option value="all">Todos os meses</option>
              {[...new Set(entries.map((e) => e.reference_month))].sort().map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#13131f] border border-white/[0.16] rounded-lg px-3 py-1.5 text-sm text-gray-300"
            >
              <option value="all">Todos</option>
              <option value="Receita">Receitas</option>
              <option value="Despesa">Despesas</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Carregando...</p>
        ) : filteredEntries.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum lançamento encontrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-white/10">
                <th className="text-left pb-3 font-medium">Data</th>
                <th className="text-left pb-3 font-medium">Tipo</th>
                <th className="text-left pb-3 font-medium">Categoria</th>
                <th className="text-left pb-3 font-medium">Descrição</th>
                <th className="text-right pb-3 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-white/5">
                  <td className="py-3 text-gray-300">{new Date(entry.entry_date).toLocaleDateString("pt-BR")}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      entry.entry_type === "Receita" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}>
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
