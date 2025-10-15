import React from 'react';
import { useRouter } from 'next/router';
import { Building2, Target, PiggyBank, BarChart3, Settings } from 'lucide-react';

interface SidebarNavProps {
  // ... existing props ...
}

export default function SidebarNav({
  // ... existing params ...
}: SidebarNavProps) {
  // ... existing code ...

  const router = useRouter();
  const pathname = router.pathname;

  const routes = [
    {
      href: "/goals",
      label: "Objetivos",
      icon: Target,
    },
    {
      href: "/budgets",
      label: "Orçamentos",
      icon: PiggyBank,
    },
    {
      href: "/reports",
      label: "Relatórios",
      icon: BarChart3,
    },
    {
      href: "/settings",
      label: "Configurações",
      icon: Settings,
    },
  ];

  // ... rest of the code ...
} 
