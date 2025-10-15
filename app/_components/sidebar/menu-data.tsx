"use client";

import { 
  LayoutDashboard, 
  Target, 
  PiggyBank,
  LineChart, 
  FileSpreadsheet,
  DownloadCloud,
  BrainCircuit,
  School,
  Users,
  BarChart,
  Settings,
  Lock,
  Star,
  Sparkles,
  CreditCard,
  BarChart4,
  PieChart,
  HelpCircle,
  BarChart2,
  FileText,
  Store,
  ShoppingBag,
  MessageCircle,
  TrendingUp,
  Trophy,
  Goal,
  ChartPie,
  MessageSquare,
  BarChart as BarChartIcon,
  UserCircle
} from "lucide-react";
import { MenuSection } from "./types";
import { useUserPermissions } from "@/app/_hooks/useUserPermissions";

// Função para obter as seções do menu baseadas nas permissões do usuário
export function getMenuSections(): MenuSection[] {
  const permissions = useUserPermissions();
  
  const sections: MenuSection[] = [];

  // Seção Visão Geral - redireciona para dashboard apropriado baseado no usuário
  sections.push({
    title: "Visão Geral",
    items: [
      {
        label: "Dashboard",
        href: permissions.isVendor ? "/dashboard-vendedores" : "/dashboard/vendas",
        icon: LayoutDashboard,
        description: permissions.isVendor ? "Análise de desempenho e métricas" : "Visão geral das suas finanças",
      },
    ],
  });

  // Seção Análises - apenas para usuários não-vendedores
  if (!permissions.isVendor) {
    sections.push({
      title: "Análises",
      items: [
        ...(permissions.canAccessReports ? [{
          label: "Relatórios",
          href: "/reports",
          icon: BarChart4,
          description: "Relatórios financeiros detalhados",
        }] : []),
        ...(permissions.canAccessCategories ? [{
          label: "Categorias",
          href: "/categories",
          icon: PieChart,
          description: "Análise de gastos por categoria",
        }] : []),
        ...(permissions.canAccessAI ? [{
          label: "Análise de IA",
          href: "/ai-insights",
          icon: BrainCircuit,
          description: "Insights gerados por IA",
        }] : []),
      ].filter(Boolean),
    });
  }

  // Seção Dashboards Comerciais - com restrições para vendedores
  const dashboardsComerciais = [
    ...(permissions.canAccessVendas ? [{
      label: "Vendas",
      href: "/dashboard/vendas",
      icon: ChartPie,
      description: "Dados de vendas e faturamento",
    }] : []),
    ...(permissions.canAccessVendedores && !permissions.isVendor ? [{
      label: "Vendedores",
      href: "/dashboard/vendedores",
      icon: Users,
      description: "Gerenciamento de fotos e dados dos vendedores",
    }] : []),
    // Dashboard de análise de vendedores - acessível para vendedores
    ...(permissions.isVendor ? [{
      label: "Dashboard Vendedores",
      href: "/dashboard-vendedores",
      icon: BarChart2,
      description: "Análise de desempenho e métricas de vendedores",
    }] : []),
    ...(permissions.canAccessConsultores ? [{
      label: "Consultores",
      href: "/dashboard/consultores",
      icon: UserCircle,
      description: "Performance e métricas dos consultores",
    }] : []),
    ...(permissions.canAccessAtendimentos ? [{
      label: "Atendimentos",
      href: "/dashboard/atendimentos",
      icon: MessageSquare,
      description: "Métricas de atendimento e CRM",
    }] : []),
    ...(permissions.canAccessConversao ? [{
      label: "Conversão",
      href: "/dashboard/conversao",
      icon: BarChartIcon,
      description: "Taxas de conversão e follow-up",
    }] : []),
    ...(permissions.canAccessMetas ? [{
      label: "Metas",
      href: "/dashboard/metas",
      icon: Target,
      description: "Acompanhamento de metas comerciais",
    }] : []),
    ...(permissions.canAccessPerformance ? [{
      label: "Performance",
      href: "/dashboard/performance",
      icon: TrendingUp,
      description: "Ranking e bonificação da equipe",
    }] : []),
  ].filter(Boolean);

  if (dashboardsComerciais.length > 0) {
    sections.push({
      title: "Dashboards Comerciais",
      items: dashboardsComerciais,
    });
  }

  // Seção Ferramentas - apenas para usuários não-vendedores
  if (!permissions.isVendor) {
    const ferramentas = [
      ...(permissions.canAccessGoals ? [{
        label: "Metas",
        href: "/goals",
        icon: Target,
        description: "Definir e acompanhar metas financeiras",
      }] : []),
      ...(permissions.canAccessBudgets ? [{
        label: "Orçamentos",
        href: "/budgets",
        icon: PiggyBank,
        description: "Gerenciar orçamentos e controlar gastos",
      }] : []),
      ...(permissions.canAccessCashFlow ? [{
        label: "Fluxo de Caixa",
        href: "/cash-flow",
        icon: BarChart2,
        description: "Visualizar e gerenciar fluxo de caixa futuro",
      }] : []),
      ...(permissions.canAccessGestaoClick ? [{
        label: "Gestão Click",
        href: "/gestao-click",
        icon: Store,
        description: "Integração com ERP Gestão Click",
      }] : []),
      ...(permissions.canAccessBudgets ? [{
        label: "Planejamento",
        href: "/budget",
        icon: BarChart,
        description: "Orçamentos mensais e anuais",
      }] : []),
      ...(permissions.canAccessExport ? [{
        label: "Exportar Dados",
        href: "/export",
        icon: FileText,
        description: "Exportar relatórios e dados",
      }] : []),
      ...(permissions.canAccessIntegrations ? [{
        label: "Integrações",
        href: "/integrations",
        icon: CreditCard,
        description: "Conectar a bancos e serviços",
      }] : []),
    ].filter(Boolean);

    if (ferramentas.length > 0) {
      sections.push({
        title: "Ferramentas",
        items: ferramentas,
      });
    }
  }

  // Seção Configurações - apenas para usuários não-vendedores
  if (!permissions.isVendor) {
    const configuracoes = [
      ...(permissions.canAccessSettings ? [{
        label: "Preferências",
        href: "/settings",
        icon: Settings,
        description: "Personalizar sua experiência",
      }] : []),
      ...(permissions.canAccessHelp ? [{
        label: "Ajuda",
        href: "/help",
        icon: HelpCircle,
        description: "Suporte e documentação",
      }] : []),
    ].filter(Boolean);

    if (configuracoes.length > 0) {
      sections.push({
        title: "Configurações",
        items: configuracoes,
      });
    }
  }

  return sections;
}

