"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/_lib/utils";
import { useSession } from "next-auth/react";
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  Target, 
  PiggyBank,
  LineChart, 
  BrainCircuit,
  Users,
  BarChart,
  Settings,
  Star,
  ChartPie,
  HelpCircle,
  Calendar,
  Banknote,
  BadgePercent,
  Shield,
} from "lucide-react";
import { SubscriptionPlan } from "@/app/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/_components/ui/tooltip";
import { Badge } from "@/app/_components/ui/badge";

// Interface para os itens de navegação
interface NavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  plan?: SubscriptionPlan;
  adminOnly?: boolean;
}

// Definição dos itens principais de navegação
const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/painel",
    icon: <LayoutDashboard className="h-4 w-4" />,
    plan: SubscriptionPlan.FREE,
  },
  {
    label: "Transações",
    href: "/transactions",
    icon: <Receipt className="h-4 w-4" />,
    plan: SubscriptionPlan.FREE,
  },
  {
    label: "Carteiras",
    href: "/wallets",
    icon: <Wallet className="h-4 w-4" />,
    plan: SubscriptionPlan.FREE,
  },
  {
    label: "Vendas",
    href: "/dashboard/vendas",
    icon: <ChartPie className="h-4 w-4" />,
    plan: SubscriptionPlan.FREE,
  },
  {
    label: "Vendedores",
    href: "/dashboard/vendedores",
    icon: <Users className="h-4 w-4" />,
    plan: SubscriptionPlan.FREE,
  },
  {
    label: "Atendimentos",
    href: "/dashboard/atendimentos",
    icon: <HelpCircle className="h-4 w-4" />,
    plan: SubscriptionPlan.FREE,
  },
  {
    label: "Conversão",
    href: "/dashboard/conversao",
    icon: <BadgePercent className="h-4 w-4" />,
    plan: SubscriptionPlan.FREE,
  },
  {
    label: "Metas",
    href: "/dashboard/metas",
    icon: <Target className="h-4 w-4" />,
    plan: SubscriptionPlan.FREE,
  },
  {
    label: "Relatórios",
    href: "/reports",
    icon: <BarChart className="h-4 w-4" />,
    plan: SubscriptionPlan.FREE,
  },
];

// Item de administração apenas para o administrador (mvcas95@gmail.com)
const adminItems: NavigationItem[] = [
  {
    label: "Gerenciar Assinaturas",
    href: "/gerenciar-assinaturas",
    icon: <Shield className="h-4 w-4" />,
    adminOnly: true,
  }
];

export function HorizontalNav() {
  const pathname = usePathname() || "";
  const { data: session } = useSession();
  const userPlan = session?.user?.subscriptionPlan as SubscriptionPlan || SubscriptionPlan.FREE;
  const isAdmin = session?.user?.email === "mvcas95@gmail.com";
  
  console.log("HorizontalNav - Plano atual do usuário:", userPlan);
  console.log("HorizontalNav - Session data:", JSON.stringify(session?.user || {}, null, 2));
  
  // Função para verificar se o plano do usuário permite acessar o item
  const isPlanAllowed = (requiredPlan?: SubscriptionPlan): boolean => {
    if (!requiredPlan) return true;
    
    const planHierarchy = {
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.BASIC]: 1,
      [SubscriptionPlan.PREMIUM]: 2,
      [SubscriptionPlan.ENTERPRISE]: 3
    };
    
    const userLevel = planHierarchy[userPlan] ?? 0;
    const requiredLevel = planHierarchy[requiredPlan] ?? 0;
    
    // Para o menu horizontal, permitir acesso para Premium e Enterprise
    if (userPlan === SubscriptionPlan.PREMIUM || userPlan === SubscriptionPlan.ENTERPRISE) {
      return true;
    }
    
    // Para outros planos, verificar a hierarquia
    return userLevel >= requiredLevel;
  };

  // Função para verificar se um item está ativo (considerando subrotas)
  const isItemActive = (href: string): boolean => {
    if (href === "/painel" && pathname === "/painel") return true;
    if (href !== "/painel" && pathname.startsWith(href)) return true;
    return false;
  };

  // Itens de navegação completos incluindo itens de admin se o usuário for administrador
  const allNavigationItems: NavigationItem[] = [
    ...navigationItems,
    ...(isAdmin ? adminItems : [])
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <nav className="flex px-4 py-1 space-x-1 overflow-x-auto hide-scrollbar">
        {userPlan === SubscriptionPlan.ENTERPRISE && (
          <div className="flex items-center mr-2 px-3 py-1.5 text-xs text-emerald-600 font-semibold rounded-md bg-emerald-50 border border-emerald-200">
            Acesso Enterprise
          </div>
        )}
        
        {allNavigationItems.map((item) => {
          const isActive = isItemActive(item.href);
          const isAllowed = item.adminOnly ? isAdmin : isPlanAllowed(item.plan);
          const navItemHref = isAllowed ? item.href : "/subscription";
          
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={navItemHref}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap relative",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    !isAllowed && "opacity-70",
                    item.adminOnly && isAdmin && !isActive && "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-500"
                  )}
                >
                  <span className="flex items-center">
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </span>
                  
                  {!isAllowed && !item.adminOnly && (
                    <Badge variant="outline" className="ml-1.5 text-xs px-1.5 py-0 h-5">
                      <Star className="h-3 w-3 mr-0.5 text-amber-500" />
                      <span className="text-[10px]">Upgrade</span>
                    </Badge>
                  )}
                  
                  {item.adminOnly && isAdmin && (
                    <Badge variant="outline" className="ml-1.5 text-xs px-1.5 py-0 h-5 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-500">
                      <span className="text-[10px]">Admin</span>
                    </Badge>
                  )}
                  
                  {isActive && (
                    <span className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                  )}
                </Link>
              </TooltipTrigger>
              
              {!isAllowed && !item.adminOnly && (
                <TooltipContent side="bottom" align="center" className="p-2.5">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Recurso Premium</p>
                    <p className="text-xs text-muted-foreground">
                      Faça upgrade para acessar este recurso
                    </p>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}

export default HorizontalNav; 