"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/app/_lib/utils";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { SimpleUserButton } from "./SimpleUserButton";
import { MenuSectionComponent } from "./MenuSection";
import { MenuSection, SubscriptionPlan } from "./types";
import { MENU_SECTIONS } from "./menu-data";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname() || "";
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';
  
  // Usar localStorage para persistir o estado de colapso do menu entre as sessões
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setCollapsed(savedState === "true");
    }
  }, []);

  // Atualizar localStorage quando o estado de colapso mudar
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(collapsed));
  }, [collapsed]);
  
  // Em telas pequenas, ajustar largura automaticamente
  useEffect(() => {
    const handleResize = () => {
      // Em telas menores que lg (1024px), colapsar a sidebar
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        // Restaurar estado salvo para telas maiores
        const savedState = localStorage.getItem("sidebarCollapsed");
        if (savedState !== null) {
          setCollapsed(savedState === "true");
        }
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Se estiver em uma rota de autenticação, não mostrar a sidebar
  if (pathname?.includes('/auth')) {
    return null;
  }
  
  return (
    <div 
      className={cn(
        "h-full bg-background border-r shadow-sm transition-all duration-300 flex flex-col",
        collapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      <ScrollArea className="flex-1 py-3">
        <div className="px-2 space-y-4">
          {MENU_SECTIONS.map((section: MenuSection, sIndex: number) => (
            <MenuSectionComponent
              key={section.title}
              section={section}
              sectionIndex={sIndex}
              collapsed={collapsed}
              userPlan={session?.user?.subscriptionPlan as SubscriptionPlan}
              pathname={pathname}
              isDarkTheme={isDarkTheme}
            />
          ))}
        </div>
      </ScrollArea>
      
      <div className="border-t border-border/50 p-3 flex items-center justify-between">
        <div className={cn(
          "flex items-center gap-3 overflow-hidden transition-all",
          collapsed && "w-0 opacity-0"
        )}>
          <SimpleUserButton collapsed={collapsed} />
        </div>
        
        <Button
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-7 w-7 rounded-full flex items-center justify-center p-0 hover:bg-muted/80 transition-colors",
            collapsed && "ml-auto" 
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
} 