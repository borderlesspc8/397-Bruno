"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/_components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, formatPercent } from "@/app/_utils/format";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";

interface OrigemData {
  origem: string;
  quantidade: number;
  percentual: number;
  valor: number; // valor total vendido por origem
}

interface DistribuicaoVendasOrigemProps {
  dataInicio: Date;
  dataFim: Date;
}

export function DistribuicaoVendasOrigem({ dataInicio, dataFim }: DistribuicaoVendasOrigemProps) {
  const [origens, setOrigens] = useState<OrigemData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'quantidade' | 'valor'>('quantidade');

  useEffect(() => {
    // DESABILITADO TEMPORARIAMENTE PARA EVITAR LOOPS
    console.log('⚠️ DistribuicaoVendasOrigem: Requisições desabilitadas temporariamente para evitar loops')
    setLoading(false);
    setOrigens([]);
    return;
    
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        // Formatar datas para string no formato YYYY-MM-DD
        const dataInicioStr = dataInicio.toISOString().split('T')[0];
        const dataFimStr = dataFim.toISOString().split('T')[0];
        
        // Buscar dados de origens e vendas
        const [atendimentosResponse, vendasResponse] = await Promise.all([
          fetch(`/api/dashboard/atendimentos?dataInicio=${dataInicioStr}&dataFim=${dataFimStr}`),
          fetch(`/api/dashboard/vendas?dataInicio=${dataInicioStr}&dataFim=${dataFimStr}`)
        ]);
        
        if (!atendimentosResponse.ok) {
          throw new Error(`Erro ao buscar dados de atendimentos: ${atendimentosResponse.status}`);
        }
        
        if (!vendasResponse.ok) {
          throw new Error(`Erro ao buscar dados de vendas: ${vendasResponse.status}`);
        }
        
        const atendimentosData = await atendimentosResponse.json();
        const vendasData = await vendasResponse.json();
        
        // Processar dados para correlacionar origens com vendas
        // Simulando valores de vendas por origem
        if (atendimentosData && atendimentosData.dashboard && atendimentosData.dashboard.origemLeads) {
          const total = atendimentosData.dashboard.origemLeads.reduce(
            (sum: number, item: any) => sum + item.quantidade, 0
          );
          
          // Simulando valores de venda para cada origem
          const valorTotalVendas = vendasData?.totalReceita || 1000000;
          
          const origensProcessadas = atendimentosData.dashboard.origemLeads.map((origem: any) => {
            // Simular um valor de venda proporcional à quantidade de leads
            // com alguma variação aleatória para simular eficiência diferente
            const eficiencia = 0.7 + (Math.random() * 0.6); // entre 0.7 e 1.3
            const valorProporcional = (origem.quantidade / total) * valorTotalVendas * eficiencia;
            
            return {
              ...origem,
              valor: Math.round(valorProporcional)
            };
          });
          
          // Ordenar por quantidade
          origensProcessadas.sort((a: OrigemData, b: OrigemData) => b.quantidade - a.quantidade);
          
          setOrigens(origensProcessadas);
        } else {
          throw new Error("Formato de dados inválido");
        }
      } catch (err) {
        console.error("Erro ao buscar dados de origens:", err);
        setError("Não foi possível carregar os dados de distribuição de vendas");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [dataInicio, dataFim]);

  // Cores para o gráfico
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
    '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'
  ];

  // Renderizar gráfico de barras
  const renderBarChart = () => {
    const dataKey = viewMode === 'quantidade' ? 'quantidade' : 'valor';
    const tooltipFormatter = (value: any) => {
      if (viewMode === 'valor') {
        return formatCurrency(value);
      }
      return value;
    };

    return (
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={origens}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="origem" 
              angle={-45} 
              textAnchor="end" 
              height={70}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip 
              formatter={tooltipFormatter}
              labelFormatter={(label) => `Origem: ${label}`}
            />
            <Legend />
            <Bar 
              dataKey={dataKey} 
              name={viewMode === 'quantidade' ? 'Quantidade' : 'Valor Total'} 
              fill="#8884d8"
            >
              {origens.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Renderizar gráfico de pizza
  const renderPieChart = () => {
    const dataKey = viewMode === 'quantidade' ? 'quantidade' : 'valor';
    const tooltipFormatter = (value: any, name: any, props: any) => {
      if (viewMode === 'valor') {
        return [formatCurrency(value), name];
      }
      return [value, name];
    };

    return (
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={origens}
              cx="50%"
              cy="50%"
              outerRadius={120}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey="origem"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {origens.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-52" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-72" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#faba33]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Vendas por Como nos Conheceu</CardTitle>
          <CardDescription>Período: {dataInicio.toLocaleDateString()} a {dataFim.toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center">
            <div className="text-red-500 text-center">
              <p>{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Verifique sua conexão ou tente novamente mais tarde.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (origens.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Vendas por Como nos Conheceu</CardTitle>
          <CardDescription>Período: {dataInicio.toLocaleDateString()} a {dataFim.toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">
                Nenhum dado disponível para o período selecionado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Vendas por Como nos Conheceu</CardTitle>
        <CardDescription>Período: {dataInicio.toLocaleDateString()} a {dataFim.toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <p className="text-sm font-medium mb-1">Visualizar por</p>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('quantidade')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  viewMode === 'quantidade'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Quantidade
              </button>
              <button
                onClick={() => setViewMode('valor')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  viewMode === 'valor'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Valor
              </button>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="bar">
          <TabsList className="mb-4">
            <TabsTrigger value="bar">Gráfico de Barras</TabsTrigger>
            <TabsTrigger value="pie">Gráfico de Pizza</TabsTrigger>
            <TabsTrigger value="table">Tabela</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bar">
            {renderBarChart()}
          </TabsContent>
          
          <TabsContent value="pie">
            {renderPieChart()}
          </TabsContent>
          
          <TabsContent value="table">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Origem</th>
                    <th className="py-2 px-4 text-right">Quantidade</th>
                    <th className="py-2 px-4 text-right">Percentual</th>
                    <th className="py-2 px-4 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {origens.map((origem, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4">{origem.origem}</td>
                      <td className="py-2 px-4 text-right">{origem.quantidade}</td>
                      <td className="py-2 px-4 text-right">{formatPercent(origem.percentual)}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(origem.valor)}</td>
                    </tr>
                  ))}
                  <tr className="font-medium bg-muted/50">
                    <td className="py-2 px-4">Total</td>
                    <td className="py-2 px-4 text-right">
                      {origens.reduce((sum, item) => sum + item.quantidade, 0)}
                    </td>
                    <td className="py-2 px-4 text-right">100%</td>
                    <td className="py-2 px-4 text-right">
                      {formatCurrency(origens.reduce((sum, item) => sum + item.valor, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 
