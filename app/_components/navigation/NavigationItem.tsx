"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '@/app/_lib/utils';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/app/_components/ui/tooltip';
import { NavigationItem as NavigationItemType } from './types';

interface NavigationItemProps {
  item: NavigationItemType;
  isActive: boolean;
  isCollapsed: boolean;
  activeItemIndicator: 'background' | 'border' | 'both';
  showIcons: boolean;
}

/**
 * Componente para renderizar um item individual do menu de navegação
 */
export function NavigationItem({
  item,
  isActive,
  isCollapsed,
  activeItemIndicator,
  showIcons
}: NavigationItemProps) {
  // Determinar a classe CSS para um item ativo com base no indicador definido
  const getActiveItemClass = () => {
    if (!isActive) return '';
    
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
  
  // Renderizar um item simples (sem tooltip quando expandido)
  if (!isCollapsed) {
    return (
      <Link href={item.href} className="w-full block">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-10 px-3",
            getActiveItemClass()
          )}
        >
          {showIcons && item.icon && (
            <div className="flex items-center justify-center w-6 h-6 mr-2">
              {item.icon}
            </div>
          )}
          <span>{item.label}</span>
          {item.badge && (
            <Badge variant={item.badgeVariant || 'secondary'} className="ml-auto">
              {item.badge}
            </Badge>
          )}
        </Button>
      </Link>
    );
  }
  
  // Renderizar com tooltip quando o menu estiver colapsado
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={item.href} className="w-full block">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-center h-10 px-3",
                getActiveItemClass()
              )}
            >
              {showIcons && item.icon && (
                <div className="flex items-center justify-center w-6 h-6">
                  {item.icon}
                </div>
              )}
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="flex flex-col">
            <span className="font-medium">{item.label}</span>
            {item.description && <span className="text-xs text-muted-foreground">{item.description}</span>}
            {item.badge && <Badge variant={item.badgeVariant || 'secondary'} className="mt-1">{item.badge}</Badge>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 