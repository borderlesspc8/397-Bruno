"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/app/_lib/utils';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { NavigationItem } from './types';

interface NavigationItemWithChildrenProps {
  item: NavigationItem;
  isActive: boolean;
  isCollapsed: boolean;
  isExpanded: boolean;
  toggleExpand: () => void;
  showIcons: boolean;
  activeItemIndicator: 'background' | 'border' | 'both';
}

/**
 * Componente para renderizar um item de navegação com filhos (submenu)
 */
export function NavigationItemWithChildren({
  item,
  isActive,
  isCollapsed,
  isExpanded,
  toggleExpand,
  showIcons,
  activeItemIndicator
}: NavigationItemWithChildrenProps) {
  // Determinar a classe CSS para um item ativo
  const getActiveItemClass = (active: boolean) => {
    if (!active) return '';
    
    switch (activeItemIndicator) {
      case 'background':
        return 'bg-primary/10 text-primary';
      case 'border':
        return 'border-l-4 border-primary text-primary';
      case 'both':
        return 'bg-primary/10 border-l-4 border-primary text-primary';
      default:
        return 'bg-primary/10 text-primary';
    }
  };
  
  // Se estiver colapsado, não mostra os filhos
  if (isCollapsed) {
    return null;
  }
  
  return (
    <div className="w-full">
      {/* Item pai/título do grupo */}
      <Button
        variant="ghost"
        onClick={toggleExpand}
        className={cn(
          "w-full justify-between px-3 h-10 py-2",
          getActiveItemClass(isActive)
        )}
      >
        <div className="flex items-center">
          {showIcons && item.icon && (
            <div className="mr-2 w-6 h-6 flex items-center justify-center">
              {item.icon}
            </div>
          )}
          <span>{item.label}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            isExpanded && "transform rotate-180"
          )}
        />
      </Button>
      
      {/* Renderizar filhos se expandido */}
      {isExpanded && (
        <div className="mt-1 ml-6 space-y-1">
          {item.children?.map(child => (
            <Link key={child.id} href={child.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-8 px-2 text-sm",
                  getActiveItemClass(
                    child.href === window.location.pathname || 
                    window.location.pathname.startsWith(child.href.split('?')[0])
                  )
                )}
              >
                {showIcons && child.icon && (
                  <div className="mr-2 w-4 h-4 flex items-center justify-center">
                    {child.icon}
                  </div>
                )}
                <span>{child.label}</span>
                {child.badge && (
                  <Badge variant={child.badgeVariant || 'secondary'} className="ml-auto">
                    {child.badge}
                  </Badge>
                )}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 
