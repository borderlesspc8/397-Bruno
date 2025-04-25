"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Building, 
  CreditCard, 
  Wallet, 
  Home, 
  BarChart3, 
  PieChart, 
  Banknote, 
  Settings, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  Bell,
  CircleHelp,
  Search,
  UserCircle,
  Coins,
  ArrowUpDown,
  FileSpreadsheet,
  FileCheck,
  Brain,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/app/_lib/utils";
import { useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { motion } from "framer-motion";
import React from "react";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "../ui/use-toast";
import { MenuItem } from "./types";
import { MenuItemComponent } from "./MenuItem";
import { MobileMenu } from "./MobileMenu";

// Menu lateral principal memoizado para evitar renderizações desnecessárias
const SideNav = React.memo(() => {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Definição estática do menu da aplicação
  const menuItems: MenuItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
      description: "Visão geral das suas finanças"
    },
    {
      name: "Carteiras",
      href: "/wallets",
      icon: <Wallet className="h-5 w-5" />,
      description: "Gerencie suas contas e carteiras",
      children: [
        {
          name: "Todas as Carteiras",
          href: "/wallets?tab=all",
          icon: <Wallet className="h-4 w-4" />,
          description: "Visualizar todas as suas carteiras"
        },
        {
          name: "Contas Bancárias",
          href: "/wallets?tab=bank",
          icon: <Building className="h-4 w-4" />,
          description: "Gerenciar contas bancárias"
        },
        {
          name: "Dinheiro",
          href: "/wallets?tab=cash",
          icon: <Coins className="h-4 w-4" />,
          description: "Controle seu dinheiro físico"
        },
        {
          name: "Outros",
          href: "/wallets?tab=other",
          icon: <CreditCard className="h-4 w-4" />,
          description: "Outros tipos de carteiras"
        }
      ]
    },
    {
      name: "Transações",
      href: "/transactions",
      icon: <ArrowUpDown className="h-5 w-5" />,
      description: "Acompanhe receitas e despesas"
    },
    {
      name: "Cartões de Crédito",
      href: "/credit-cards",
      icon: <CreditCard className="h-5 w-5" />,
      isPro: true,
      badge: "Pro",
      description: "Gerencie seus cartões de crédito"
    },
    {
      name: "Relatórios",
      href: "/reports",
      icon: <BarChart3 className="h-5 w-5" />,
      description: "Visualize relatórios financeiros"
    },
    {
      name: "Análises",
      href: "/analytics",
      icon: <PieChart className="h-5 w-5" />,
      isPro: true,
      badge: "Pro",
      description: "Análises avançadas de gastos"
    },
    {
      name: "Orçamentos",
      href: "/budgets",
      icon: <Banknote className="h-5 w-5" />,
      description: "Configure e acompanhe orçamentos"
    },
    {
      name: "Conciliação",
      href: "/reconciliacao",
      icon: <FileSpreadsheet className="h-5 w-5" />,
      description: "Concilie vendas e transações",
      children: [
        {
          name: "Manual",
          href: "/reconciliacao/manual",
          icon: <FileCheck className="h-4 w-4" />,
          description: "Conciliação manual de transações"
        },
        {
          name: "Inteligente (ML)",
          href: "/reconciliacao/ml",
          icon: <Brain className="h-4 w-4" />,
          description: "Conciliação automática com Machine Learning",
          badge: "Novo"
        }
      ]
    },
    {
      name: "Configurações",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
      description: "Ajuste as configurações da aplicação"
    }
  ];
  
  // Recuperar o estado de colapso do localStorage (apenas uma vez na montagem do componente)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCollapsed = localStorage.getItem('sideNavCollapsed');
      if (savedCollapsed !== null) {
        setCollapsed(JSON.parse(savedCollapsed));
      }
    }
  }, []); // Dependência vazia para executar apenas na montagem
  
  // Adaptar para telas pequenas (apenas uma vez na montagem e quando a janela for redimensionada)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    
    // Execução inicial
    handleResize();
    
    // Adicionar listener
    window.addEventListener("resize", handleResize);
    
    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Dependência vazia para executar apenas na montagem
  
  // Salvar o estado de colapso no localStorage (apenas quando collapsed mudar)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sideNavCollapsed', JSON.stringify(collapsed));
  }, [collapsed]); // Executa apenas quando collapsed mudar
  
  // Toggle expandedSections
  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };
  
  // Salvar o estado de colapso
  const toggleCollapsed = () => {
    setCollapsed(prev => !prev);
    // Não salvamos aqui no localStorage porque já temos um useEffect para isso
  };
  
  // Filtragem de itens por pesquisa (apenas quando searchQuery mudar)
  useEffect(() => {
    // Evitamos re-criar os filteredItems se a busca estiver vazia
    if (!searchQuery.trim()) {
      setFilteredItems([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = menuItems.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.description?.toLowerCase().includes(query) ||
      item.children?.some(child => 
        child.name.toLowerCase().includes(query) || 
        child.description?.toLowerCase().includes(query)
      )
    );
    
    setFilteredItems(filtered);
  }, [searchQuery]); // menuItems é estático, então não precisamos incluí-lo nas dependências
  
  // Verificar se o item está ativo
  const isActive = useCallback((item: MenuItem): boolean => {
    if (pathname === item.href) return true;
    if (item.children) {
      return item.children.some(child => 
        pathname === child.href ||
        pathname.startsWith(child.href.split('?')[0]) ||
        (child.href.includes('wallets') && pathname.includes('wallets'))
      );
    }
    return pathname.startsWith(item.href);
  }, [pathname]);
  
  // Verificar se um item filho está ativo
  const isChildActive = useCallback((href: string): boolean => {
    return pathname === href || 
      pathname.startsWith(href.split('?')[0]) ||
      (href.includes('tab=') && pathname.includes(href.split('?')[0]) && 
       pathname.includes(href.split('=')[1]))
  }, [pathname]);
  
  // Expandir automaticamente a seção pai de um item ativo (apenas quando pathname mudar)
  useEffect(() => {
    const newExpandedSections: Record<string, boolean> = {};
    
    menuItems.forEach(item => {
      if (item.children && isActive(item)) {
        newExpandedSections[item.name] = true;
      }
    });
    
    // Só atualizamos se houver mudanças
    if (Object.keys(newExpandedSections).length > 0) {
      setExpandedSections(prev => ({
        ...prev,
        ...newExpandedSections
      }));
    }
  }, [pathname, isActive]);

  // Função para lidar com logout
  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push("/login");
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Não foi possível realizar o logout.",
        variant: "destructive",
      });
    }
  };
  
  const AnimatedMotionDiv = motion.div;
  
  return (
    <>
      {/* Menu para desktop */}
      <AnimatedMotionDiv 
        className={cn(
          "hidden md:flex flex-col border-r bg-background/95 backdrop-blur-sm sticky top-0 h-screen z-30 shadow-sm",
          "transition-all duration-300 ease-in-out"
        )}
        initial={false}
        animate={{ width: collapsed ? 72 : 280 }}
        layoutId="sidebar"
        transition={{
          duration: 0.2,
          type: "spring",
          stiffness: 500,
          damping: 40
        }}
      >
        <div className={cn(
          "flex items-center h-16 px-4 border-b",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              <motion.h1 
                className="text-xl font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Conta Rápida
              </motion.h1>
            </div>
          ) : (
            <Wallet className="h-6 w-6 text-primary" />
          )}
          
          {!collapsed && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full"
              onClick={toggleCollapsed}
              aria-label="Recolher menu"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <ScrollArea className="flex-1 px-3 py-3">
          {!collapsed && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar no menu..."
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
          
          <nav className="space-y-1">
            {(searchQuery ? filteredItems : menuItems).map(item => (
              <MenuItemComponent
                key={item.name}
                item={item}
                isActive={isActive(item)}
                isChildActive={isChildActive}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                collapsed={collapsed}
              />
            ))}
            
            {searchQuery && filteredItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <CircleHelp className="h-8 w-8 text-muted-foreground/60 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum resultado encontrado para "{searchQuery}"
                </p>
              </div>
            )}
          </nav>
        </ScrollArea>
        
        <div className="border-t p-3">
          {collapsed ? (
            <div className="flex flex-col items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                aria-label="Perfil"
                onClick={() => router.push('/profile')}
              >
                <UserCircle className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-10 w-10"
                onClick={toggleCollapsed}
                aria-label="Expandir menu"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/60 transition-colors">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "Usuário"} />
                  <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session?.user?.name || "Usuário"}</p>
                  <p className="text-xs text-muted-foreground truncate">{session?.user?.email || "exemplo@email.com"}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                  onClick={() => router.push('/notifications')}
                >
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 justify-start"
                  onClick={() => router.push('/settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex-1 justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          )}
        </div>
      </AnimatedMotionDiv>
      
      {/* Menu para dispositivos móveis */}
      <MobileMenu
        session={session}
        menuItems={menuItems}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredItems={filteredItems}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
        isActive={isActive}
        isChildActive={isChildActive}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        handleLogout={handleLogout}
      />
    </>
  );
});

// Adicione um displayName para depuração
SideNav.displayName = "SideNav";

export default SideNav; 