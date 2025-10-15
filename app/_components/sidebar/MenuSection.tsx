"use client";

import React from "react";
import { MenuSection, MenuItem } from "./types";
import { MenuItemComponent } from "./MenuItem";

interface MenuSectionProps {
  section: MenuSection;
  sectionIndex: number;
  collapsed: boolean;
  pathname: string;
  isDarkTheme: boolean;
}

export const MenuSectionComponent: React.FC<MenuSectionProps> = ({
  section,
  sectionIndex,
  collapsed,
  pathname,
  isDarkTheme
}) => {
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
            pathname={pathname}
            getActiveItemBgClass={getActiveItemBgClass}
          />
        ))}
      </div>
    </div>
  );
};

export default MenuSectionComponent; 
