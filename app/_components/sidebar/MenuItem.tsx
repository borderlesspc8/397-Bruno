"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/app/_lib/utils";
import { MenuItem, SubscriptionPlan } from "./types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Lock, Star, Sparkles, Target } from "lucide-react";

interface MenuItemProps {
  item: MenuItem;
  collapsed: boolean;
  userPlan: SubscriptionPlan;
  pathname: string;
  isPlanIncluded: (userPlan: SubscriptionPlan, requiredPlan: SubscriptionPlan) => boolean;
  getPlanLabel: (plan: SubscriptionPlan) => string;
  getActiveItemBgClass: () => string;
}

export const MenuItemComponent: React.FC<MenuItemProps> = ({
  item,
  collapsed,
  userPlan,
  pathname,
  isPlanIncluded,
  getPlanLabel,
  getActiveItemBgClass
}) => {
  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
  const accessible = isPlanIncluded(userPlan, item.plan);
  const itemPath = accessible ? item.href : "/subscription";
  
  const IconComponent = item.icon;
  
  return (
    <TooltipProvider key={item.href}>
      <Tooltip delayDuration={collapsed ? 0 : 500}>
        <TooltipTrigger asChild>
          <Link 
            href={itemPath}
            className={cn(
              "flex items-center group",
              collapsed ? "justify-center p-2" : "px-3 py-2 justify-between",
              isActive 
                ? getActiveItemBgClass()
                : "text-muted-foreground hover:bg-muted/60 transition-colors",
              "rounded-md transition-all duration-150 ease-in-out relative",
              !accessible && "opacity-60 hover:opacity-80"
            )}
          >
            <div className="flex items-center">
              <div className="relative">
                <IconComponent className={cn(
                  "h-5 w-5",
                  collapsed ? "mx-auto" : "mr-3",
                  isActive && "text-primary"
                )} />
                
                {!accessible && (
                  <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5">
                    <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                  </div>
                )}
                
                {accessible && item.premiumContent && (
                  <div className="absolute -top-1 -right-1 h-2.5 w-2.5">
                    <Star className="h-2.5 w-2.5 text-amber-500" />
                  </div>
                )}
                
                {accessible && item.enterpriseFeature && (
                  <div className="absolute -top-1 -right-1 h-3 w-3">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                  </div>
                )}
              </div>
              
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  {item.label}
                </span>
              )}
            </div>
            
            {!collapsed && !accessible && (
              <Badge variant="outline" className="ml-auto text-xs py-px px-1.5 h-5 font-normal">
                {getPlanLabel(item.plan)}
              </Badge>
            )}
            
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
              
              {!accessible && (
                <Badge variant="outline" className="text-xs ml-auto">
                  {getPlanLabel(item.plan)}
                </Badge>
              )}
              
              {accessible && item.premiumContent && (
                <Badge className="bg-amber-500 text-white border-0 ml-auto text-xs">
                  Premium
                </Badge>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mb-1">
              {item.description}
            </p>
            
            {item.limits && item.limits[userPlan] && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                <Target className="h-3 w-3 text-primary" />
                <span>{item.limits[userPlan]}</span>
              </div>
            )}
            
            {!accessible && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full text-xs font-normal h-7 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 hover:opacity-90"
              >
                <Sparkles className="h-3 w-3 mr-1 text-primary" />
                Fazer upgrade
              </Button>
            )}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export default MenuItemComponent; 