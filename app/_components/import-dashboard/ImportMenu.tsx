"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, CalendarClock, BarChart3 } from "lucide-react";
import { cn } from "@/app/_lib/utils";

interface ImportMenuItemProps {
  href: string;
  title: string;
  icon: React.ReactNode;
}

const ImportMenuItem = ({ href, title, icon }: ImportMenuItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center px-4 py-2 text-sm rounded-md transition-colors",
        isActive 
          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
          : "hover:bg-muted"
      )}
    >
      {icon}
      <span className="ml-2">{title}</span>
    </Link>
  );
};

export default function ImportMenu() {
  return (
    <div className="bg-card border rounded-lg p-4 mb-6 shadow-sm">
      <h3 className="text-lg font-medium mb-3">Integração Gestão Click</h3>
      <div className="space-y-1">
        <ImportMenuItem 
          href="/wallets/import-dashboard" 
          title="Dashboard de Importações" 
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <ImportMenuItem 
          href="/wallets/import-scheduler" 
          title="Agendamentos" 
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <ImportMenuItem 
          href="/wallets/import" 
          title="Nova Importação" 
          icon={<Database className="h-4 w-4" />}
        />
      </div>
    </div>
  );
} 