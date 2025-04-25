"use client";

import { ProtectedLayout } from "@/app/_components/protected-layout";
import Navbar from "@/app/_components/navbar";
import { Sidebar } from "@/app/_components/sidebar";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import NotificationAlert from "@/app/_components/notifications/notification-alert";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/app/_lib/auth";
import { SidebarNav } from "@/app/_components/sidebar-nav";

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

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r bg-muted/40 lg:block">
          <SidebarNav items={menuItems} />
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
} 