// Definição das seções do menu (versão original para compatibilidade)
export const MENU_SECTIONS: MenuSection[] = [
  {
    title: "Visão Geral",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard/vendas",
        icon: LayoutDashboard,
        description: "Visão geral das suas finanças",
      },
    ],
  },
  {
    title: "Análises",
    items: [
      {
        label: "Relatórios",
        href: "/reports",
        icon: BarChart4,
        description: "Relatórios financeiros detalhados",
      },
      {
        label: "Categorias",
        href: "/categories",
        icon: PieChart,
        description: "Análise de gastos por categoria",
      },
      {
        label: "Análise de IA",
        href: "/ai-insights",
        icon: BrainCircuit,
        description: "Insights gerados por IA",
      },
    ],
  },
  {
    title: "Dashboards Comerciais",
    items: [
      {
        label: "Vendas",
        href: "/dashboard/vendas",
        icon: ChartPie,
        description: "Dados de vendas e faturamento",
      },
      {
        label: "Vendedores",
        href: "/dashboard/vendedores",
        icon: Users,
        description: "Gerenciamento de fotos e dados dos vendedores",
      },
      {
        label: "Consultores",
        href: "/dashboard/consultores",
        icon: UserCircle,
        description: "Performance e métricas dos consultores",
      },
      {
        label: "Atendimentos",
        href: "/dashboard/atendimentos",
        icon: MessageSquare,
        description: "Métricas de atendimento e CRM",
      },
      {
        label: "Conversão",
        href: "/dashboard/conversao",
        icon: BarChartIcon,
        description: "Taxas de conversão e follow-up",
      },
      {
        label: "Metas",
        href: "/dashboard/metas",
        icon: Target,
        description: "Acompanhamento de metas comerciais",
      },
      {
        label: "Performance",
        href: "/dashboard/performance",
        icon: TrendingUp,
        description: "Ranking e bonificação da equipe",
      },
    ],
  },
  {
    title: "Ferramentas",
    items: [
      {
        label: "Metas",
        href: "/goals",
        icon: Target,
        description: "Definir e acompanhar metas financeiras",
      },
      {
        label: "Orçamentos",
        href: "/budgets",
        icon: PiggyBank,
        description: "Gerenciar orçamentos e controlar gastos",
      },
      {
        label: "Fluxo de Caixa",
        href: "/cash-flow",
        icon: BarChart2,
        description: "Visualizar e gerenciar fluxo de caixa futuro",
      },
      {
        label: "Gestão Click",
        href: "/gestao-click",
        icon: Store,
        description: "Integração com ERP Gestão Click",
      },
      {
        label: "Planejamento",
        href: "/budget",
        icon: BarChart,
        description: "Orçamentos mensais e anuais",
      },
      {
        label: "Exportar Dados",
        href: "/export",
        icon: FileText,
        description: "Exportar relatórios e dados",
      },
      {
        label: "Integrações",
        href: "/integrations",
        icon: CreditCard,
        description: "Conectar a bancos e serviços",
      },
    ],
  },
  {
    title: "Configurações",
    items: [
      {
        label: "Preferências",
        href: "/settings",
        icon: Settings,
        description: "Personalizar sua experiência",
      },
      {
        label: "Ajuda",
        href: "/help",
        icon: HelpCircle,
        description: "Suporte e documentação",
      },
    ],
  }
]; 
