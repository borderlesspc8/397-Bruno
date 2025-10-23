"use client";

import React from "react";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from "@/app/_components/ui/breadcrumb";
import { Home, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/app/_lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PageContainer({ 
  children,
  title,
  description,
  actions,
  className,
  fullWidth = false
}: PageContainerProps) {
  const pathname = usePathname() || "";
  
  // Gerar breadcrumb baseado no pathname
  
  return (
    <div className={cn(
      "page-container mx-auto px-4 py-6 relative z-10",
      fullWidth ? "w-full" : "container max-w-screen-2xl",
      className
    )} style={{ overflow: 'visible', position: 'relative' }}>
      
      
      {/* Cabeçalho da página com melhor espaçamento e responsividade */}
      {(title || description || actions) && (
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between mb-8">
          <div className="space-y-1.5">
            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-muted-foreground max-w-prose">
                {description}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex-shrink-0 flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      
      {/* Conteúdo da página */}
      <div className="animate-in fade-in duration-300">
        {children}
      </div>
    </div>
  );
}

export default PageContainer; 
