'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/app/_components/ui/use-toast';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/app/_components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/app/_components/ui/select';
import { Button } from '@/app/_components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import { ChevronLeft, ArrowUpDown, Download, LineChart, BarChart4, Printer } from 'lucide-react';
import { Skeleton } from '@/app/_components/ui/skeleton';
import { Badge } from '@/app/_components/ui/badge';
import { PageTitle } from '@/app/_components/page-title';
import { formatCurrency } from '@/app/_utils/format-currency';
import { Progress } from '@/app/_components/ui/progress';
import Link from 'next/link';
import { 
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartLineChart,
  Line
} from 'recharts';

// Definição de interfaces
interface MonthlyExpenseData {
  month: string;
  totalExpense: number;
  categories: CategoryExpense[];
}

interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
}

interface ComparisonData {
  months: MonthlyExpenseData[];
  categories: string[];
  differences: {
    [category: string]: number;
  };
  changePercentage: number;
  selectedMonthsData?: {
    firstMonth: MonthlyExpenseData | null;
    secondMonth: MonthlyExpenseData | null;
  };
}

// Cores para categorias
const categoryColors = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#10b981', '#6366f1', '#f43f5e', '#84cc16',
  '#14b8a6', '#8b5cf6', '#0ea5e9', '#d946ef', '#f97316'
];

// Função para obter cor para categoria
const getCategoryColor = (category: string, index: number) => {
  // Hash simples para alocar uma cor consistente para a mesma categoria
  const hash = category.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return categoryColors[Math.abs(hash) % categoryColors.length] || categoryColors[index % categoryColors.length];
};

