"use client";

import { cn } from "@/app/_lib/utils";
import Link from "next/link";
import React from "react";
import { ChevronRight, Star } from "lucide-react";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { MenuItem } from "./types";

const AnimatedMotionDiv = React.memo(motion.div);

// Componente para o chevron animado
export const AnimatedChevron = React.memo(({ isExpanded }: { isExpanded?: boolean }) => (
  <ChevronRight 
    className={cn(
      "h-4 w-4 transition-transform duration-200",
      isExpanded && "transform rotate-90"
    )} 
  />
));

interface MenuItemProps {
  item: MenuItem;
  isActive: boolean;
  isChildActive?: (href: string) => boolean;
  expandedSections: Record<string, boolean>;
  toggleSection: (sectionName: string) => void;
  collapsed: boolean;
  mobile?: boolean;
  onClickItem?: () => void;
}

export const MenuItemComponent: React.FC<MenuItemProps> = ({
  item,
  isActive,
  isChildActive,
  expandedSections,
  toggleSection,
  collapsed,
  mobile = false,
  onClickItem
}) => {
  const isExpanded = expandedSections[item.name];
  
  return (
    <div className={cn("relative", !mobile && "my-1")} key={item.name}>
      {/* Indicador ativo */}
      {isActive && !mobile && (
        <AnimatedMotionDiv 
          className="absolute left-0 top-1/2 w-1 h-6 bg-primary rounded-r-md -translate-y-1/2"
          layoutId="activeIndicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      <TooltipProvider>
        <Tooltip delayDuration={collapsed ? 200 : 1000}>
          <TooltipTrigger asChild>
            <Link 
              href={item.children ? "#" : item.href} 
              onClick={(e) => {
                if (item.children) {
                  e.preventDefault();
                  toggleSection(item.name);
                }
                if (mobile && onClickItem) {
                  onClickItem();
                }
              }}
              className={cn(
                "flex items-center justify-between py-2.5 px-3 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "hover:bg-muted/80 text-foreground/80 hover:text-foreground",
                mobile ? "mb-1" : "",
                item.isPro && !isActive && "opacity-80"
              )}
              aria-expanded={item.children ? isExpanded : undefined}
            >
              <div className="flex items-center gap-3 relative">
                <div className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-md transition-colors duration-200",
                  isActive ? "bg-primary/15 text-primary" : "text-foreground/70"
                )}>
                  {item.icon}
                  
                  {item.isPro && (
                    <div className="absolute -top-1 -right-1">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    </div>
                  )}
                </div>
                
                {(!collapsed || mobile) && (
                  <span className={cn(
                    "text-sm transition-all duration-200",
                    isActive && "font-medium"
                  )}>
                    {item.name}
                  </span>
                )}
              </div>
              
              {(!collapsed || mobile) && (
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <Badge 
                      className={cn(
                        "text-xs px-1.5 py-0.5 h-5",
                        item.isPro 
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0" 
                          : "bg-muted"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                  
                  {item.children && <AnimatedChevron isExpanded={isExpanded} />}
                </div>
              )}
            </Link>
          </TooltipTrigger>
          
          {collapsed && !mobile && item.description && (
            <TooltipContent side="right" className="max-w-[200px]">
              <div className="space-y-2">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                {item.isPro && (
                  <Badge className="text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0">
                    Pro
                  </Badge>
                )}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      
      {/* Submenu para itens com filhos */}
      <AnimatePresence initial={false}>
        {(!collapsed || mobile) && isExpanded && item.children && (
          <AnimatedMotionDiv 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-7 pl-4 border-l border-border/50 mt-1 space-y-1">
              {item.children.map((child) => (
                <Link 
                  href={child.href} 
                  key={child.name}
                  className={cn(
                    "flex items-center py-2 px-3 rounded-md text-sm transition-colors",
                    isChildActive?.(child.href)
                      ? "bg-primary/10 text-primary font-medium" 
                      : "hover:bg-muted/60 text-foreground/70 hover:text-foreground"
                  )}
                  onClick={() => mobile && onClickItem?.()}
                >
                  <div className="flex items-center gap-2">
                    {child.icon}
                    <span>{child.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </AnimatedMotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuItemComponent; 