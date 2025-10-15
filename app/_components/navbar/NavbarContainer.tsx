"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { Skeleton } from "../ui/skeleton";

// Componentes modulares da navbar
import { BrandLogo } from "./BrandLogo";
import { SearchBar } from "./SearchBar";
import { NotificationCenter } from "./NotificationCenter";
import { ThemeSelector } from "./ThemeSelector";
import { UserButton } from "../user-button/UserButton";
import { SessionRefreshButton } from "../SessionRefreshButton";

const NavbarContainer = () => {
  const { status } = useSession();

  // Loading state
  if (status === "loading") {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <nav className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <Skeleton className="h-9 w-[250px]" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-24" />
          </div>
        </nav>
      </header>
    );
  }

  // Proteção para usuário não autenticado
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <header className="w-full h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="flex h-full items-center justify-between px-4">
        {/* Logo e Menu */}
        <BrandLogo />

        {/* Barra de Pesquisa */}
        <SearchBar />

        {/* Lado Direito - Ações e Usuário */}
        <div className="flex items-center gap-2">
          {/* Botão atualizar sessão */}
          <SessionRefreshButton />
          
          {/* Seletor de tema */}
          <ThemeSelector />
          
          {/* Notificações */}
          <NotificationCenter />
          
          {/* Botão Nova Transação */}
            
          {/* Menu do usuário */}
          <UserButton />
        </div>
      </nav>
    </header>
  );
};

NavbarContainer.displayName = "NavbarContainer";

export default NavbarContainer; 
