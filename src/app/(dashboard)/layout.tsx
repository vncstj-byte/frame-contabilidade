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

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, visible: true },
    { label: "DRE Tradicional", href: "/admin/dre", icon: FileSpreadsheet, visible: true },
    { label: "Lançamentos", href: "/admin/entries", icon: Receipt, visible: isAdmin },
  ];

  const selectedClientData = clients.find((c) => c.id === selectedClient);

  return (
    <AppContext.Provider value={{ profile, selectedPeriod, setSelectedPeriod, selectedClient, setSelectedClient, clients }}>
      <div className="min-h-screen bg-background">
        {/* Top: Logo + Contrato */}
        <div className="px-14 flex items-center justify-between">
          <Image
            src="/logo-frame.png"
            alt="FRAME"
            width={300}
            height={108}
            className="object-contain shrink-0 -mt-8 -mb-12 -ml-[4.5rem]"
            priority
          />
          <div className="flex items-center gap-3">
            <button className="text-[13px] text-muted-foreground border border-border rounded-lg px-5 py-2 hover:bg-card hover:text-foreground transition-colors">
              Contrato
            </button>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { setUserOpen(!userOpen); setPeriodOpen(false); setClientOpen(false); }}
                className="text-[13px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border/50 rounded-xl shadow-2xl z-50">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-border/50 mb-1">
                      <p className="text-[13px] text-foreground font-medium truncate">{profile.full_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{profile.email}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        router.replace("/login");
                      }}
                      className="w-full flex items-center gap-2 text-[13px] text-destructive px-3 py-2 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nav strip centered */}
        <div className="flex items-center justify-end gap-2 px-14 pb-3 flex-wrap">
          <span className="text-muted-foreground/70 text-[13px] mr-2 hidden lg:inline border border-border/50 rounded-full px-4 py-2">FRAME – Contabilidade para Advogados</span>

          {navItems.filter((n) => n.visible).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 text-[13px] font-medium rounded-full px-4 py-2 border transition-all duration-200 ${
                  active
                    ? "bg-card border-border text-foreground"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}

          {/* Period */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setPeriodOpen(!periodOpen); setClientOpen(false); setUserOpen(false); }}
              className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground rounded-full px-4 py-2 border border-border/50 hover:bg-card/50 transition-all duration-200"
            >
              {formatYearMonth(selectedPeriod)}
              <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform duration-200 ${periodOpen ? "rotate-180" : ""}`} />
            </button>
            {periodOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border/50 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
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
              className={`flex items-center gap-1.5 text-[13px] font-medium rounded-full px-4 py-2 border transition-all duration-200 ${
                pathname === "/admin/panel"
                  ? "bg-card border-border text-foreground"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}

          {/* Client selector */}
          {isAdmin && (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { setClientOpen(!clientOpen); setPeriodOpen(false); setUserOpen(false); }}
                className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground rounded-full px-4 py-2 border border-border/50 hover:bg-card/50 transition-all duration-200"
              >
                {selectedClient === "all" ? "Todos os Clientes" : (selectedClientData?.nome_empresa ?? "").slice(0, 20)}
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

        {/* Content - full width */}
        <main className="px-14 pb-4">
          {children}
        </main>
      </div>
    </AppContext.Provider>
  );
}