export default function ComparisonPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [firstMonth, setFirstMonth] = useState<string>('');
  const [secondMonth, setSecondMonth] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  // Efeito para carregar os dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Carregar dados de comparação da API
        const response = await fetch('/api/reports/comparison');
        
        if (!response.ok) {
          throw new Error('Falha ao carregar dados de comparação');
        }
        
        const data = await response.json();
        
        // Verificar se temos dados suficientes
        if (!data.months || data.months.length === 0) {
          toast({
            variant: "destructive",
            title: "Sem dados disponíveis",
            description: "Não há transações suficientes para gerar um relatório de comparação."
          });
          setLoading(false);
          return;
        }
        
        // Ordenar meses cronologicamente para garantir ordem correta
        const months = data.months
          .map((month: MonthlyExpenseData) => month.month)
          .sort((a: string, b: string) => {
            // Formato esperado: YYYY-MM
            const [yearA, monthA] = a.split('-').map(Number);
            const [yearB, monthB] = b.split('-').map(Number);
            
            if (yearA !== yearB) return yearA - yearB;
            return monthA - monthB;
          });
          
        setAvailableMonths(months);
        
        // Definir meses padrão (últimos dois meses disponíveis)
        if (months.length >= 2) {
          const preLastMonth = months[months.length - 2];
          const lastMonth = months[months.length - 1];
          
          setFirstMonth(preLastMonth);
          setSecondMonth(lastMonth);
          
          // Pré-selecionar dados dos últimos dois meses
          data.selectedMonthsData = {
            firstMonth: data.months.find((m: MonthlyExpenseData) => m.month === preLastMonth) || null,
            secondMonth: data.months.find((m: MonthlyExpenseData) => m.month === lastMonth) || null,
          };
          
          setComparisonData(data);
        } else if (months.length === 1) {
          // Se houver apenas um mês, mostrar uma mensagem explicativa
          toast({
            variant: "default",
            title: "Dados limitados",
            description: "Você precisa ter transações em pelo menos dois meses diferentes para fazer uma comparação."
          });
          
          // Definir o único mês como primeiro e segundo para que o usuário possa ver pelo menos os dados desse mês
          setFirstMonth(months[0]);
          setSecondMonth(months[0]);
          setComparisonData(data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: "Não foi possível obter os dados de comparação. Tente novamente mais tarde."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  // Função para comparar meses selecionados
  const compareMonths = async () => {
    if (!firstMonth || !secondMonth) {
      toast({
        variant: "destructive",
        title: "Seleção incompleta",
        description: "Selecione dois meses para comparação."
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Obter dados de comparação específica
      const response = await fetch(`/api/reports/comparison?firstMonth=${firstMonth}&secondMonth=${secondMonth}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar comparação específica');
      }
      
      const data = await response.json();
      setComparisonData({
        ...comparisonData as ComparisonData,
        ...data,
        selectedMonthsData: {
          firstMonth: data.months.find((m: MonthlyExpenseData) => m.month === firstMonth) || null,
          secondMonth: data.months.find((m: MonthlyExpenseData) => m.month === secondMonth) || null,
        }
      });
    } catch (error) {
      console.error('Erro ao comparar meses:', error);
      toast({
        variant: "destructive",
        title: "Erro na comparação",
        description: "Não foi possível comparar os meses selecionados. Tente novamente."
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar nome do mês
  const formatMonthName = (monthStr: string) => {
    if (!monthStr) return '';
    
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      
      return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
    } catch (error) {
      console.error('Erro ao formatar nome do mês:', monthStr, error);
      return monthStr; // Retorna o próprio valor em caso de erro
    }
  };

  // Calcular variação percentual entre os meses
  const getVariationPercentage = () => {
    if (!comparisonData?.selectedMonthsData) return 0;
    
    const { firstMonth, secondMonth } = comparisonData.selectedMonthsData;
    if (!firstMonth || !secondMonth) return 0;
    
    const firstMonthTotal = firstMonth.totalExpense || 0;
    const secondMonthTotal = secondMonth.totalExpense || 0;
    
    if (firstMonthTotal === 0) return secondMonthTotal > 0 ? 100 : 0;
    
    return ((secondMonthTotal - firstMonthTotal) / firstMonthTotal) * 100;
  };

  const variationPercentage = getVariationPercentage();

  // Dados para o gráfico de comparação
  const getComparisonChartData = () => {
    if (!comparisonData?.selectedMonthsData) return [];
    
    const { firstMonth, secondMonth } = comparisonData.selectedMonthsData;
    if (!firstMonth || !secondMonth) return [];
    
    // Juntar categorias únicas dos dois meses
    const allCategories = Array.from(new Set([
      ...(firstMonth?.categories.map(c => c.category) || []),
      ...(secondMonth?.categories.map(c => c.category) || [])
    ]));
    
    // Preparar dados de forma simplificada sem usar chaves dinâmicas
    return allCategories.map(category => {
      const firstMonthCategory = firstMonth.categories.find(c => c.category === category);
      const secondMonthCategory = secondMonth.categories.find(c => c.category === category);
      
      const firstMonthAmount = Number(firstMonthCategory?.amount || 0);
      const secondMonthAmount = Number(secondMonthCategory?.amount || 0);
      const difference = secondMonthAmount - firstMonthAmount;
      
      return {
        name: category,
        firstMonthValue: firstMonthAmount,
        secondMonthValue: secondMonthAmount,
        firstMonthLabel: formatMonthName(firstMonth.month),
        secondMonthLabel: formatMonthName(secondMonth.month),
        difference
      };
    }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  };

  // Dados para o gráfico de tendência
  const getTrendChartData = () => {
    if (!comparisonData?.months) return [];
    
    return comparisonData.months.map(month => ({
      name: formatMonthName(month.month),
      despesas: month.totalExpense || 0,
    }));
  };

  // Renderizar conteúdo de carregamento
  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <PageTitle 
          title="Comparação Mensal"
          description="Compare seus gastos entre diferentes meses"
          backButton={{ href: "/dashboard", label: "Voltar para o Dashboard" }}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <PageTitle 
        title="Comparação Mensal"
        description="Compare seus gastos entre diferentes meses"
        backButton={{ href: "/dashboard", label: "Voltar para o Dashboard" }}
      />
      
      {/* Controles de seleção de mês */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selecione os meses para comparação</CardTitle>
          <CardDescription>Escolha dois meses para analisar a evolução de seus gastos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primeiro mês</label>
              <Select value={firstMonth} onValueChange={setFirstMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month) => (
                    <SelectItem key={`first-${month}`} value={month}>
                      {formatMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Segundo mês</label>
              <Select value={secondMonth} onValueChange={setSecondMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month) => (
                    <SelectItem key={`second-${month}`} value={month}>
                      {formatMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button onClick={compareMonths}>
              Comparar Meses
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Resumo da comparação */}
      {comparisonData?.selectedMonthsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-3">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Resumo da Comparação</CardTitle>
                <Badge 
                  className={variationPercentage === 0 
                    ? "bg-gray-500" 
                    : variationPercentage > 0 
                      ? "bg-red-500" 
                      : "bg-green-500"
                  }
                >
                  {variationPercentage === 0 
                    ? "Sem alteração" 
                    : variationPercentage > 0 
                      ? `+${variationPercentage.toFixed(2)}%` 
                      : `${variationPercentage.toFixed(2)}%`
                  }
                </Badge>
              </div>
              <CardDescription>
                Comparando {formatMonthName(firstMonth)} com {formatMonthName(secondMonth)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total de Despesas</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{formatMonthName(firstMonth)}</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(comparisonData.selectedMonthsData.firstMonth?.totalExpense || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{formatMonthName(secondMonth)}</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(comparisonData.selectedMonthsData.secondMonth?.totalExpense || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Variação</p>
                  <div>
                    <p className="text-xs text-muted-foreground">Diferença Absoluta</p>
                    <p className={`text-xl font-bold ${
                      variationPercentage === 0 
                        ? "text-gray-500" 
                        : variationPercentage > 0 
                          ? "text-red-500" 
                          : "text-green-500"
                    }`}>
                      {formatCurrency(
                        (comparisonData.selectedMonthsData.secondMonth?.totalExpense || 0) - 
                        (comparisonData.selectedMonthsData.firstMonth?.totalExpense || 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Gráficos de comparação */}
      {comparisonData?.selectedMonthsData && (
        <Tabs defaultValue="comparison" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="comparison">Por Categoria</TabsTrigger>
              <TabsTrigger value="trend">Tendência</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setChartType(chartType === 'bar' ? 'line' : 'bar')}
              >
                {chartType === 'bar' ? <LineChart className="h-4 w-4 mr-2" /> : <BarChart4 className="h-4 w-4 mr-2" />}
                {chartType === 'bar' ? 'Linha' : 'Barras'}
              </Button>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
          
          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparação por Categoria</CardTitle>
                <CardDescription>
                  Visualize a diferença de gastos por categoria entre {formatMonthName(firstMonth)} e {formatMonthName(secondMonth)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                      <BarChart
                        data={getComparisonChartData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })}
                        />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(Number(value)), '']}
                          labelFormatter={(label) => `Categoria: ${label}`}
                        />
                        <Legend />
                        <Bar 
                          dataKey="firstMonthValue" 
                          fill="#3b82f6" 
                          name={formatMonthName(firstMonth)}
                        />
                        <Bar 
                          dataKey="secondMonthValue" 
                          fill="#ef4444" 
                          name={formatMonthName(secondMonth)}
                        />
                      </BarChart>
                    ) : (
                      <RechartLineChart
                        data={getComparisonChartData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })}
                        />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(Number(value)), '']}
                          labelFormatter={(label) => `Categoria: ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="firstMonthValue" 
                          stroke="#3b82f6" 
                          name={formatMonthName(firstMonth)}
                          activeDot={{ r: 8 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="secondMonthValue" 
                          stroke="#ef4444" 
                          name={formatMonthName(secondMonth)}
                          activeDot={{ r: 8 }}
                        />
                      </RechartLineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Tabela de diferenças */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maiores Variações</CardTitle>
                <CardDescription>Categorias com as maiores diferenças entre os meses comparados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getComparisonChartData().slice(0, 5).map((item, index) => {
                    // Calcular a porcentagem de variação
                    let percentChange = 0;
                    if (item.firstMonthValue === 0) {
                      percentChange = item.secondMonthValue > 0 ? 100 : 0;
                    } else {
                      percentChange = ((item.secondMonthValue - item.firstMonthValue) / item.firstMonthValue) * 100;
                    }
                    
                    return (
                      <div key={`variation-${index}`} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{item.name}</span>
                          <Badge 
                            className={percentChange === 0 
                              ? "bg-gray-500" 
                              : percentChange > 0 
                                ? "bg-red-500" 
                                : "bg-green-500"
                            }
                          >
                            {percentChange === 0 
                              ? "Sem alteração" 
                              : percentChange > 0 
                                ? `+${percentChange.toFixed(2)}%` 
                                : `${percentChange.toFixed(2)}%`
                            }
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">{item.firstMonthLabel}</p>
                            <p>{formatCurrency(item.firstMonthValue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{item.secondMonthLabel}</p>
                            <p>{formatCurrency(item.secondMonthValue)}</p>
                          </div>
                        </div>
                        <Progress 
                          value={50 + (percentChange / 2)} 
                          className="h-2" 
                          indicatorClassName={percentChange === 0 
                            ? "bg-gray-500" 
                            : percentChange > 0 
                              ? "bg-red-500" 
                              : "bg-green-500"
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trend" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tendência de Gastos</CardTitle>
                <CardDescription>Evolução de suas despesas ao longo dos meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                      <BarChart
                        data={getTrendChartData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })}
                        />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value as number), '']}
                          labelFormatter={(label) => `Mês: ${label}`}
                        />
                        <Legend />
                        <Bar 
                          dataKey="despesas" 
                          fill="#ef4444" 
                          name="Total de Despesas"
                        />
                      </BarChart>
                    ) : (
                      <RechartLineChart
                        data={getTrendChartData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })}
                        />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value as number), '']}
                          labelFormatter={(label) => `Mês: ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="despesas" 
                          stroke="#ef4444" 
                          name="Total de Despesas"
                          activeDot={{ r: 8 }}
                        />
                      </RechartLineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      {/* Insights e recomendações */}
      {comparisonData?.selectedMonthsData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Insights e Recomendações</CardTitle>
            <CardDescription>Baseado na análise dos seus dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {variationPercentage > 10 && (
              <div className="p-4 border rounded-md bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
                <p className="font-medium text-red-800 dark:text-red-400">Seus gastos aumentaram significativamente</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Seus gastos em {formatMonthName(secondMonth)} foram {Math.abs(variationPercentage).toFixed(2)}% maiores que em {formatMonthName(firstMonth)}.
                  Recomendamos revisar as categorias com maior aumento.
                </p>
              </div>
            )}
            
            {variationPercentage < -10 && (
              <div className="p-4 border rounded-md bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                <p className="font-medium text-green-800 dark:text-green-400">Parabéns pela economia!</p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Seus gastos em {formatMonthName(secondMonth)} foram {Math.abs(variationPercentage).toFixed(2)}% menores que em {formatMonthName(firstMonth)}.
                  Continue mantendo esse controle sobre suas finanças.
                </p>
              </div>
            )}
            
            {/* Categorias com maiores variações */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Categorias para acompanhar:</h4>
              <ul className="space-y-2">
                {getComparisonChartData().slice(0, 3).map((item, index) => {
                  // Calcular a porcentagem de variação
                  let percentChange = 0;
                  if (item.firstMonthValue === 0) {
                    percentChange = item.secondMonthValue > 0 ? 100 : 0;
                  } else {
                    percentChange = ((item.secondMonthValue - item.firstMonthValue) / item.firstMonthValue) * 100;
                  }
                  
                  return (
                    <li key={`insight-${index}`} className="flex justify-between">
                      <span>{item.name}</span>
                      <span className={percentChange === 0 
                        ? "text-gray-500" 
                        : percentChange > 0 
                          ? "text-red-500" 
                          : "text-green-500"
                      }>
                        {percentChange === 0 
                          ? "Sem alteração" 
                          : percentChange > 0 
                            ? `+${percentChange.toFixed(2)}%` 
                            : `${percentChange.toFixed(2)}%`
                        }
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            
            {/* Recomendações personalizadas */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Recomendações:</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary p-1 rounded-full mt-0.5">
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                  <span>
                    Crie um orçamento para as categorias com maiores variações para ter melhor controle.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary p-1 rounded-full mt-0.5">
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                  <span>
                    Compare seus gastos com a média mensal para identificar meses atípicos.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary p-1 rounded-full mt-0.5">
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                  <span>
                    Use a função de orçamento para planejar melhor seus gastos nos próximos meses.
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/reports/expenses">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Relatório de Despesas
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/reports/categories">
                Relatório por Categorias
                <ChevronLeft className="h-4 w-4 ml-2 rotate-180" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 