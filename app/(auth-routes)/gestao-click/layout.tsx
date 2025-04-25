"use client";

import { usePathname, redirect } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/app/_components/ui/breadcrumb";
import { Home, ArrowRight } from "lucide-react";
import { Card } from "@/app/_components/ui/card";

export default function GestaoClickLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Gerar breadcrumb baseado no pathname
  const generateBreadcrumb = () => {
    const paths = pathname?.split('/').filter(Boolean) || [];
    if (paths.length === 0) return [];
    
    const breadcrumbItems = [];
    let currentPath = "";
    
    // Sempre iniciar com Home
    breadcrumbItems.push({
      label: "Home",
      href: "/dashboard",
      icon: Home
    });
    
    // Adicionar Gestão Click como segundo nível
    breadcrumbItems.push({
      label: "Gestão Click",
      href: "/gestao-click",
    });
    
    // Adicionar os demais níveis
    for (let i = 1; i < paths.length; i++) {
      currentPath += `/${paths[i]}`;
      const isNumeric = !isNaN(Number(paths[i]));
      
      // Ajustar label para diferentes caminhos ou quando for ID (numérico)
      let label = "";
      if (isNumeric) {
        if (paths[i-1] === "vendas") {
          label = "Detalhes da Venda";
        } else if (paths[i-1] === "clientes") {
          label = "Detalhes do Cliente";
        } else {
          label = `ID: ${paths[i]}`;
        }
      } else {
        // Ajustar nomes baseados nas páginas
        switch(paths[i]) {
          case "clientes":
            label = "Clientes";
            break;
          case "vendas":
            label = "Vendas";
            break;
          case "relatorios":
            label = "Relatórios";
            break;
          case "sync-settings":
            label = "Sincronização";
            break;
          default:
            // Capitalizar primeira letra
            label = paths[i].charAt(0).toUpperCase() + paths[i].slice(1);
        }
      }
      
      breadcrumbItems.push({
        label,
        href: `/gestao-click${currentPath}`,
      });
    }
    
    return breadcrumbItems;
  };
  
  const breadcrumbItems = generateBreadcrumb();
  
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => (
            <BreadcrumbItem key={index}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbLink href={item.href} className="flex items-center">
                {item.icon && <item.icon className="mr-1 h-4 w-4" />}
                {item.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Conteúdo da página */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
} 