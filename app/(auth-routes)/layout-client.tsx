"use client";

import { useState } from "react";
import { SidebarNav } from "@/app/_components/sidebar-nav";
import { Button } from "@/app/_components/ui/button";
import { Menu, X } from "lucide-react";

type AuthLayoutClientProps = {
  children: React.ReactNode;
  menuItems: {
    href: string;
    title: string;
    icon?: string;
  }[];
};

export default function AuthLayoutClient({ children, menuItems }: AuthLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Cabeçalho móvel */}
      <header className="lg:hidden border-b sticky top-0 z-40 bg-background p-4 flex items-center justify-between">
        <div className="font-bold">Conta Rápida</div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      <div className="flex flex-1">
        {/* Barra lateral para desktop */}
        <aside className="hidden w-64 shrink-0 border-r bg-muted/40 lg:block">
          <SidebarNav items={menuItems} />
        </aside>

        {/* Menu móvel */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
            <div className="bg-background/95 backdrop-blur-sm border-r h-full w-64">
              <div className="p-4 font-bold border-b">Conta Rápida</div>
              <SidebarNav items={menuItems} />
            </div>
            <div
              className="flex-1 bg-black/20"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
        )}

        {/* Conteúdo principal */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
} 