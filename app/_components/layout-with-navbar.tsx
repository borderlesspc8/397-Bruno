"use client";

import React from "react";
import { useAuth } from "@/app/_hooks/useAuth";
import Navbar from "./navbar";

interface LayoutWithNavbarProps {
  children: React.ReactNode;
}

export function LayoutWithNavbar({ children }: LayoutWithNavbarProps) {
  const { user, loading } = useAuth();

  // Se não estiver autenticado, não mostrar o layout
  if (loading || !user) {
    return children;
  }

  // Layout padrão para todos os usuários
  return (
    <div className="app-layout-with-navbar">
      {/* Navbar padrão - com z-index alto */}
      <div className="relative z-50">
        <Navbar />
      </div>
      
      {/* Conteúdo da página - rolável com z-index menor */}
      <main className="flex-grow overflow-auto relative z-10">
        {children}
      </main>
    </div>
  );
}

export default LayoutWithNavbar; 
