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
        <NavbarContainer />
      </header>
      
      {/* Menu de navegação horizontal - sticky */}
      <div className={cn(
        "border-b bg-background/90 backdrop-blur sticky top-0 z-30 flex-shrink-0 transition-all duration-200",
        scrolled && "shadow-sm"
      )}>
        <div className="container max-w-screen-2xl mx-auto">
          {/* Botão do menu móvel */}
          <div className="flex items-center justify-between py-2 lg:hidden px-4 border-b">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
                className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <h1 className="text-sm font-medium">Menu</h1>
            </div>
            
            {/* Botões de ações rápidas para mobile */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-muted-foreground">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-muted-foreground">
                <Bell className="h-4 w-4" />
              </Button>
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
            </div>
          </div>
          
          {/* Menu desktop */}
          <div className="hidden lg:block">
            <HorizontalNav />
          </div>
          
          {/* Menu móvel com animação */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div 
                className="lg:hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-background border-b">
                  <HorizontalNav />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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