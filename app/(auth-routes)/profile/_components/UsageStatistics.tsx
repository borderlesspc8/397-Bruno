"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  Calendar, 
  Wallet, 
  CreditCard, 
  ArrowUpDown,
  Loader2,
  RefreshCw
} from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Progress } from "@/app/_components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";

// Tipos para as estatísticas de uso
interface UsageStats {
  transactionsCount: number;
  transactionsLimit: number;
  walletsCount: number;
  walletsLimit: number;
  apiCallsCount: number;
  apiCallsLimit: number;
  storageUsed: number; // em MB
  storageLimit: number; // em MB
  lastSync: string; // ISO date string
  monthlyActivity: {
    month: string;
    transactions: number;
    apiCalls: number;
  }[];
  featureUsage: {
    feature: string;
    usageCount: number;
    percentage: number;
  }[];
}

// Dados mockados (em uma aplicação real viriam da API)
const mockUsageStats: UsageStats = {
  transactionsCount: 156,
  transactionsLimit: 500,
  walletsCount: 3,
  walletsLimit: 5,
  apiCallsCount: 287,
  apiCallsLimit: 1000,
  storageUsed: 24.5,
  storageLimit: 100,
  lastSync: "2023-05-15T14:30:00Z",
  monthlyActivity: [
    { month: "Jan", transactions: 42, apiCalls: 98 },
    { month: "Fev", transactions: 38, apiCalls: 87 },
    { month: "Mar", transactions: 55, apiCalls: 120 },
    { month: "Abr", transactions: 47, apiCalls: 110 },
    { month: "Mai", transactions: 32, apiCalls: 95 },
    { month: "Jun", transactions: 0, apiCalls: 0 }
  ],
  featureUsage: [
    { feature: "Sincronização Bancária", usageCount: 45, percentage: 28 },
    { feature: "Relatórios", usageCount: 32, percentage: 20 },
    { feature: "Categorização", usageCount: 28, percentage: 18 },
    { feature: "Busca de Transações", usageCount: 25, percentage: 16 },
    { feature: "Exportação de Dados", usageCount: 18, percentage: 11 },
    { feature: "Outros", usageCount: 12, percentage: 7 }
  ]
};

interface UsageStatisticsProps {
  user: any;
  userProfile: any;
}

