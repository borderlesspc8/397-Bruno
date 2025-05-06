"use client";

import React from "react";
import { cn } from "@/app/_lib/utils";
import { MenuSection, MenuItem, SubscriptionPlan } from "./types";
import { MenuItemComponent } from "./MenuItem";

interface MenuSectionProps {
  section: MenuSection;
  sectionIndex: number;
  collapsed: boolean;
  userPlan: SubscriptionPlan;
  pathname: string;
  isDarkTheme: boolean;
}

export const MenuSectionComponent: React.FC<MenuSectionProps> = ({
  section,
  sectionIndex,
  collapsed,
  userPlan,
  pathname,
  isDarkTheme
}) => {
  // Normalizar o plano para o formato usado no hook useSubscriptionAccess
  const normalizedUserPlan = userPlan?.toLowerCase?.() as SubscriptionPlan || "free";
  
  // Função para verificar se o plano do usuário inclui o plano necessário
  const isPlanIncluded = (userPlan: SubscriptionPlan, requiredPlan: SubscriptionPlan): boolean => {
    const planHierarchy = {
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.BASIC]: 1,
      [SubscriptionPlan.PREMIUM]: 2,
      [SubscriptionPlan.ENTERPRISE]: 3
    };
    
    // Se o plano do usuário não estiver definido, considere como FREE
    const userLevel = planHierarchy[userPlan] ?? 0;
    const requiredLevel = planHierarchy[requiredPlan] ?? 0;
    
    return userLevel >= requiredLevel;
  };

  // Obter o rótulo do plano
  const getPlanLabel = (plan: SubscriptionPlan): string => {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return "Grátis";
      case SubscriptionPlan.BASIC:
        return "Básico";
      case SubscriptionPlan.PREMIUM:
        return "Premium";
      case SubscriptionPlan.ENTERPRISE:
        return "Empresarial";
      default:
        return "Desconhecido";
    }
  };

  // Determinar a cor de fundo ativa do item com base no tema
  const getActiveItemBgClass = () => {
    return isDarkTheme 
      ? "bg-primary/20 dark:text-primary" 
      : "bg-primary/10 text-primary";
  };

  return (
    <div key={section.title} className={sectionIndex > 0 ? "pt-2 mt-2 border-t border-border/40" : ""}>
      {!collapsed && (
        <h2 className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide px-3 mb-2">
          {section.title}
        </h2>
      )}
      
      <div className="space-y-1">
        {section.items.map((item: MenuItem) => (
          <MenuItemComponent
            key={item.href}
            item={item}
            collapsed={collapsed}
            userPlan={normalizedUserPlan}
            pathname={pathname}
            isPlanIncluded={isPlanIncluded}
            getPlanLabel={getPlanLabel}
            getActiveItemBgClass={getActiveItemBgClass}
          />
        ))}
      </div>
    </div>
  );
};

export default MenuSectionComponent; 