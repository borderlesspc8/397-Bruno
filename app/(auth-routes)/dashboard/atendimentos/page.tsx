"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { useToast } from "@/app/_components/ui/use-toast";
import { DateRange } from "react-day-picker";
import { format, subMonths } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency, formatPercent } from "@/app/_utils/format";
import { TwoColumnSkeleton, SingleCardSkeleton } from "@/app/(auth-routes)/dashboard/_components/loading-skeletons";

// Tipos
interface DashboardData {
  dashboard: {
    totais: {
      atendimentos: number;
      conversoes: number;
      taxaConversao: number;
      tempoMedioResposta: number;
      taxaAbandono: number;
    };
    canais: Array<{
      canal: string;
      quantidade: number;
      percentual: number;
    }>;
    consultores: Array<{
      id: string;
      nome: string;
      atendimentos: number;
      conversoes: number;
      taxaConversao: number;
    }>;
    origemLeads: Array<{
      origem: string;
      quantidade: number;
      percentual: number;
    }>;
    avisos?: string[];
  };
}

// Cores para os gráficos
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD", "#85C1E9"];

export default function DashboardAtendimentos() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  async function fetchDashboardData() {
    try {
      setIsLoading(true);
      
      if (!dateRange?.from || !dateRange?.to) return;
      
      const dataInicio = format(dateRange.from, 'yyyy-MM-dd');
      const dataFim = format(dateRange.to, 'yyyy-MM-dd');
      
      const response = await fetch(`/api/dashboard/atendimentos?dataInicio=${dataInicio}&dataFim=${dataFim}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar dados do dashboard');
      }
      
      const data = await response.json();
      setDashboardData(data);
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar os dados do dashboard",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const renderDashboardSummary = () => {
    if (!dashboardData?.dashboard.totais) return null;
    
    const { totais } = dashboardData.dashboard;
    
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-center">
            <div className="flex flex-col">
              <span className="text-lg font-semibold">Atendimentos</span>
              <span className="text-3xl font-bold">{totais.atendimentos}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold">Conversões</span>
              <span className="text-3xl font-bold">{totais.conversoes}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold">Taxa de Conversão</span>
              <span className="text-3xl font-bold">{formatPercent(totais.taxaConversao)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold">Tempo Resposta</span>
              <span className="text-3xl font-bold">{totais.tempoMedioResposta} min</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold">Taxa de Abandono</span>
              <span className="text-3xl font-bold">{formatPercent(totais.taxaAbandono)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCanaisTab = () => {
    const canais = dashboardData?.dashboard.canais || [];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gráfico de Canais de Atendimento */}
        <Card>
          <CardHeader>
            <CardTitle>Atendimentos por Canal</CardTitle>
            <CardDescription>
              Distribuição de atendimentos por canal de comunicação
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {canais.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={canais}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="quantidade"
                    nameKey="canal"
                  >
                    {canais.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip 
                    formatter={(value, name, props) => [`${value} atendimentos`, props.payload.canal]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Nenhum dado disponível para o período</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Tabela de Canais */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Canal</CardTitle>
            <CardDescription>
              Quantidade e percentual de atendimentos por canal
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canais.length > 0 ? (
              <div className="space-y-4">
                {canais.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.canal}</span>
                      <span className="text-sm font-medium">{item.quantidade} atendimentos</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 dark:bg-gray-700">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${item.percentual * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {formatPercent(item.percentual)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-muted-foreground">Nenhum dado disponível para o período</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderConsultoresTab = () => {
    const consultores = dashboardData?.dashboard.consultores || [];
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Desempenho de Consultores</CardTitle>
          <CardDescription>
            Taxa de conversão e atendimentos por consultor
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {consultores.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={consultores}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 70,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nome" 
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "taxaConversao") return [formatPercent(value as number), "Taxa de Conversão"];
                    return [value, name === "atendimentos" ? "Atendimentos" : "Conversões"];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="atendimentos" name="Atendimentos" fill="#8884d8" />
                <Bar yAxisId="left" dataKey="conversoes" name="Conversões" fill="#82ca9d" />
                <Bar yAxisId="right" dataKey="taxaConversao" name="Taxa de Conversão" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Nenhum dado disponível para o período</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderPerformanceTab = () => {
    const origemLeads = dashboardData?.dashboard.origemLeads || [];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gráfico de Origem de Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Origem de Leads</CardTitle>
            <CardDescription>
              Distribuição de atendimentos por origem
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {origemLeads.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={origemLeads}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="quantidade"
                    nameKey="origem"
                  >
                    {origemLeads.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip 
                    formatter={(value, name, props) => [`${value} leads`, props.payload.origem]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Nenhum dado disponível para o período</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Tabela de Origem de Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Origem</CardTitle>
            <CardDescription>
              Quantidade e percentual de leads por origem
            </CardDescription>
          </CardHeader>
          <CardContent>
            {origemLeads.length > 0 ? (
              <div className="space-y-4">
                {origemLeads.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.origem}</span>
                      <span className="text-sm font-medium">{item.quantidade} leads</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 dark:bg-gray-700">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${item.percentual * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {formatPercent(item.percentual)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-muted-foreground">Nenhum dado disponível para o período</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com informações do dashboard */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard de Atendimentos</h2>
        <p className="text-muted-foreground">
          Visualize estatísticas de atendimentos, conversões, canais e desempenho de consultores.
        </p>
      </div>
      
      {/* Avisos */}
      {dashboardData?.dashboard.avisos && dashboardData.dashboard.avisos.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 dark:bg-yellow-900/30">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Atenção</h3>
              <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-200">
                <ul className="list-disc pl-5 space-y-1">
                  {dashboardData.dashboard.avisos.map((aviso, index) => (
                    <li key={index}>{aviso}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Conteúdo principal do dashboard */}
      <div className="space-y-6">
        {/* Dashboard Summary */}
        {isLoading ? (
          <SingleCardSkeleton height="112px" />
        ) : (
          renderDashboardSummary()
        )}
        
        {/* Tabs com diferentes visões */}
        <div>
          <div className="border-b mb-4">
            <nav className="-mb-px flex space-x-8">
              <a
                href="#canais"
                className="border-primary text-primary py-4 px-1 border-b-2 font-medium text-sm"
              >
                Canais
              </a>
              <a
                href="#consultores"
                className="border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 py-4 px-1 border-b-2 font-medium text-sm"
              >
                Consultores
              </a>
              <a
                href="#performance"
                className="border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 py-4 px-1 border-b-2 font-medium text-sm"
              >
                Performance
              </a>
            </nav>
          </div>
          
          {/* Conteúdo das tabs */}
          <div id="canais" className="space-y-4">
            {isLoading ? (
              <TwoColumnSkeleton />
            ) : (
              renderCanaisTab()
            )}
          </div>
          
          <div id="consultores" className="space-y-4 mt-8">
            <h3 className="text-xl font-semibold">Performance de Consultores</h3>
            {isLoading ? (
              <SingleCardSkeleton height="400px" />
            ) : (
              renderConsultoresTab()
            )}
          </div>
          
          <div id="performance" className="space-y-4 mt-8">
            <h3 className="text-xl font-semibold">Análise de Performance</h3>
            {isLoading ? (
              <TwoColumnSkeleton />
            ) : (
              renderPerformanceTab()
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 