export default function UsageStatistics({ user, userProfile }: UsageStatisticsProps) {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Simula o carregamento de dados da API
  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        // Em uma aplicação real, buscar da API:
        // const response = await fetch(`/api/user/usage-stats?timeRange=${timeRange}`);
        // const data = await response.json();
        
        // Usando dados mockados para simulação
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUsageStats(mockUsageStats);
      } catch (error) {
        console.error("Erro ao buscar estatísticas de uso:", error);
        toast.error("Erro ao carregar estatísticas de uso");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsageStats();
  }, [timeRange]);
  
  const refreshStats = async () => {
    setIsLoading(true);
    try {
      // Em uma aplicação real, buscar da API:
      // const response = await fetch(`/api/user/usage-stats?timeRange=${timeRange}&refresh=true`);
      // const data = await response.json();
      
      // Usando dados mockados para simulação
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUsageStats(mockUsageStats);
      toast.success("Estatísticas atualizadas");
    } catch (error) {
      toast.error("Erro ao atualizar estatísticas");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Formata a data da última sincronização
  const formatLastSync = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calcula a porcentagem de uso
  const calculatePercentage = (used: number, limit: number) => {
    return Math.min(Math.round((used / limit) * 100), 100);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!usageStats) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground mb-4">Não foi possível carregar as estatísticas de uso</p>
        <Button variant="outline" onClick={refreshStats}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Cabeçalho com seletor de período e botão de atualização */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Estatísticas de Uso</h3>
          <p className="text-sm text-muted-foreground">
            Última atualização: {formatLastSync(usageStats.lastSync)}
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select 
            value={timeRange} 
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={refreshStats}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Tabs para diferentes visualizações */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
          <TabsTrigger value="features">Recursos</TabsTrigger>
        </TabsList>
        
        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transações */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Transações
                </CardTitle>
                <CardDescription>
                  {usageStats.transactionsCount} de {usageStats.transactionsLimit} transações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={calculatePercentage(usageStats.transactionsCount, usageStats.transactionsLimit)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {calculatePercentage(usageStats.transactionsCount, usageStats.transactionsLimit)}% do limite utilizado
                </p>
              </CardContent>
            </Card>
            
            {/* Carteiras */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Wallet className="mr-2 h-4 w-4" />
                  Carteiras
                </CardTitle>
                <CardDescription>
                  {usageStats.walletsCount} de {usageStats.walletsLimit} carteiras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={calculatePercentage(usageStats.walletsCount, usageStats.walletsLimit)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {calculatePercentage(usageStats.walletsCount, usageStats.walletsLimit)}% do limite utilizado
                </p>
              </CardContent>
            </Card>
            
            {/* Chamadas de API */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <LineChart className="mr-2 h-4 w-4" />
                  Chamadas de API
                </CardTitle>
                <CardDescription>
                  {usageStats.apiCallsCount} de {usageStats.apiCallsLimit} chamadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={calculatePercentage(usageStats.apiCallsCount, usageStats.apiCallsLimit)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {calculatePercentage(usageStats.apiCallsCount, usageStats.apiCallsLimit)}% do limite utilizado
                </p>
              </CardContent>
            </Card>
            
            {/* Armazenamento */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Armazenamento
                </CardTitle>
                <CardDescription>
                  {usageStats.storageUsed} MB de {usageStats.storageLimit} MB
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={calculatePercentage(usageStats.storageUsed, usageStats.storageLimit)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {calculatePercentage(usageStats.storageUsed, usageStats.storageLimit)}% do limite utilizado
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Informações do Plano */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                Seu Plano: {userProfile?.subscription?.plan || 'Free'}
              </CardTitle>
              <CardDescription>
                Detalhes do seu plano atual e limites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Transações mensais:</span>
                  <span className="text-sm font-medium">{usageStats.transactionsLimit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Carteiras conectadas:</span>
                  <span className="text-sm font-medium">{usageStats.walletsLimit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Chamadas de API:</span>
                  <span className="text-sm font-medium">{usageStats.apiCallsLimit} / mês</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Armazenamento:</span>
                  <span className="text-sm font-medium">{usageStats.storageLimit} MB</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = "/subscription"}>
                Gerenciar Plano
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Atividade */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atividade Mensal</CardTitle>
              <CardDescription>
                Transações e chamadas de API nos últimos meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {/* Aqui entraria um gráfico real com biblioteca como Chart.js ou Recharts */}
                <div className="h-full w-full bg-muted rounded-md flex items-center justify-center">
                  <div className="text-center p-4">
                    <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Gráfico de Atividade Mensal
                    </p>
                    <p className="text-xs text-muted-foreground">
                      (Simulado - Em uma implementação real, um gráfico interativo seria exibido aqui)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Mês</span>
                  <div className="flex gap-8">
                    <span>Transações</span>
                    <span>Chamadas API</span>
                  </div>
                </div>
                
                {usageStats.monthlyActivity.map((month) => (
                  <div key={month.month} className="flex justify-between text-sm border-b pb-2">
                    <span>{month.month}</span>
                    <div className="flex gap-8">
                      <span className="w-16 text-right">{month.transactions}</span>
                      <span className="w-16 text-right">{month.apiCalls}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Recursos */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Uso de Recursos</CardTitle>
              <CardDescription>
                Quais recursos você mais utiliza
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-[200px] w-full">
                  {/* Aqui entraria um gráfico de pizza real */}
                  <div className="h-full w-full bg-muted rounded-md flex items-center justify-center">
                    <div className="text-center p-4">
                      <PieChart className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Gráfico de Uso de Recursos
                      </p>
                      <p className="text-xs text-muted-foreground">
                        (Simulado)
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {usageStats.featureUsage.map((feature) => (
                    <div key={feature.feature} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{feature.feature}</span>
                        <span>{feature.percentage}%</span>
                      </div>
                      <Progress value={feature.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recomendações</CardTitle>
              <CardDescription>
                Baseado no seu uso, aqui estão algumas recomendações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-1">Explore a categorização automática</h4>
                  <p className="text-sm text-muted-foreground">
                    Você pode economizar tempo usando nossa categorização automática de transações.
                  </p>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-1">Conecte mais bancos</h4>
                  <p className="text-sm text-muted-foreground">
                    Seu plano permite conectar mais {usageStats.walletsLimit - usageStats.walletsCount} carteiras.
                  </p>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-1">Experimente os relatórios avançados</h4>
                  <p className="text-sm text-muted-foreground">
                    Obtenha insights mais profundos sobre suas finanças com nossos relatórios avançados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 