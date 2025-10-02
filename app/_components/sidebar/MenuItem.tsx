"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/app/_lib/utils";
import { MenuItem } from "./types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface MenuItemProps {
  item: MenuItem;
  collapsed: boolean;
  pathname: string;
  getActiveItemBgClass: () => string;
}

export const MenuItemComponent: React.FC<MenuItemProps> = ({
  item,
  collapsed,
  pathname,
  getActiveItemBgClass
}) => {
  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
  const IconComponent = item.icon;
  
  return (
    <TooltipProvider key={item.href}>
      <Tooltip delayDuration={collapsed ? 0 : 500}>
        <TooltipTrigger asChild>
          <Link 
            href={item.href}
            className={cn(
              "flex items-center group",
              collapsed ? "justify-center p-2" : "px-3 py-2",
              isActive 
                ? getActiveItemBgClass()
                : "text-muted-foreground hover:bg-muted/60 transition-colors",
              "rounded-md transition-all duration-150 ease-in-out relative"
            )}
          >
            <div className="flex items-center">
              <IconComponent className={cn(
                "h-5 w-5",
                collapsed ? "mx-auto" : "mr-3",
                isActive && "text-primary"
              )} />
              
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  {item.label}
                </span>
              )}
            </div>
            
            {isActive && collapsed && (
              <div className="absolute right-0 h-5 w-1 bg-primary rounded-l-full" />
            )}
          </Link>
        </TooltipTrigger>
        
        {collapsed && (
          <TooltipContent side="right" className="flex flex-col p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <IconComponent className="h-4 w-4 text-primary" />
              <span className="font-medium">{item.label}</span>
            </div>
            
            <p className="text-xs text-muted-foreground mb-1">
              {item.description}
            </p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export default MenuItemComponent; 