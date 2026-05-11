"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import type { FinancialEntry } from "@/types/database";
import Link from "next/link";
import Image from "next/image";
import type { Profile, Client } from "@/types/database";
import { getCurrentYearMonth, getGroupedPeriodOptions, formatYearMonth } from "@/lib/constants";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Receipt,
  ChevronDown,
  LogOut,
  Shield,
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
  const [userOpen, setUserOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const isAdmin = profile?.role === "admin" || profile?.role === "gestor";

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/profile");
      if (!res.ok) { router.replace("/login"); return; }
      const { data: p } = await res.json();
      if (!p) { router.replace("/login"); return; }
      if (!p.onboarding_complete) { router.replace("/onboarding"); return; }
      setProfile(p);

      if (p.role === "admin" || p.role === "gestor") {
        const clientsRes = await fetch("/api/clients");
        if (clientsRes.ok) {
          const { data: c } = await clientsRes.json();
          setClients(c ?? []);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    function handleClick() {
      setPeriodOpen(false);
      setClientOpen(false);
      setUserOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  const year = new Date().getFullYear();
  const periodOptions = getGroupedPeriodOptions(year);

  const navItems = isAdmin ? [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "DRE Tradicional", href: "/admin/dre", icon: FileSpreadsheet },
    { label: "Lançamentos", href: "/admin/entries", icon: Receipt },
  ] : [
    { label: "Dashboard", href: "/client", icon: LayoutDashboard },
    { label: "DRE", href: "/client/dre", icon: FileSpreadsheet },
  ];

  const selectedClientData = clients.find((c) => c.id === selectedClient);

  return (
    <AppContext.Provider value={{ profile, selectedPeriod, setSelectedPeriod, selectedClient, setSelectedClient, clients }}>
      <div className="min-h-screen bg-background">
        {/* Mobile: Sair + Contrato no topo direito */}
        <div className="flex md:hidden justify-end items-center gap-2 px-4 pt-3">
          {profile.role === "cliente" && (
            <button
              onClick={async () => {
                const res = await fetch("/api/contract");
                if (res.ok) {
                  const { url } = await res.json();
                  window.open(url, "_blank");
                } else {
                  alert("Nenhum contrato disponível.");
                }
              }}
              className="text-[10px] text-muted-foreground border border-border/60 rounded-full px-3 py-1 hover:bg-card hover:text-foreground transition-colors"
            >
              Contrato
            </button>
          )}
          <a
            href="/api/auth/logout"
            className="text-[10px] text-muted-foreground border border-border/60 rounded-full px-3 py-1 flex items-center gap-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sair
          </a>
        </div>

        {/* Logo + botões desktop */}
        <div className="px-4 md:px-14 flex flex-col md:flex-row items-center justify-between">
          <Image
            src="/logo-frame.png"
            alt="FRAME"
            width={300}
            height={108}
            className="object-contain shrink-0 md:-mt-8 md:-mb-12 md:-ml-[4.5rem] w-[250px] md:w-[300px]"
            priority
          />
          <div className="hidden md:flex items-center gap-3">
            {profile.role === "cliente" && (
              <button
                onClick={async () => {
                  const res = await fetch("/api/contract");
                  if (res.ok) {
                    const { url } = await res.json();
                    window.open(url, "_blank");
                  } else {
                    alert("Nenhum contrato disponível.");
                  }
                }}
                className="text-[13px] text-muted-foreground border border-border rounded-lg px-5 py-2 hover:bg-card hover:text-foreground transition-colors"
              >
                Contrato
              </button>
            )}
            <a
              href="/api/auth/logout"
              className="text-[13px] text-muted-foreground border border-border rounded-lg px-5 py-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </a>
          </div>
        </div>

        {/* Nav strip */}
        <div className="flex items-center justify-center md:justify-end gap-2 px-4 md:px-14 pb-3 flex-wrap">
          <span className="text-muted-foreground/70 text-[13px] mr-2 hidden lg:inline border border-border/50 rounded-full px-4 py-2">FRAME – Contabilidade para Advogados</span>

          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 text-[12px] md:text-[13px] font-medium rounded-full px-3 md:px-4 py-1.5 md:py-2 border transition-all duration-200 ${
                  active
                    ? "bg-card border-border text-foreground"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}

          {/* Period */}
          <div className="relative" onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setPeriodOpen(!periodOpen); setClientOpen(false); setUserOpen(false); }}
              className="flex items-center gap-1.5 text-[12px] md:text-[13px] text-muted-foreground hover:text-foreground rounded-full px-3 md:px-4 py-1.5 md:py-2 border border-border/50 hover:bg-card/50 transition-all duration-200"
            >
              {formatYearMonth(selectedPeriod)}
              <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform duration-200 ${periodOpen ? "rotate-180" : ""}`} />
            </button>
            {periodOpen && (
              <div className="absolute right-0 md:right-0 left-0 md:left-auto top-full mt-2 w-56 bg-popover border border-border/50 rounded-xl shadow-2xl z-[60] max-h-80 overflow-y-auto">
                <div className="p-1.5">
                  {periodOptions.months.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSelectedPeriod(opt.value); setPeriodOpen(false); }}
                      className={`w-full text-left text-[13px] px-3 py-1.5 rounded-lg transition-colors ${
                        selectedPeriod === opt.value ? "bg-primary/10 text-primary font-medium" : "text-popover-foreground/60 hover:bg-secondary hover:text-popover-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <div className="text-[10px] text-primary/30 font-semibold px-3 pt-3 pb-1 tracking-[0.2em]">TRIMESTRES</div>
                  {periodOptions.quarters.map((opt) => (
                    <button key={opt.value} onClick={() => { setSelectedPeriod(opt.value); setPeriodOpen(false); }} className="w-full text-left text-[13px] px-3 py-1.5 rounded-lg text-popover-foreground/60 hover:bg-secondary hover:text-popover-foreground transition-colors">{opt.label}</button>
                  ))}
                  <div className="text-[10px] text-primary/30 font-semibold px-3 pt-3 pb-1 tracking-[0.2em]">SEMESTRES</div>
                  {periodOptions.semesters.map((opt) => (
                    <button key={opt.value} onClick={() => { setSelectedPeriod(opt.value); setPeriodOpen(false); }} className="w-full text-left text-[13px] px-3 py-1.5 rounded-lg text-popover-foreground/60 hover:bg-secondary hover:text-popover-foreground transition-colors">{opt.label}</button>
                  ))}
                  <div className="text-[10px] text-primary/30 font-semibold px-3 pt-3 pb-1 tracking-[0.2em]">ANO</div>
                  {periodOptions.annual.map((opt) => (
                    <button key={opt.value} onClick={() => { setSelectedPeriod(opt.value); setPeriodOpen(false); }} className="w-full text-left text-[13px] px-3 py-1.5 rounded-lg text-popover-foreground/60 hover:bg-secondary hover:text-popover-foreground transition-colors">{opt.label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin badge */}
          {profile.role === "admin" && (
            <Link
              href="/admin/panel"
              className={`flex items-center gap-1.5 text-[12px] md:text-[13px] font-medium rounded-full px-3 md:px-4 py-1.5 md:py-2 border transition-all duration-200 ${
                pathname === "/admin/panel"
                  ? "bg-card border-border text-foreground"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* Client selector */}
          {isAdmin && (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { setClientOpen(!clientOpen); setPeriodOpen(false); setUserOpen(false); }}
                className="flex items-center gap-1.5 text-[12px] md:text-[13px] text-muted-foreground hover:text-foreground rounded-full px-3 md:px-4 py-1.5 md:py-2 border border-border/50 hover:bg-card/50 transition-all duration-200"
              >
                <span className="truncate max-w-[100px] md:max-w-none">{selectedClient === "all" ? "Todos os Clientes" : (selectedClientData?.nome_empresa ?? "").slice(0, 20)}</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform duration-200 ${clientOpen ? "rotate-180" : ""}`} />
              </button>
              {clientOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border/50 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                  <div className="p-1.5">
                    <button
                      onClick={() => { setSelectedClient("all"); setClientOpen(false); }}
                      className={`w-full text-left text-[13px] px-3 py-2 rounded-lg transition-colors ${
                        selectedClient === "all" ? "bg-primary/10 text-primary font-medium" : "text-popover-foreground/60 hover:bg-secondary hover:text-popover-foreground"
                      }`}
                    >
                      Todos os Clientes
                    </button>
                    {clients.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedClient(c.id); setClientOpen(false); }}
                        className={`w-full text-left text-[13px] px-3 py-2 rounded-lg transition-colors ${
                          selectedClient === c.id ? "bg-primary/10 text-primary font-medium" : "text-popover-foreground/60 hover:bg-secondary hover:text-popover-foreground"
                        }`}
                      >
                        {c.nome_empresa}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Content */}
        <main className="px-4 md:px-14 pb-4">
          {children}
        </main>
      </div>
    </AppContext.Provider>
  );
}
