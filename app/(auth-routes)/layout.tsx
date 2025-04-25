import { redirect } from "next/navigation";
import { getAuthSession } from "@/app/_lib/auth";
import AuthLayoutClient from "./layout-client";

// Componente do lado do servidor para verificação de autenticação
export default async function AuthRoutesLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAuthSession();

  if (!user) {
    redirect("/auth");
  }

  // Menu simplificado apenas com Dashboard para o primeiro lançamento
  const menuItems = [
    {
      href: "/dashboard",
      title: "Visão Geral",
      icon: "dashboard",
    },
    {
      href: "/dashboard/vendas",
      title: "Vendas",
      icon: "chart",
    },
    {
      href: "/dashboard/vendedores",
      title: "Vendedores",
      icon: "users",
    },
    {
      href: "/dashboard/consultores",
      title: "Consultores",
      icon: "user",
    },
    {
      href: "/dashboard/atendimentos",
      title: "Atendimentos",
      icon: "headset",
    }
  ];

  return <AuthLayoutClient menuItems={menuItems}>{children}</AuthLayoutClient>;
} 