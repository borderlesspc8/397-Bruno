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

// Definição das seções do menu
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