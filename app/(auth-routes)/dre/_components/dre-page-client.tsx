"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Switch } from "@/app/_components/ui/switch";
import { Label } from "@/app/_components/ui/label";
import { Wallet, CostCenter } from "@prisma/client";
import { AlertCircle, BarChart4, TrendingUp } from "lucide-react";
import { DREMonthlyView } from "./dre-monthly-view";
import { DREAnnualView } from "./dre-annual-view";
import { DREFilters } from "./dre-filters";
import { DREExport } from "./dre-export";
import { DRESummary } from "./dre-summary";
import { DREPeriodControl } from "./dre-period-control";

export interface DREPageClientProps {
  initialPeriod?: "month" | "year";
  initialDate?: string;
  initialIncludeEstimates?: boolean;
  initialCompareWithPrevious?: boolean;
  initialIncludeGestaoClick?: boolean;
  hasGestaoClickIntegration?: boolean;
  wallets?: Wallet[];
  costCenters?: CostCenter[];
}

/**
 * Componente cliente principal para a página de DRE
 */
export function DREPageClient({
  initialPeriod = "month",
  initialDate,
  initialIncludeEstimates = true,
  initialCompareWithPrevious = false,
  initialIncludeGestaoClick = true,
  hasGestaoClickIntegration = false,
  wallets = [],
  costCenters = [],
}: DREPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estados
  const [period, setPeriod] = useState<"month" | "year">(initialPeriod);
  const [date, setDate] = useState<Date>(
    initialDate 
      ? parseISO(initialDate) 
      : period === "month" ? startOfMonth(new Date()) : startOfYear(new Date())
  );
  const [includeEstimates, setIncludeEstimates] = useState<boolean>(initialIncludeEstimates);
  const [compareWithPrevious, setCompareWithPrevious] = useState<boolean>(initialCompareWithPrevious);
  const [includeGestaoClick, setIncludeGestaoClick] = useState<boolean>(
    initialIncludeGestaoClick && hasGestaoClickIntegration
  );
  
  // Filtros
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [selectedCostCenters, setSelectedCostCenters] = useState<string[]>([]);
  
  // Estado de carregamento e erros
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  
  // Atualizar URL com os parâmetros selecionados
  const updateUrlParams = () => {
    const params = new URLSearchParams();
    
    params.set("period", period);
    params.set("date", format(date, "yyyy-MM-dd"));
    params.set("includeEstimates", includeEstimates.toString());
    params.set("compareWithPrevious", compareWithPrevious.toString());
    
    if (hasGestaoClickIntegration) {
      params.set("includeGestaoClick", includeGestaoClick.toString());
    }
    
    if (selectedWallets.length > 0) {
      params.set("wallets", selectedWallets.join(","));
    }
    
    if (selectedCostCenters.length > 0) {
      params.set("costCenters", selectedCostCenters.join(","));
    }
    
    // Substituir URL sem fazer reload da página
    router.replace(`/dre?${params.toString()}`, { scroll: false });
  };
  
  // Carregar dados do DRE da API
  const loadDREData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.set("period", period);
      params.set("date", format(date, "yyyy-MM-dd"));
      params.set("includeEstimates", includeEstimates.toString());
      params.set("compareWithPrevious", compareWithPrevious.toString());
      params.set("includeGestaoClick", includeGestaoClick.toString());
      
      if (selectedWallets.length > 0) {
        params.set("wallets", selectedWallets.join(","));
      }
      
      if (selectedCostCenters.length > 0) {
        params.set("costCenters", selectedCostCenters.join(","));
      }
      
      const response = await fetch(`/api/dre?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Falha ao carregar dados do DRE");
      }
      
      const dreData = await response.json();
      setData(dreData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados do DRE");
      console.error("Erro ao carregar DRE:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navegar para outro período
  const handleNavigatePeriod = (newDate: Date) => {
    setDate(newDate);
  };
  
  // Alterar o tipo de período (mensal/anual)
  const handlePeriodTypeChange = (newPeriod: "month" | "year") => {
    setPeriod(newPeriod);
  };
  
  // Atualizar URL quando parâmetros mudam
  useEffect(() => {
    updateUrlParams();
  }, [period, date, includeEstimates, compareWithPrevious, includeGestaoClick, selectedWallets, selectedCostCenters]);
  
  // Carregar dados quando parâmetros relevantes mudam
  useEffect(() => {
    loadDREData();
  }, [period, date, includeEstimates, compareWithPrevious, includeGestaoClick, selectedWallets, selectedCostCenters]);
  
  // Determinar qual visualização mostrar com base no período
  const renderContent = () => {
    if (isLoading) {
      return <DRELoadingSkeleton />;
    }
    
    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    if (!data) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sem dados</AlertTitle>
          <AlertDescription>
            Nenhum dado de DRE encontrado para o período selecionado.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <>
        {compareWithPrevious && data.comparison && (
          <DRESummary 
            data={data.comparison} 
            period={period} 
            showComparison 
          />
        )}
        
        {!compareWithPrevious && (
          <DRESummary 
            data={data} 
            period={period} 
            showComparison={false} 
          />
        )}
        
        {period === "month" && (
          <DREMonthlyView data={data} />
        )}
        
        {period === "year" && (
          <DREAnnualView data={data} />
        )}
      </>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start">
        <DREPeriodControl
          period={period}
          date={date}
          onPeriodChange={handlePeriodTypeChange}
          onDateChange={handleNavigatePeriod}
        />
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="includeEstimates"
              checked={includeEstimates}
              onCheckedChange={setIncludeEstimates}
            />
            <Label htmlFor="includeEstimates">
              Incluir Estimativas
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="compareWithPrevious"
              checked={compareWithPrevious}
              onCheckedChange={setCompareWithPrevious}
            />
            <Label htmlFor="compareWithPrevious">
              Comparativo
            </Label>
          </div>
          
          {hasGestaoClickIntegration && (
            <div className="flex items-center space-x-2">
              <Switch
                id="includeGestaoClick"
                checked={includeGestaoClick}
                onCheckedChange={setIncludeGestaoClick}
              />
              <Label htmlFor="includeGestaoClick">
                Gestão Click
              </Label>
            </div>
          )}
          
          <DREExport 
            data={data} 
            period={period}
            date={date}
          />
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[250px] shrink-0">
          <DREFilters
            wallets={wallets}
            costCenters={costCenters}
            selectedWallets={selectedWallets}
            selectedCostCenters={selectedCostCenters}
            onWalletsChange={setSelectedWallets}
            onCostCentersChange={setSelectedCostCenters}
          />
        </div>
        
        <div className="flex-1 space-y-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

/**
 * Componente de esqueleto para carregamento
 */
function DRELoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Esqueleto para os cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-8 w-[150px]" />
                <Skeleton className="h-4 w-[80px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Esqueleto para os tabs */}
      <Skeleton className="h-10 w-[300px]" />
      
      {/* Esqueleto para o conteúdo */}
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
