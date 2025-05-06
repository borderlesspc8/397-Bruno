"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/app/_lib/utils";
import { 
  Target, 
  BarChart4, 
  Users, 
  ChartPie,
  MessageSquare,
  UserCircle,
  BarChart
} from "lucide-react";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
}

const NavItem = ({ href, label, icon, isActive }: NavItemProps) => (
  <Link
    href={href}
    className={cn(
      "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
      isActive 
        ? "bg-primary text-primary-foreground" 
        : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
    )}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export function DashboardHeader() {
  // Menu foi removido conforme solicitado
  return null;
} 