"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { formatCurrency } from "@/app/_lib/utils";
import { useState } from "react";
import { ChevronDown, ChevronUp, Circle, Info } from "lucide-react";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
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
  LineChart,
  Line,
  ComposedChart
} from "recharts";

interface DREAnnualViewProps {
  data: any;
}

/**
 * Componente para visualização anual do DRE
 */
export function DREAnnualView({ data }: DREAnnualViewProps) {
  // Extrair dados dos meses
  const monthsData = data.months || [];
  const [activeTab, setActiveTab] = useState("tendencias");
  
  // Verifica se existem dados para o ano
  const hasData = monthsData.length > 0;
  
  // Preparar dados para os gráficos de tendências
  const prepareTrendsData = () => {
    return monthsData.map((month: any) => {
      const monthData = month.data.consolidated || month.data.contaRapida;
      return {
        month: month.label,
        receitas: monthData.revenue?.total || 0,
        despesas: monthData.expenses?.total || 0,
        resultado: monthData.netProfit || 0
      };
    });
  };
  
  // Preparar dados para análise de categorias ao longo do ano
  const prepareCategoryTrendsData = (isRevenue: boolean) => {
    // Primeiro, colete todas as categorias únicas
    const allCategories = new Set<string>();
    
    monthsData.forEach((month: any) => {
      const monthData = month.data.consolidated || month.data.contaRapida;
      const categories = isRevenue 
        ? monthData.revenue?.byCategory || []
        : monthData.expenses?.byCategory || [];
      
      categories.forEach((cat: any) => {
        allCategories.add(cat.name);
      });
    });
    
    // Depois, crie os dados para cada mês com todas as categorias
    return monthsData.map((month: any) => {
      const monthData = month.data.consolidated || month.data.contaRapida;
      const categories = isRevenue 
        ? monthData.revenue?.byCategory || []
        : monthData.expenses?.byCategory || [];
      
      const result: any = { month: month.label };
      
      // Inicializa todas as categorias como 0
      Array.from(allCategories).forEach(cat => {
        result[cat] = 0;
      });
      
      // Preenche os valores das categorias que existem neste mês
      categories.forEach((cat: any) => {
        result[cat.name] = cat.amount;
      });
      
      return result;
    });
  };
  
  // Calcular totais anuais
  const calculateAnnualTotals = () => {
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalProfit = 0;
    
    monthsData.forEach((month: any) => {
      const monthData = month.data.consolidated || month.data.contaRapida;
      totalRevenue += monthData.revenue?.total || 0;
      totalExpenses += monthData.expenses?.total || 0;
      totalProfit += monthData.netProfit || 0;
    });
    
    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: totalProfit,
      margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    };
  };
  
  // Calcular médias mensais
  const calculateMonthlyAverages = (totals: any) => {
    const monthCount = monthsData.length || 1; // Evitar divisão por zero
    
    return {
      revenue: totals.revenue / monthCount,
      expenses: totals.expenses / monthCount,
      profit: totals.profit / monthCount,
      margin: totals.margin // A margem já é uma porcentagem
    };
  };
  
  // Agrupar categorias por tipo (receita/despesa) e calcular totais anuais
  const getAnnualCategoriesTotal = (isRevenue: boolean) => {
    const categoriesMap = new Map<string, number>();
    
    monthsData.forEach((month: any) => {
      const monthData = month.data.consolidated || month.data.contaRapida;
      const categories = isRevenue 
        ? monthData.revenue?.byCategory || []
        : monthData.expenses?.byCategory || [];
      
      categories.forEach((cat: any) => {
        const current = categoriesMap.get(cat.name) || 0;
        categoriesMap.set(cat.name, current + cat.amount);
      });
    });
    
    // Converter para array e ordenar pelo valor
    return Array.from(categoriesMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  };
  
  // Cores para os gráficos
  const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", 
    "#8884D8", "#82CA9D", "#FF6B6B", "#6B66FF",
    "#FFD166", "#06D6A0", "#118AB2", "#073B4C"
  ];
  
  const EXPENSE_COLORS = ["#FF6B6B", "#FF8042", "#FFB347", "#FFD166"];
  const REVENUE_COLORS = ["#00C49F", "#0088FE", "#00BFFF", "#118AB2"];
  
  // Cálculos
  const annualTotals = calculateAnnualTotals();
  const monthlyAverages = calculateMonthlyAverages(annualTotals);
  const revenueCategories = getAnnualCategoriesTotal(true);
  const expenseCategories = getAnnualCategoriesTotal(false);
  
  // Se não houver dados, mostrar mensagem
  if (!hasData) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Não há dados disponíveis para o período</h2>
        <p className="text-muted-foreground">
          Selecione outro período ou verifique se há transações registradas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="tendencias">Tendências</TabsTrigger>
          <TabsTrigger value="anual">Resumo Anual</TabsTrigger>
          <TabsTrigger value="categorias">Categorias (Anual)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tendencias">
          <div className="grid grid-cols-1 gap-6">
            {/* Gráfico de tendências */}
            <Card>
              <CardHeader>
                <CardTitle>Tendências Mensais</CardTitle>
                <CardDescription>
                  Evolução de receitas, despesas e resultado ao longo do período
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={prepareTrendsData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), ""]} />
                    <Legend />
                    <Bar dataKey="receitas" name="Receitas" fill="#4CAF50" barSize={20} />
                    <Bar dataKey="despesas" name="Despesas" fill="#F44336" barSize={20} />
                    <Line 
                      type="monotone" 
                      dataKey="resultado" 
                      name="Resultado" 
                      stroke="#2196F3" 
                      strokeWidth={2}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Tabela de dados mensais */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento Mensal</CardTitle>
                <CardDescription>
                  Valores mensais de receitas, despesas e resultado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês</TableHead>
                        <TableHead className="text-right">Receitas</TableHead>
                        <TableHead className="text-right">Despesas</TableHead>
                        <TableHead className="text-right">Resultado</TableHead>
                        <TableHead className="text-right">Margem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthsData.map((month: any, index: number) => {
                        const monthData = month.data.consolidated || month.data.contaRapida;
                        const revenue = monthData.revenue?.total || 0;
                        const expenses = monthData.expenses?.total || 0;
                        const profit = monthData.netProfit || 0;
                        const margin = monthData.margin || 0;
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{month.label}</TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatCurrency(revenue)}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {formatCurrency(expenses)}
                            </TableCell>
                            <TableCell className={`text-right ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(profit)}
                            </TableCell>
                            <TableCell className={`text-right ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {margin.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      
                      {/* Linha de médias */}
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-bold">Média Mensal</TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {formatCurrency(monthlyAverages.revenue)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          {formatCurrency(monthlyAverages.expenses)}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${monthlyAverages.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(monthlyAverages.profit)}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${monthlyAverages.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {monthlyAverages.margin.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                      
                      {/* Linha de totais */}
                      <TableRow className="bg-primary/10">
                        <TableCell className="font-bold">Total Anual</TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {formatCurrency(annualTotals.revenue)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          {formatCurrency(annualTotals.expenses)}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${annualTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(annualTotals.profit)}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${annualTotals.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {annualTotals.margin.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="anual">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resumo Anual */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo Anual</CardTitle>
                <CardDescription>
                  Consolidado anual de receitas, despesas e resultado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8 py-4">
                  {/* Receitas */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <Circle className="h-3 w-3 mr-2 text-green-500" />
                      Receitas Totais
                    </h3>
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(annualTotals.revenue)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Média mensal: {formatCurrency(monthlyAverages.revenue)}
                    </div>
                  </div>
                  
                  {/* Despesas */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <Circle className="h-3 w-3 mr-2 text-red-500" />
                      Despesas Totais
                    </h3>
                    <div className="text-3xl font-bold text-red-600">
                      {formatCurrency(annualTotals.expenses)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Média mensal: {formatCurrency(monthlyAverages.expenses)}
                    </div>
                  </div>
                  
                  {/* Resultado */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <Circle className="h-3 w-3 mr-2 text-blue-500" />
                      Resultado Líquido
                    </h3>
                    <div className={`text-3xl font-bold ${annualTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(annualTotals.profit)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Margem: {annualTotals.margin.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Gráfico de Distribuição */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição Anual</CardTitle>
                <CardDescription>
                  Proporção de receitas e despesas no período
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[330px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Receitas", value: annualTotals.revenue },
                        { name: "Despesas", value: annualTotals.expenses }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#4CAF50" />
                      <Cell fill="#F44336" />
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(value as number), ""]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="categorias">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categorias de Receitas */}
            <Card>
              <CardHeader>
                <CardTitle>Receitas por Categoria (Anual)</CardTitle>
                <CardDescription>
                  Total anual por categoria de receita
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueCategories.map((category: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium flex items-center">
                            <Circle className="h-3 w-3 mr-2 text-green-500" />
                            {category.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(category.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {annualTotals.revenue > 0
                              ? ((category.amount / annualTotals.revenue) * 100).toFixed(2)
                              : "0.00"}%
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {revenueCategories.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Nenhuma receita registrada no período
                          </TableCell>
                        </TableRow>
                      )}
                      
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(annualTotals.revenue)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          100%
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Categorias de Despesas */}
            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria (Anual)</CardTitle>
                <CardDescription>
                  Total anual por categoria de despesa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseCategories.map((category: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium flex items-center">
                            <Circle className="h-3 w-3 mr-2 text-red-500" />
                            {category.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(category.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {annualTotals.expenses > 0
                              ? ((category.amount / annualTotals.expenses) * 100).toFixed(2)
                              : "0.00"}%
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {expenseCategories.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Nenhuma despesa registrada no período
                          </TableCell>
                        </TableRow>
                      )}
                      
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(annualTotals.expenses)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          100%
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
