"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Profile, Client } from "@/types/database";
import { getCurrentYearMonth, getGroupedPeriodOptions, formatYearMonth } from "@/lib/constants";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Receipt,
  Shield,
  FileText,
  ChevronDown,
} from "lucide-react";

interface AppContextType {
  profile: Profile;
  selectedPeriod: string;
  setSelectedPeriod: (p: string) => void;
  selectedClient: string;
  setSelectedClient: (c: string) => void;
  clients: Client[];
}

const AppContext = createContext<AppContextType | null>(null);
export const useApp = () => useContext(AppContext)!;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentYearMonth());
  const [selectedClient, setSelectedClient] = useState("all");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const isAdmin = profile?.role === "admin" || profile?.role === "gestor";

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!p) { router.replace("/login"); return; }
      setProfile(p);

      if (p.role === "admin" || p.role === "gestor") {
        const { data: c } = await supabase.from("clients").select("*").order("nome_empresa");
        setClients(c ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0c1d]">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  const year = new Date().getFullYear();
  const periodOptions = getGroupedPeriodOptions(year);

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, visible: true },
    { label: "DRE Tradicional", href: "/admin/dre", icon: FileSpreadsheet, visible: true },
    { label: "Lançamentos", href: "/admin/entries", icon: Receipt, visible: isAdmin },
    { label: "Admin", href: "/admin/panel", icon: Shield, visible: profile.role === "admin" },
  ];

  const selectedClientData = clients.find((c) => c.id === selectedClient);

  return (
    <AppContext.Provider value={{ profile, selectedPeriod, setSelectedPeriod, selectedClient, setSelectedClient, clients }}>
      <div className="min-h-screen bg-[#0c0c1d]">
        {/* Header */}
        <header className="bg-[#0c0c1d] sticky top-0 z-40">
          <div className="max-w-[1400px] mx-auto px-6 pt-1 pb-1">
            {/* Single row: Logo left, contract right */}
            <div className="flex items-center justify-between">
              <Image src="/logo-frame.png" alt="FRAME" width={406} height={161} className="object-contain shrink-0 -ml-28 -my-14" priority />
              <button className="text-xs text-gray-400 border border-white/[0.16] rounded-full px-3 py-1.5 hover:border-[#cea165]/50 hover:text-[#cea165] transition">
                <FileText className="inline w-3.5 h-3.5 mr-1" />
                Contrato
              </button>
            </div>

            {/* Nav row */}
            <div className="flex items-center justify-end gap-1.5 flex-wrap -mt-1">
              <span className="text-xs text-gray-400 border border-white/[0.16] rounded-full px-3 py-1.5">
                FRAME - Contabilidade para Advogados
              </span>

              {navItems.filter((n) => n.visible).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1 text-xs rounded-full px-3 py-1.5 transition ${
                    pathname === item.href
                      ? "bg-[#cea165]/15 text-[#cea165] border border-[#cea165]/40"
                      : "text-gray-400 border border-white/[0.16] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              ))}

              {/* Period selector */}
              <div className="relative">
                <button
                  onClick={() => { setPeriodOpen(!periodOpen); setClientOpen(false); }}
                  className="flex items-center gap-1 text-xs text-gray-300 border border-white/[0.16] rounded-full px-3 py-1.5 hover:border-white/30 transition"
                >
                  {formatYearMonth(selectedPeriod)}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {periodOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#2c2c40] border border-white/[0.16] rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                    <div className="p-2">
                      {periodOptions.months.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSelectedPeriod(opt.value); setPeriodOpen(false); }}
                          className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${
                            selectedPeriod === opt.value ? "bg-[#cea165]/20 text-[#cea165]" : "text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                      <div className="text-xs text-[#cea165] font-semibold px-3 pt-3 pb-1">TRIMESTRES</div>
                      {periodOptions.quarters.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSelectedPeriod(opt.value); setPeriodOpen(false); }}
                          className="w-full text-left text-sm px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5 transition"
                        >
                          {opt.label}
                        </button>
                      ))}
                      <div className="text-xs text-[#cea165] font-semibold px-3 pt-3 pb-1">SEMESTRES</div>
                      {periodOptions.semesters.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSelectedPeriod(opt.value); setPeriodOpen(false); }}
                          className="w-full text-left text-sm px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5 transition"
                        >
                          {opt.label}
                        </button>
                      ))}
                      <div className="text-xs text-[#cea165] font-semibold px-3 pt-3 pb-1">ANO</div>
                      {periodOptions.annual.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSelectedPeriod(opt.value); setPeriodOpen(false); }}
                          className="w-full text-left text-sm px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5 transition"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Client selector */}
              {isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => { setClientOpen(!clientOpen); setPeriodOpen(false); }}
                    className="flex items-center gap-1 text-xs text-gray-300 border border-white/[0.16] rounded-full px-3 py-1.5 hover:border-white/30 transition"
                  >
                    {selectedClient === "all" ? "Todos os Clientes" : (selectedClientData?.nome_empresa ?? "").slice(0, 30)}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {clientOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-[#2c2c40] border border-white/[0.16] rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <button
                          onClick={() => { setSelectedClient("all"); setClientOpen(false); }}
                          className={`w-full text-left text-sm px-3 py-2 rounded-lg transition flex items-center justify-between ${
                            selectedClient === "all" ? "bg-[#cea165]/20 text-[#cea165]" : "text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          Todos os Clientes
                          {selectedClient === "all" && <span className="text-[#cea165]">✓</span>}
                        </button>
                        {clients.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => { setSelectedClient(c.id); setClientOpen(false); }}
                            className={`w-full text-left text-sm px-3 py-2 rounded-lg transition flex items-center justify-between ${
                              selectedClient === c.id ? "bg-[#cea165]/20 text-[#cea165]" : "text-gray-300 hover:bg-white/5"
                            }`}
                          >
                            {c.nome_empresa}
                            {selectedClient === c.id && <span className="text-[#cea165]">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-[1400px] mx-auto px-6 py-3">
          {children}
        </main>
      </div>
    </AppContext.Provider>
  );
}
