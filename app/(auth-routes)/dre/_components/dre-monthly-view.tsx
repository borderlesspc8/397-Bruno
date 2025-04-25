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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/_components/ui/accordion";
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
  Line
} from "recharts";

interface DREMonthlyViewProps {
  data: any;
}

/**
 * Componente para visualização mensal do DRE
 */
export function DREMonthlyView({ data }: DREMonthlyViewProps) {
  // Extrair dados consolidados se disponíveis, senão usar dados da ContaRápida
  const dreData = data.consolidated || data.contaRapida;
  const [activeTab, setActiveTab] = useState("tabela");
  
  // Obter dados
  const revenue = dreData.revenue || { total: 0, byCategory: [], byWallet: [], byCostCenter: [] };
  const expenses = dreData.expenses || { total: 0, byCategory: [], byWallet: [], byCostCenter: [] };
  const grossProfit = dreData.grossProfit || 0;
  const netProfit = dreData.netProfit || 0;
  const margin = dreData.margin || 0;
  
  // Preparar dados para os gráficos
  const prepareCategoriesToChart = () => {
    const revenueCategories = revenue.byCategory.map((cat: any) => ({
      name: cat.name,
      value: Number(cat.amount),
      type: "Receita"
    }));
    
    const expenseCategories = expenses.byCategory.map((cat: any) => ({
      name: cat.name,
      value: Number(cat.amount),
      type: "Despesa"
    }));
    
    return [...revenueCategories, ...expenseCategories];
  };
  
  const prepareComparativeChart = () => {
    return [
      { name: "Receitas", valor: revenue.total },
      { name: "Despesas", valor: expenses.total },
      { name: "Lucro Bruto", valor: grossProfit },
      { name: "Lucro Líquido", valor: netProfit }
    ];
  };
  
  // Cores para os gráficos
  const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", 
    "#8884D8", "#82CA9D", "#FF6B6B", "#6B66FF",
    "#FFD166", "#06D6A0", "#118AB2", "#073B4C"
  ];
  
  const EXPENSE_COLORS = ["#FF6B6B", "#FF8042", "#FFB347", "#FFD166"];
  const REVENUE_COLORS = ["#00C49F", "#0088FE", "#00BFFF", "#118AB2"];
  
  // Formatador para os valores nos gráficos
  const formatTooltipValue = (value: number) => {
    return formatCurrency(value);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="tabela">Tabela</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tabela">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resumo de Receitas */}
            <Card>
              <CardHeader>
                <CardTitle>Receitas</CardTitle>
                <CardDescription>
                  Detalhamento das receitas por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenue.byCategory.map((category: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium flex items-center">
                            <Circle className="h-3 w-3 mr-2 text-green-500" />
                            {category.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(category.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {revenue.total > 0
                              ? ((category.amount / revenue.total) * 100).toFixed(2)
                              : "0.00"}%
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {revenue.byCategory.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Nenhuma receita registrada no período
                          </TableCell>
                        </TableRow>
                      )}
                      
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(revenue.total)}
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
            
            {/* Resumo de Despesas */}
            <Card>
              <CardHeader>
                <CardTitle>Despesas</CardTitle>
                <CardDescription>
                  Detalhamento das despesas por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.byCategory.map((category: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium flex items-center">
                            <Circle className="h-3 w-3 mr-2 text-red-500" />
                            {category.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(category.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {expenses.total > 0
                              ? ((category.amount / expenses.total) * 100).toFixed(2)
                              : "0.00"}%
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {expenses.byCategory.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Nenhuma despesa registrada no período
                          </TableCell>
                        </TableRow>
                      )}
                      
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(expenses.total)}
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
        
        <TabsContent value="graficos">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de barras comparativo */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
                <CardDescription>
                  Comparativo entre receitas, despesas e resultado
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareComparativeChart()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), "Valor"]} />
                    <Legend />
                    <Bar 
                      dataKey="valor" 
                      name="Valor" 
                      fill="#8884d8"
                      isAnimationActive={true}
                      barSize={60}
                    >
                      {prepareComparativeChart().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.name === "Receitas" ? "#4CAF50" :
                            entry.name === "Despesas" ? "#F44336" :
                            entry.name === "Lucro Bruto" ? "#2196F3" : "#9C27B0"
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Gráficos de pizza */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Categoria</CardTitle>
                <CardDescription>
                  Proporção de cada categoria no total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="receitas">
                  <TabsList className="mb-4 grid grid-cols-2">
                    <TabsTrigger value="receitas">Receitas</TabsTrigger>
                    <TabsTrigger value="despesas">Despesas</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="receitas" className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revenue.byCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                          nameKey="name"
                          isAnimationActive={true}
                        >
                          {revenue.byCategory.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={REVENUE_COLORS[index % REVENUE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [formatCurrency(value as number), "Valor"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  
                  <TabsContent value="despesas" className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenses.byCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                          nameKey="name"
                          isAnimationActive={true}
                        >
                          {expenses.byCategory.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [formatCurrency(value as number), "Valor"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="detalhes">
          <div className="grid grid-cols-1 gap-6">
            {/* Detalhes por carteira */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Carteira</CardTitle>
                <CardDescription>
                  Receitas e despesas separadas por carteira
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Carteira</TableHead>
                      <TableHead className="text-right">Receitas</TableHead>
                      <TableHead className="text-right">Despesas</TableHead>
                      <TableHead className="text-right">Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Combinar carteiras de receitas e despesas */}
                    {Array.from(new Set([
                      ...revenue.byWallet.map((w: any) => w.id),
                      ...expenses.byWallet.map((w: any) => w.id)
                    ])).map((walletId: string) => {
                      const walletRevenue = revenue.byWallet.find((w: any) => w.id === walletId);
                      const walletExpense = expenses.byWallet.find((w: any) => w.id === walletId);
                      
                      const walletName = walletRevenue?.name || walletExpense?.name || "Desconhecido";
                      const revenueAmount = walletRevenue?.amount || 0;
                      const expenseAmount = walletExpense?.amount || 0;
                      const result = revenueAmount - expenseAmount;
                      
                      return (
                        <TableRow key={walletId}>
                          <TableCell className="font-medium">{walletName}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(revenueAmount)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(expenseAmount)}
                          </TableCell>
                          <TableCell className={`text-right ${result >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(result)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(revenue.total)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        {formatCurrency(expenses.total)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(netProfit)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* Detalhes por centro de custo */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Centro de Custo</CardTitle>
                <CardDescription>
                  Receitas e despesas separadas por centro de custo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Centro de Custo</TableHead>
                      <TableHead className="text-right">Receitas</TableHead>
                      <TableHead className="text-right">Despesas</TableHead>
                      <TableHead className="text-right">Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Combinar centros de custo de receitas e despesas */}
                    {Array.from(new Set([
                      ...revenue.byCostCenter.map((cc: any) => cc.id),
                      ...expenses.byCostCenter.map((cc: any) => cc.id)
                    ])).map((costCenterId: string) => {
                      const ccRevenue = revenue.byCostCenter.find((cc: any) => cc.id === costCenterId);
                      const ccExpense = expenses.byCostCenter.find((cc: any) => cc.id === costCenterId);
                      
                      const ccName = ccRevenue?.name || ccExpense?.name || "Não categorizado";
                      const revenueAmount = ccRevenue?.amount || 0;
                      const expenseAmount = ccExpense?.amount || 0;
                      const result = revenueAmount - expenseAmount;
                      
                      return (
                        <TableRow key={costCenterId}>
                          <TableCell className="font-medium">{ccName}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(revenueAmount)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(expenseAmount)}
                          </TableCell>
                          <TableCell className={`text-right ${result >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(result)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(revenue.total)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        {formatCurrency(expenses.total)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(netProfit)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 