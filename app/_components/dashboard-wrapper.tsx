"use client";

import React, { useState } from "react";
import { Card } from "@/app/_components/ui/card";
import { DatePickerWithRange } from "@/app/_components/ui/date-range-picker";
import { addMonths } from "date-fns";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/app/_components/ui/breadcrumb";
import { Home, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";

export default function DashboardWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Estado para o seletor de datas
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addMonths(new Date(), -1),
    to: new Date(),
  });

  const router = useRouter();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();

  // Controlar mudança no intervalo de datas
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange(range);
      
      const fromDate = range.from.toISOString().split('T')[0];
      const toDate = range.to.toISOString().split('T')[0];
      
      // Atualizar URL com novos parâmetros de data
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set('dataInicio', fromDate);
      params.set('dataFim', toDate);
      
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  // Determinar qual tab está ativa com base no pathname
  const getActiveTab = () => {
    const paths = pathname?.split('/') || [];
    const path = paths.length > 0 ? paths[paths.length - 1] : '';
    
    switch (path) {
      case 'vendas':
        return 'vendas';
      case 'consultores':
        return 'consultores';
      case 'atendimentos':
        return 'atendimentos';
      case 'conversao':
        return 'conversao';
      case 'metas':
        return 'metas';
      case 'performance':
        return 'performance';
      default:
        return 'vendas';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      
      {/* Cabeçalho com Tabs de navegação entre dashboards */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboards Comerciais</h1>
          <p className="text-muted-foreground">
            Visualize e analise dados de vendas, atendimentos e performance.
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <DatePickerWithRange 
            dateRange={dateRange} 
            onChange={handleDateRangeChange} 
          />
        </div>
      </div>
      
      {/* Tabs para navegação entre dashboards */}
      <Tabs defaultValue={getActiveTab()} className="w-full mt-4" onValueChange={(value) => {
        router.push(`/dashboard/${value}`);
      }}>
        <TabsList className="w-full md:w-auto bg-card border">
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="consultores">Consultores</TabsTrigger>
          <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger>
          <TabsTrigger value="conversao">Conversão</TabsTrigger>
          <TabsTrigger value="metas">Metas</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <Card className="w-full shadow-sm p-4">
            {children}
          </Card>
        </div>
      </Tabs>
    </div>
  );
} 
