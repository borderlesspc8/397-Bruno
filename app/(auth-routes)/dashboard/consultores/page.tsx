"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/app/_components/ui/use-toast";
import { DateRangePicker } from "@/app/_components/DateRangePicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { subMonths } from "date-fns";
import { ConsultoresOverview } from "./components/ConsultoresOverview";
import { HistoricoVendas } from "./components/HistoricoVendas";
import { ProdutosVendidos } from "./components/ProdutosVendidos";
import { ClientesConsultores } from "./components/ClientesConsultores";
import { useConsultores } from "./hooks/useConsultores";

export default function ConsultoresDashboard() {
  const { toast } = useToast();
  
  // Data padrão: últimos 30 dias
  const hoje = new Date();
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subMonths(hoje, 1),
    to: hoje,
  });
  
  // Consultor selecionado
  const [consultorSelecionado, setConsultorSelecionado] = useState<string | null>(null);
  
  // Buscar dados dos consultores
  const { data, isLoading, error } = useConsultores({
    dateRange,
    consultorId: consultorSelecionado
  });
  
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range);
  };
  
  const handleConsultorChange = (consultorId: string | null) => {
    setConsultorSelecionado(consultorId);
  };

  if (error) {
    toast({
      title: "Erro ao carregar dados",
      description: error,
      variant: "destructive",
    });
  }
  
  return (
    <div className="w-full p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Consultores</h1>
          <p className="text-muted-foreground">
            Acompanhamento de performance dos consultores Personal Prime
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangePicker
            dateRange={dateRange}
            onChange={handleDateRangeChange}
            align="end"
          />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="mb-2">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#faba33]/10 data-[state=active]:text-[#faba33]">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="historico" className="data-[state=active]:bg-[#faba33]/10 data-[state=active]:text-[#faba33]">
            Histórico
          </TabsTrigger>
          <TabsTrigger value="produtos" className="data-[state=active]:bg-[#faba33]/10 data-[state=active]:text-[#faba33]">
            Produtos
          </TabsTrigger>
          <TabsTrigger value="clientes" className="data-[state=active]:bg-[#faba33]/10 data-[state=active]:text-[#faba33]">
            Clientes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <ConsultoresOverview 
            data={data?.consultores}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="historico">
          <HistoricoVendas 
            dateRange={dateRange}
            consultorId={consultorSelecionado}
            onConsultorChange={handleConsultorChange}
          />
        </TabsContent>
        
        <TabsContent value="produtos">
          <ProdutosVendidos 
            dateRange={dateRange}
            consultorId={consultorSelecionado}
            onConsultorChange={handleConsultorChange}
          />
        </TabsContent>
        
        <TabsContent value="clientes">
          <ClientesConsultores 
            dateRange={dateRange}
            consultorId={consultorSelecionado}
            onConsultorChange={handleConsultorChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 
