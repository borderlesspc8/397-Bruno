"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { UserButton } from "@/app/_components/user-button/UserButton";
import { 
  Star, 
  ChevronDown,
  LayoutDashboard, 
  ChartPie, 
  Users,
  Target,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { SubscriptionPlan } from "@/app/types";
import { usePathname } from "next/navigation";
import { cn } from "@/app/_lib/utils";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function FreeNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const userPlan = session?.user?.subscriptionPlan as SubscriptionPlan || SubscriptionPlan.FREE;
  const isBasicPlan = userPlan === SubscriptionPlan.BASIC;
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Detectar cliques fora do menu para fechá-lo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const isDashboardActive = pathname?.includes('/dashboard');
  const isVendasActive = pathname?.includes('/dashboard/vendas');
  const isVendedoresActive = pathname?.includes('/dashboard/vendedores');
  const isMetasActive = pathname?.includes('/dashboard/metas');
  
  const MenuLinks = () => (
    <>
      <Link 
        href="/dashboard/vendas" 
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground",
          isVendasActive && "bg-secondary/50 font-medium"
        )}
        onClick={() => {
          setMenuOpen(false);
          setMobileMenuOpen(false);
        }}
      >
        <ChartPie className="h-4 w-4" />
        <span>Vendas</span>
      </Link>
      <Link 
        href="/dashboard/vendedores" 
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground",
          isVendedoresActive && "bg-secondary/50 font-medium"
        )}
        onClick={() => {
          setMenuOpen(false);
          setMobileMenuOpen(false);
        }}
      >
        <Users className="h-4 w-4" />
        <span>Vendedores</span>
      </Link>
      <Link 
        href="/dashboard/metas" 
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground",
          isMetasActive && "bg-secondary/50 font-medium"
        )}
        onClick={() => {
          setMenuOpen(false);
          setMobileMenuOpen(false);
        }}
      >
        <Target className="h-4 w-4" />
        <span>Metas</span>
      </Link>
    </>
  );
  
  return (
    <div className="free-navbar-container">
      <div className="w-full h-16 px-4 border-b bg-background/95 backdrop-blur-sm flex items-center justify-between">
        {/* Menu hamburger mobile */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          
          {/* Logo */}
          <Link href="/dashboard/vendas" className="flex items-center gap-2">
            <Image 
              src="/logo_branca.svg" 
              alt="Dashboard Gerencial"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-xl font-semibold hidden sm:inline-flex">
              Painel de Indicadores | Personal Prime
            </span>
          </Link>
          
          {/* Menu Dashboards para desktop */}
          <div className="relative hidden md:block">
            <Button 
              ref={buttonRef}
              variant={isDashboardActive ? "secondary" : "ghost"} 
              className="flex items-center gap-1.5"
              size="sm"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <LayoutDashboard className="h-4 w-4 mr-1" />
              Dashboards
              <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
            </Button>
            
            {menuOpen && (
              <div 
                ref={menuRef}
                className="absolute top-full left-0 mt-1 w-56 rounded-md border bg-popover p-1 shadow-md z-[999]"
                style={{
                  animation: "fadeIn 0.2s ease-out",
                }}
              >
                <MenuLinks />
              </div>
            )}
          </div>
        </div>

        {/* Botão de usuário à direita */}
        <div className="flex items-center">
          <UserButton />
        </div>
      </div>
      
      {/* Menu mobile - aparece abaixo da navbar quando ativado */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b bg-background/90"
          >
            <div className="p-3 space-y-1">
              <MenuLinks />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Adiciona estilo de animação */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default FreeNavbar; 