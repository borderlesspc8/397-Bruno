"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/_hooks/useAuth";
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
import { usePathname } from "next/navigation";
import { cn } from "@/app/_lib/utils";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Verificar tema atual
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

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
    
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);
  
  const isDashboardActive = pathname?.includes('/dashboard');
  const isVendasActive = pathname?.includes('/dashboard/vendas');
  const isVendedoresActive = pathname?.includes('/dashboard/vendedores');
  const isMetasActive = pathname?.includes('/dashboard/metas');
  
  const MenuLinks = () => (
    <>
      <Link 
        href="/dashboard/vendas" 
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-accent hover:text-accent-foreground transition-all duration-200 ios26-link",
          isVendasActive && "bg-secondary/50 font-medium"
        )}
        onClick={() => {
          setMenuOpen(false);
          setMobileMenuOpen(false);
        }}
      >
        <div className="p-1.5 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
          <ChartPie className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <span>Vendas</span>
      </Link>
      <Link 
        href="/dashboard/vendedores" 
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-accent hover:text-accent-foreground transition-all duration-200 ios26-link",
          isVendedoresActive && "bg-secondary/50 font-medium"
        )}
        onClick={() => {
          setMenuOpen(false);
          setMobileMenuOpen(false);
        }}
      >
        <div className="p-1.5 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
          <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        <span>Vendedores</span>
      </Link>
      <Link 
        href="/dashboard/metas" 
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-accent hover:text-accent-foreground transition-all duration-200 ios26-link",
          isMetasActive && "bg-secondary/50 font-medium"
        )}
        onClick={() => {
          setMenuOpen(false);
          setMobileMenuOpen(false);
        }}
      >
        <div className="p-1.5 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg">
          <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </div>
        <span>Metas</span>
      </Link>
    </>
  );
  
  return (
    <div className="free-navbar-container relative z-50">
      <div className="w-full h-16 px-4 border-b bg-background/95 backdrop-blur-sm flex items-center justify-between ios26-animate-fade-in relative z-50">
        {/* Menu hamburger mobile */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden flex items-center justify-center ios26-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          
          {/* Logo */}
          <Link href="/dashboard/vendas" className="flex items-center gap-2 ios26-link">
            <div className="p-2 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl">
              <Image 
                src="/logo_branca.svg" 
                alt="Dashboard Gerencial"
                width={32}
                height={32}
                className="h-8 w-8"
              />
            </div>
            <span className="text-xl font-semibold hidden sm:inline-flex text-foreground">
              Painel de Indicadores | Personal Prime
            </span>
          </Link>
          
          {/* Menu Dashboards para desktop */}
          <div className="relative hidden md:block">
            <Button 
              ref={buttonRef}
              variant={isDashboardActive ? "secondary" : "ghost"} 
              className="flex items-center gap-1.5 ios26-button"
              size="sm"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <LayoutDashboard className="h-4 w-4 mr-1" />
              Dashboards
              <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
            </Button>
            
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="navbar-dropdown-menu absolute top-full left-0 mt-2 w-56 rounded-2xl border bg-popover p-1 shadow-xl z-[100]"
                  style={{
                    backdropFilter: "blur(20px)",
                    background: isDark ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.98)",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.3)",
                    zIndex: 99999,
                    position: "absolute",
                    isolation: "isolate",
                  }}
                >
                  <MenuLinks />
                </motion.div>
              )}
            </AnimatePresence>
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
            className="md:hidden border-b bg-background/90 ios26-card relative z-40"
          >
            <div className="p-4 space-y-2">
              <MenuLinks />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Adiciona estilo de animação e z-index fix */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Garantir que o navbar fique acima do conteúdo */
        .free-navbar-container {
          position: relative;
          z-index: 50;
        }
        
        /* Garantir que o menu dropdown apareça acima de tudo */
        .navbar-dropdown-menu {
          z-index: 100 !important;
          position: absolute !important;
          isolation: isolate !important;
        }
        
        /* Garantir que o conteúdo da página fique atrás do navbar */
        .app-layout-with-navbar main {
          position: relative;
          z-index: 10;
        }
        
        /* Garantir que o PageContainer fique atrás do navbar */
        .app-layout-with-navbar .page-container {
          position: relative;
          z-index: 10;
        }
      `}</style>
    </div>
  );
}

export default Navbar; 