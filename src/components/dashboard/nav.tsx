"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserRole } from "@/types/database";

interface DashboardNavProps {
  userName: string;
  userEmail: string;
  userRole: UserRole;
}

export function DashboardNav({
  userName,
  userEmail,
  userRole,
}: DashboardNavProps) {
  const router = useRouter();
  const supabase = createClient();
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isAdmin = userRole === "admin" || userRole === "gestor";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href={isAdmin ? "/admin/dashboard" : "/client"}>
          <h1 className="text-xl font-bold text-gray-900">FRAME Finance</h1>
        </Link>
        {isAdmin && (
          <div className="flex gap-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/clients">
              <Button variant="ghost" size="sm">
                Clientes
              </Button>
            </Link>
            <Link href="/admin/entries">
              <Button variant="ghost" size="sm">
                Lançamentos
              </Button>
            </Link>
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" className="flex items-center gap-2" />}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{userName}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled className="text-xs text-gray-500">
            {userEmail}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
