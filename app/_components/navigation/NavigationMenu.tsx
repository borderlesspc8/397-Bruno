"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/app/_lib/utils';
import { Button } from '@/app/_components/ui/button';
import { ScrollArea } from '@/app/_components/ui/scroll-area';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/app/_components/ui/tooltip';
import { NavigationSection } from './NavigationSection';
import { NavigationItem } from './NavigationItem';
import { NavigationItem as NavigationItemType, NavigationMenuProps } from './types';

/**
 * Componente principal de menu de navegação, suportando diferentes variantes
 */
export function NavigationMenu({
  items,
  isCollapsed = false,
  onToggleCollapse,
  variant = 'sidebar',
  userPlan = 'free',
  showIcons = true,
  className,
  sectionTitles = {},
  activeItemIndicator = 'background',
  defaultExpandedSections = [],
}: NavigationMenuProps) {
  const pathName = usePathname() || '';
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Inicializar seções expandidas
  useEffect(() => {
    if (defaultExpandedSections.length > 0) {
      const expanded: Record<string, boolean> = {};
      defaultExpandedSections.forEach(sectionId => {
        expanded[sectionId] = true;
      });
      setExpandedSections(expanded);
    }
  }, [defaultExpandedSections]);
  
  // Verificar se um item está ativo
  const isActive = (item: NavigationItemType): boolean => {
    if (pathName === item.href) return true;
    
    // Verificar filhos se existirem
    if (item.children) {
      return item.children.some(child => 
        pathName === child.href || 
        pathName.startsWith(child.href.split('?')[0])
      );
    }
    
    // Verificar caminho base
    return pathName.startsWith(item.href);
  };
  
  // Alternar expansão de uma seção
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
  // Adaptar o layout com base na variante
  const variantContainerClass = {
    sidebar: "flex flex-col h-full w-full",
    navbar: "flex flex-row items-center justify-between w-full",
    minimal: "flex flex-col items-center w-full"
  }[variant];

  // Renderizar o menu da barra de navegação
  const renderNavbarContent = () => {
    return (
      <div className="flex items-center space-x-2">
        {items.map(item => (
          <Link key={item.id} href={item.href}>
            <Button 
              variant={isActive(item) ? "secondary" : "ghost"} 
              size="sm"
              className="relative"
            >
              {showIcons && item.icon && (
                <span className="mr-1">{item.icon}</span>
              )}
              {item.label}
            </Button>
          </Link>
        ))}
      </div>
    );
  };
  
  // Renderizar conteúdo minimalista
  const renderMinimalContent = () => {
    return (
      <div className="space-y-3 py-2">
        {items.map(item => (
          <TooltipProvider key={item.id} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={item.href}>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className={cn(
                      "h-10 w-10 rounded-full",
                      isActive(item) && "bg-primary/10 text-primary"
                    )}
                  >
                    {item.icon}
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span>{item.label}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };
  
  // Renderizar conteúdo da barra lateral
  const renderSidebarContent = () => {
    // Organizar itens por seção
    const sections: Record<string, NavigationItemType[]> = {};
    
    items.forEach(item => {
      const sectionId = item.requiresPlan || 'default';
      if (!sections[sectionId]) {
        sections[sectionId] = [];
      }
      sections[sectionId].push(item);
    });
    
    return (
      <ScrollArea className="flex-1 py-2">
        <div className={cn("px-2 space-y-4", className)}>
          {Object.entries(sections).map(([sectionId, sectionItems], index) => (
            <NavigationSection
              key={sectionId}
              sectionId={sectionId}
              sectionTitle={sectionTitles[sectionId]}
              items={sectionItems}
              isCollapsed={isCollapsed}
              isFirstSection={index === 0}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              showIcons={showIcons}
              activeItemIndicator={activeItemIndicator}
              isActive={isActive}
            />
          ))}
        </div>
      </ScrollArea>
    );
  };
  
  // Renderizar conteúdo baseado na variante
  const renderContent = () => {
    switch (variant) {
      case 'navbar':
        return renderNavbarContent();
      case 'minimal':
        return renderMinimalContent();
      case 'sidebar':
      default:
        return renderSidebarContent();
    }
  };
  
  return (
    <div className={cn(variantContainerClass)}>
      {/* Cabeçalho com botão de colapso (apenas para sidebar) */}
      {variant === 'sidebar' && onToggleCollapse && (
        <div className="flex items-center justify-between h-12 px-4 border-b">
          {!isCollapsed && <div className="text-sm font-medium">Menu</div>}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8"
            aria-label={isCollapsed ? "Expandir menu" : "Colapsar menu"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      )}
      
      {/* Conteúdo do menu */}
      {renderContent()}
    </div>
  );
} 