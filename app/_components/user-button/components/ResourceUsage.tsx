"use client";

import { ResourceUsage } from "../types";
import { formatUsagePercentage, getUsageColor } from "../utils/formatters";
import { Database, CreditCard, Link } from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "../../ui/tooltip";
import { Progress } from "../../ui/progress";

interface ResourceUsageProps {
  resourceUsage: ResourceUsage | undefined;
  isLoading: boolean;
}

export const ResourceUsageDisplay = ({ resourceUsage, isLoading }: ResourceUsageProps) => {
  if (isLoading) {
    return (
      <div className="w-full space-y-2 animate-pulse">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-full"></div>
      </div>
    );
  }
  
  if (!resourceUsage) return null;
  
  return (
    <div className="space-y-3 mt-3 w-full">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center">
            <CreditCard className="h-3.5 w-3.5 mr-1.5 text-primary" />
            <span>Carteiras</span>
          </div>
          <span>
            {resourceUsage.wallets.used}/{resourceUsage.wallets.limit}
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Progress 
                  value={resourceUsage.wallets.percentage * 100} 
                  className="h-1.5"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{formatUsagePercentage(resourceUsage.wallets.percentage)} utilizado</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center">
            <Database className="h-3.5 w-3.5 mr-1.5 text-primary" />
            <span>Transações</span>
          </div>
          <span>
            {resourceUsage.transactions.used}/{resourceUsage.transactions.limit}
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Progress 
                  value={resourceUsage.transactions.percentage * 100} 
                  className="h-1.5"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{formatUsagePercentage(resourceUsage.transactions.percentage)} utilizado</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center">
            <Link className="h-3.5 w-3.5 mr-1.5 text-primary" />
            <span>Conexões</span>
          </div>
          <span>
            {resourceUsage.connections.used}/{resourceUsage.connections.limit}
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Progress 
                  value={resourceUsage.connections.percentage * 100} 
                  className="h-1.5"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{formatUsagePercentage(resourceUsage.connections.percentage)} utilizado</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}; 