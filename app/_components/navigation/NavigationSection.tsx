"use client";

import React from 'react';
import { cn } from '@/app/_lib/utils';
import { NavigationItem } from './NavigationItem';
import { NavigationItemWithChildren } from './NavigationItemWithChildren';
import { NavigationSectionProps } from './types';

/**
 * Componente para renderizar uma seção do menu de navegação
 */
export function NavigationSection({
  sectionId,
  sectionTitle,
  items,
  isCollapsed,
  isFirstSection,
  expandedSections,
  toggleSection,
  showIcons,
  activeItemIndicator,
  isActive
}: NavigationSectionProps) {
  // Renderizar cada item da seção
  const renderItems = () => {
    return items.map(item => {
      const active = isActive(item);
      
      // Renderizar item com filhos
      if (item.children && item.children.length > 0) {
        const isExpanded = expandedSections[item.id] || false;
        
        return (
          <NavigationItemWithChildren
            key={item.id}
            item={item}
            isActive={active}
            isCollapsed={isCollapsed}
            isExpanded={isExpanded}
            toggleExpand={() => toggleSection(item.id)}
            showIcons={showIcons}
            activeItemIndicator={activeItemIndicator}
          />
        );
      }
      
      // Renderizar item simples
      return (
        <NavigationItem
          key={item.id}
          item={item}
          isActive={active}
          isCollapsed={isCollapsed}
          activeItemIndicator={activeItemIndicator}
          showIcons={showIcons}
        />
      );
    });
  };
  
  return (
    <div className={cn(isFirstSection ? "" : "pt-2 mt-2 border-t border-border/40")}>
      {!isCollapsed && sectionTitle && (
        <h2 className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide px-3 mb-2">
          {sectionTitle}
        </h2>
      )}
      <div className="space-y-1">
        {renderItems()}
      </div>
    </div>
  );
} 