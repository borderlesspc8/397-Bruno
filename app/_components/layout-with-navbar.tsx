"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Menu, X, Search, Bell, Moon, Sun, Laptop } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { useTheme } from "next-themes";
import NavbarContainer from "./navbar/NavbarContainer";
import { HorizontalNav } from "./horizontal-nav";
import FreeNavbar from "./free-navbar";
import { cn } from "@/app/_lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SubscriptionPlan } from "@/app/types";

interface LayoutWithNavbarProps {
  children: React.ReactNode;
}

export function LayoutWithNavbar({ children }: LayoutWithNavbarProps) {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();

  // Detectar rolagem para aplicar efeitos visuais na navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Se não estiver autenticado, não mostrar o layout
  if (status !== "authenticated" || !session) {
    return children;
  }

  // Determinar o plano do usuário para controle de acesso a funcionalidades
  const userPlan = session?.user?.subscriptionPlan || 'FREE';
  
  // Verificar se o usuário é admin
  const isAdmin = session.user?.email === "mvcas95@gmail.com";
  
  // Forçar exibição do layout premium para admin ou usuários premium/enterprise
  const isPremiumUser = userPlan === SubscriptionPlan.PREMIUM || 
                       userPlan === SubscriptionPlan.ENTERPRISE || 
                       isAdmin;
  
  // Verificação forçada para garantir que usuários Enterprise vejam o menu completo
  if (isAdmin) {
    console.log("Admin detectado - forçando layout premium");
  }

  // Renderizar layout baseado no plano do usuário
  if (!isPremiumUser) {
    return (
      <div className="app-layout-with-navbar">
        {/* Navbar simples para usuários grátis e básicos */}
        <FreeNavbar />
        
        {/* Conteúdo da página - rolável */}
        <main className="flex-grow overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  // Layout para usuários premium
  return (
    <div className="app-layout-with-navbar">
      {/* Navbar principal do sistema - fixo no topo */}
      <header className={cn(
        "flex-shrink-0 border-b z-40 bg-background/95 backdrop-blur transition-all duration-200",
        scrolled && "shadow-sm"
      )}>
        <div className="container max-w-screen-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Lado esquerdo com logotipo e botão de menu mobile */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden h-9 w-9 rounded-md text-muted-foreground hover:text-foreground"
                aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              
              {/* Componente completo apenas para desktop */}
              <div className="hidden lg:block w-full">
                <NavbarContainer />
              </div>
              
              {/* Versão simplificada para mobile */}
              <div className="lg:hidden">
                <h1 className="text-lg font-semibold">Dashboard</h1>
              </div>
            </div>
            
            {/* Botões rápidos para mobile */}
            <div className="flex items-center gap-2 lg:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-md text-muted-foreground"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Laptop className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-muted-foreground">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Menu móvel com animação */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="lg:hidden border-b bg-background z-30"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container max-w-screen-2xl mx-auto px-4 py-2">
              <HorizontalNav />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Menu desktop */}
      <div className="hidden lg:block border-b bg-background/90 backdrop-blur">
        <div className="container max-w-screen-2xl mx-auto">
          <HorizontalNav />
        </div>
      </div>

      {/* Conteúdo da página - rolável */}
      <main className="flex-grow overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default LayoutWithNavbar; 