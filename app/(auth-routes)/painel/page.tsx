import { redirect } from "next/navigation";
import { isMatch, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getDashboard } from "@/app/_data/get-dashboard";
import TimeSelect from "@/app/_components/time-select";
import AiReportButton from "@/app/(auth-routes)/dashboard/_components/ai-report-button";
import SummaryCards from "@/app/_components/summary-cards";
import { BudgetSummary } from "./_components/BudgetSummary";
import { getAuthSession } from "@/app/_lib/auth";
import { 
  PlusCircle, 
  ArrowDownUp, 
  LineChart, 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  Bell, 
  ChevronRight,
  Filter,
  RefreshCcw,
  Search,
  Sparkles,
  Loader2,
  PiggyBank
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";
import { Input } from "@/app/_components/ui/input";
import { getMonthName } from "@/app/(auth-routes)/dashboard/_components/utils";
import { Progress } from "@/app/_components/ui/progress";


interface HomeProps {
  searchParams: {
    month: string;
    year: string;
  };
}

const Home = async ({ searchParams: { month, year } }: HomeProps) => {
  const { user } = await getAuthSession();
  
  if (!user) {
    return null;
  }
  
  const monthIsInvalid = !month || !isMatch(month, "MM");
  const yearIsInvalid = !year || !isMatch(year, "yyyy");
  if (monthIsInvalid || yearIsInvalid) {
    if (monthIsInvalid) {
      redirect(`?month=${new Date().getMonth() + 1}`);
    }
    
    redirect(`?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
  }
  
  const dashboard = await getDashboard(month, year);
  
  // Formatando o mês atual para exibição
  const formattedMonth = format(new Date(`${year}-${month}-01`), 'MMMM yyyy', { locale: ptBR });
  
  // Progress
  const expenseProgress = dashboard?.depositsTotal && dashboard?.expensesTotal 
    ? Math.min(Math.round((dashboard.expensesTotal / dashboard.depositsTotal) * 100), 100)
    : 0;
  
  // Função auxiliar para verificar se um valor numérico é válido e positivo
  const isValidNumber = (value: any): boolean => {
    return typeof value === 'number' && !isNaN(value);
  };

  // Função para formatar valores monetários
  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'R$ 0,00';
    }
    return `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  };

  // Função para calcular porcentagem com tratamento de erros
  const calculatePercentage = (value: number | undefined | null, total: number | undefined | null): number => {
    if (!value || !total || total === 0) return 0;
    return Math.round((value / total) * 100);
  };
  
  return (
    <div className="flex-1 space-y-4 pb-8 max-w-7xl mx-auto">
      {/* Cabeçalho do Dashboard com Boas-vindas Personalizadas */}
      <div className="flex flex-col lg:flex-row justify-between gap-3 bg-gradient-to-br from-card/60 to-background rounded-lg p-4 shadow-sm border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Olá, {user.name?.split(' ')[0] || 'usuário'}
            </h1>
            {isPremium && (
              <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700">
                <Sparkles className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Aqui está um resumo financeiro para <span className="font-medium capitalize">{formattedMonth}</span>
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 lg:items-start">
          <TimeSelect />
          
          {userCanAddTransaction && (
            <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-md transition-all duration-200 hover:shadow-lg">
              <PlusCircle className="h-4 w-4" />
                Nova Transação
              </Button>
          )}
        </div>
      </div>

      {/* Cards de resumo com dados reais da aplicação */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 border-none relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/10 dark:to-transparent opacity-60 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <div className="rounded-full p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <PlusCircle className="h-4 w-4" />
            </div>
            </CardHeader>
          <CardContent className="relative z-10 pt-0">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(dashboard?.depositsTotal)}
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">Total de entradas</p>
              {dashboard?.monthOverMonthData && (
                <Badge variant="outline" className={`bg-green-50 dark:bg-green-900/20 ${dashboard?.monthOverMonthData?.depositsChange >= 0 ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                  {dashboard?.monthOverMonthData?.depositsChange >= 0 ? '+' : ''}{dashboard?.monthOverMonthData?.depositsChange}%
                </Badge>
              )}
              </div>
            </CardContent>
          </Card>

        <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 border-none relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent dark:from-red-950/10 dark:to-transparent opacity-60 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <div className="rounded-full p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <ArrowDownUp className="h-4 w-4" />
            </div>
            </CardHeader>
          <CardContent className="relative z-10 pt-0">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(dashboard?.expensesTotal)}
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">Total de saídas</p>
              {dashboard?.monthOverMonthData && (
                <Badge variant="outline" className={`bg-red-50 dark:bg-red-900/20 ${dashboard?.monthOverMonthData?.expensesChange <= 0 ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                  {dashboard?.monthOverMonthData?.expensesChange >= 0 ? '+' : ''}{dashboard?.monthOverMonthData?.expensesChange}%
                </Badge>
              )}
              </div>
            </CardContent>
          </Card>

        <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 border-none relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/10 dark:to-transparent opacity-60 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <div className="rounded-full p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <LineChart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-0">
            <div className={`text-2xl font-bold ${(dashboard?.balance ?? 0) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(dashboard?.balance)}
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
              {dashboard?.monthOverMonthData && (
                <Badge variant="outline" className={`
                  ${dashboard?.monthOverMonthData?.balanceChange >= 0
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'}
                `}>
                  {dashboard?.monthOverMonthData?.balanceChange >= 0 ? '+' : ''}{dashboard?.monthOverMonthData?.balanceChange}%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 border-none relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-950/10 dark:to-transparent opacity-60 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Carteiras</CardTitle>
            <div className="rounded-full p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-0">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {dashboard?.walletsData ? dashboard.walletsData.total : 0}
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                {dashboard?.walletsData?.bankWallets 
                  ? `${dashboard.walletsData.bankWallets} bancárias, ${dashboard.walletsData.manualWallets} manuais` 
                  : 'Nenhuma carteira conectada'}
              </p>
              <Link href="/wallets">
                <Button variant="ghost" className="h-7 text-xs px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100/50">
                  Gerenciar
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Barra de progresso de gastos - apenas se houver dados de receitas e despesas */}
      {isValidNumber(dashboard?.depositsTotal) && isValidNumber(dashboard?.expensesTotal) && (
        <Card className="p-4 border-none overflow-hidden group hover:shadow-md transition-all duration-300 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-card to-background opacity-60 group-hover:opacity-100 transition-opacity"></div>
          <div className="space-y-2 relative z-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Progresso de Gastos do Mês</p>
                <Badge 
                  variant="outline" 
                  className={`text-xs font-normal ${
                    expenseProgress < 50 
                      ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                      : expenseProgress < 80 
                        ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' 
                        : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                  }`}
                >
                  {expenseProgress}% utilizado
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(dashboard?.expensesTotal)} de {formatCurrency(dashboard?.depositsTotal)}
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  expenseProgress < 50 ? 'bg-green-500 dark:bg-green-400' : 
                  expenseProgress < 80 ? 'bg-amber-500 dark:bg-amber-400' : 
                  'bg-red-500 dark:bg-red-400'
                }`} 
                style={{ width: `${expenseProgress}%`, transition: "width 1s ease-in-out" }}
              ></div>
            </div>
            <div className="flex justify-between">
              <p className="text-xs text-muted-foreground">
                {expenseProgress < 50 
                  ? 'Seus gastos estão sob controle.' 
                  : expenseProgress < 80 
                    ? 'Monitore seus gastos com atenção.' 
                    : 'Alerta: Gastos excedendo receitas!'}
              </p>
              <Link href="/reports/expenses">
                <Button variant="ghost" className="h-6 text-xs px-2 -mt-1">
                  Detalhes
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
          </Card>
      )}
      
      {/* Resumo dos Orçamentos */}
      <BudgetSummary />
      
      {/* Contenção condicional para exibir mensagem quando não houver dados */}
      {(!dashboard || (!dashboard.depositsTotal && !dashboard.expensesTotal)) && (
        <Card className="p-8 text-center">
            <CardContent>
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full p-3 bg-muted">
                <LineChart className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Sem dados financeiros</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Parece que você ainda não possui transações registradas para este período. Adicione transações para visualizar seus dados financeiros.
              </p>
              <Link href="/transactions/new" className="mt-3">
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Adicionar Transação
                </Button>
              </Link>
            </div>
            </CardContent>
          </Card>
      )}
      
      {/* Seção de Comparação Mês a Mês e Progresso do Orçamento - Mostrar apenas se existirem dados */}
      {dashboard && dashboard.monthOverMonthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Card de Comparação Mês a Mês */}
          <Card className="border-none overflow-hidden group hover:shadow-md transition-all duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-card to-background opacity-60 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="relative z-10 pb-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium">Comparação Mês a Mês</CardTitle>
                  <CardDescription>Variação com relação ao mês anterior</CardDescription>
                </div>
                <Badge variant="outline" className="font-normal bg-background/80">
                  <RefreshCcw className="h-3 w-3 mr-1 animate-spin-slow" />
                  Atualizado
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pb-2">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">Receitas</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm font-bold ${dashboard?.monthOverMonthData?.depositsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {dashboard?.monthOverMonthData?.depositsChange >= 0 ? '+' : ''}
                      {dashboard?.monthOverMonthData?.depositsChange}%
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium">Despesas</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm font-bold ${dashboard?.monthOverMonthData?.expensesChange <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {dashboard?.monthOverMonthData?.expensesChange >= 0 ? '+' : ''}
                      {dashboard?.monthOverMonthData?.expensesChange}%
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium">Saldo</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm font-bold ${dashboard?.monthOverMonthData?.balanceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {dashboard?.monthOverMonthData?.balanceChange >= 0 ? '+' : ''}
                      {dashboard?.monthOverMonthData?.balanceChange}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="relative z-10 pt-2 pb-3">
              <Link href="/reports/comparison">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs justify-between hover:bg-background/80 transition-colors group"
                >
                  <span>Ver análise completa</span>
                  <ChevronRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          {/* Card de Progresso do Orçamento */}
          <Card className="border-none overflow-hidden group hover:shadow-md transition-all duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-card to-background opacity-60 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="relative z-10 pb-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium">Progresso do Orçamento</CardTitle>
                  <CardDescription>Utilização do orçamento mensal</CardDescription>
                </div>
                <Badge variant="outline" className="font-normal bg-background/80">
                  <PiggyBank className="h-3 w-3 mr-1" />
                  {dashboard?.budgetProgress?.total > 0 ? 'Ativo' : 'Sem orçamento'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pb-2">
              {dashboard?.budgetProgress?.total > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{dashboard?.budgetProgress?.percentage}%</span>
                  </div>
                  <Progress 
                    value={dashboard?.budgetProgress?.percentage} 
                    className="h-2"
                  />
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-muted/40 rounded-md p-2">
                      <p className="text-xs text-muted-foreground">Orçamento Total</p>
                      <p className="font-medium">{formatCurrency(dashboard?.budgetProgress?.total)}</p>
                    </div>
                    <div className="bg-muted/40 rounded-md p-2">
                      <p className="text-xs text-muted-foreground">Utilizado</p>
                      <p className="font-medium">{formatCurrency(dashboard?.budgetProgress?.used)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 space-y-2">
                  <PiggyBank className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground text-center">
                    Você ainda não possui orçamentos configurados para este mês.
                  </p>
                  <Button variant="outline" size="sm" asChild className="mt-2">
                    <Link href="/budgets/new">Criar Orçamento</Link>
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="relative z-10 pt-2 pb-3">
              <Link href="/budgets">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs justify-between hover:bg-background/80 transition-colors group"
                >
                  <span>Gerenciar orçamentos</span>
                  <ChevronRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      )}
      
      {/* Tabs com design melhorado - apenas mostrar se existirem dados */}
      {dashboard && (
        (typeof dashboard.depositsTotal === 'number' && dashboard.depositsTotal > 0) || 
        (typeof dashboard.expensesTotal === 'number' && dashboard.expensesTotal > 0)
      ) && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted/40 p-1 h-auto shadow-inner">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm py-2 transition-all"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm py-2 transition-all"
            >
              Transações
            </TabsTrigger>
            <TabsTrigger 
              value="analysis" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm py-2 transition-all"
            >
              Análise
            </TabsTrigger>
          </TabsList>
          
          {/* Conteúdo da Tab "Visão Geral" com cards refinados */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cartão de distribuição por tipo com design refinado - verificar se há dados */}
              {dashboard && dashboard.typesPercentage && Object.keys(dashboard.typesPercentage).length > 0 ? (
                <Card className="border-none overflow-hidden group hover:shadow-md transition-all duration-300 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-card to-background opacity-60 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="relative z-10 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-medium">Distribuição por Tipo</CardTitle>
                        <CardDescription>Proporção entre receitas e despesas</CardDescription>
                      </div>
                      <Badge variant="outline" className="font-normal bg-background/80">
                        <RefreshCcw className="h-3 w-3 mr-1 animate-spin-slow" />
                        Atualizado
                      </Badge>
        </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
          <div className="text-center text-muted-foreground">
            <p>Gráfico de transações não disponível</p>
          </div>
                  </CardContent>
                  <CardFooter className="relative z-10 pt-0 pb-3">
                    <Link href="/reports/distribution">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs justify-between hover:bg-background/80 transition-colors group"
                      >
                        <span>Ver análise detalhada</span>
                        <ChevronRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ) : (
                <Card className="border-none overflow-hidden bg-muted/10">
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Distribuição por Tipo</CardTitle>
                    <CardDescription>Dados insuficientes para exibir o gráfico</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <div className="text-muted-foreground">
                      <LineChart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm text-center">Adicione mais transações para visualizar a distribuição</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Cartão de despesas por categoria com design refinado - verificar se há dados de categorias */}
              {dashboard && dashboard.totalExpensePerCategory && dashboard.totalExpensePerCategory.length > 0 ? (
                <Card className="border-none overflow-hidden group hover:shadow-md transition-all duration-300 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-card to-background opacity-60 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="relative z-10 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-medium">Despesas por Categoria</CardTitle>
                        <CardDescription>Principais categorias de gastos</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-background/60 transition-colors"
                        >
                          <Filter className="h-4 w-4" />
                          <span className="sr-only">Filtrar categorias</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
          <div className="text-center text-muted-foreground">
            <p>Gráfico de categorias não disponível</p>
          </div>
                  </CardContent>
                  <CardFooter className="relative z-10 pt-0 pb-3">
                    <Link href="/reports/categories">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs justify-between hover:bg-background/80 transition-colors group"
                      >
                        <span>Ver todas as categorias</span>
                        <ChevronRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ) : (
                <Card className="border-none overflow-hidden bg-muted/10">
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Despesas por Categoria</CardTitle>
                    <CardDescription>Dados insuficientes para exibir o gráfico</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <div className="text-muted-foreground">
                      <LineChart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm text-center">Adicione transações com categorias para visualizar os dados</p>
                    </div>
                  </CardContent>
                </Card>
              )}
        </div>
        
            
          </TabsContent>
          
          {/* Mantendo o resto das tabs conforme estava */}
          <TabsContent value="transactions" className="space-y-4 mt-6">
            <Card className="shadow-sm border-none bg-card/80">
              <CardHeader className="pb-3 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle>Todas as Transações</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-grow md:flex-grow-0">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Buscar transação" 
                        className="pl-8 h-9 bg-background focus-visible:ring-primary/30 min-w-[200px]"
                      />
                    </div>
                    <Button variant="outline" className="h-9 gap-1 bg-background">
                      <Filter className="h-4 w-4" />
                      <span>Filtros</span>
                    </Button>
                    <Button className="h-9 gap-1">
                      <PlusCircle className="h-4 w-4" />
                      <span>Nova</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-center text-muted-foreground p-8">
                  <p>Lista de transações não disponível</p>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Lista de transações não disponível
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled className="h-8">
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" className="h-8">
                    Próximo
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-4 mt-6">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Insights Financeiros</CardTitle>
                  <CardDescription>Análises baseadas em seus dados financeiros</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12">
                    <LineChart className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground text-center">
                      Análise de padrões financeiros
                    </p>
                    <p className="text-sm text-muted-foreground text-center mt-1">
                      Seus dados financeiros serão analisados para fornecer insights valiosos
                    </p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href={`/reports/patterns?month=${month}`}>
                        Analisar meus dados
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Seção de Carteiras */}
              {dashboard?.walletsData && dashboard.walletsData.total > 0 && (
                <Card className="border-none overflow-hidden group hover:shadow-md transition-all duration-300 relative mt-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-card to-background opacity-60 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="relative z-10 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-medium">Suas Carteiras</CardTitle>
                        <CardDescription>
                          Total: {dashboard.walletsData.total} | 
                          Saldo: {formatCurrency(dashboard.walletsData.balance)}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="font-normal bg-background/80">
                        <Wallet className="h-3 w-3 mr-1" />
                        {dashboard.walletsData.positiveWallets} positivas
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10 pb-6">
                    <div className="space-y-4">
                      {/* Estatísticas Gerais */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted/30 p-2 rounded-lg">
                          <p className="text-xs text-muted-foreground">Bancárias</p>
                          <p className="font-medium">{dashboard.walletsData.bankWallets}</p>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-lg">
                          <p className="text-xs text-muted-foreground">Manuais</p>
                          <p className="font-medium">{dashboard.walletsData.manualWallets}</p>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-lg">
                          <p className="text-xs text-muted-foreground">Dinheiro</p>
                          <p className="font-medium">{dashboard.walletsData.cashWallets}</p>
                        </div>
                      </div>
                      
                      {/* Principais Carteiras */}
                      <div className="bg-muted/20 p-3 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Principais Carteiras</h4>
                        <div className="space-y-3">
                          {dashboard.walletsData.topWallets.map((wallet: any) => (
                            <div key={wallet.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {wallet.bank?.logo ? (
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={wallet.bank.logo} alt={wallet.bank.name} />
                                    <AvatarFallback>{wallet.name.slice(0, 2)}</AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Wallet className="h-3 w-3 text-primary" />
                                  </div>
                                )}
                                <span className="text-sm font-medium">{wallet.name}</span>
                              </div>
                              <span className={`text-sm font-medium ${wallet.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(wallet.balance)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="relative z-10 pb-3">
                    <Link href="/wallets">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs justify-between hover:bg-background/80 transition-colors group"
                      >
                        <span>Gerenciar carteiras</span>
                        <ChevronRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              )}
              
              <AiReportButton month={month} />
            </div>
          </TabsContent>
        </Tabs>
      )}
      
      {/* Seção de dicas financeiras com design refinado */}
      <Card className="border-none overflow-hidden group hover:shadow-md transition-all duration-300 relative bg-gradient-to-r from-primary/5 via-background to-primary/5">
        <CardHeader className="pb-2 pt-4 relative z-10">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Dica Financeira
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 relative z-10">
          <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary/20 pl-3">
            "Reserve de 10% a 15% da sua renda para emergências. Tente manter um fundo que cubra pelo menos 3 a 6 meses de despesas básicas."
          </blockquote>
        </CardContent>
      </Card>
      
      {/* Nova seção: Suas Carteiras */}
      {dashboard?.walletsData?.total !== undefined && dashboard.walletsData.total > 0 && (
        <Card className="border-none overflow-hidden group hover:shadow-md transition-all duration-300 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-950/10 dark:to-transparent opacity-60 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="relative z-10 pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium">Suas Carteiras</CardTitle>
                <CardDescription>Visualize seus saldos por carteira</CardDescription>
              </div>
              <Link href="/wallets">
                <Button variant="outline" size="sm" className="h-8 gap-1 hover:bg-background/60">
                  <Wallet className="h-3 w-3" />
                  <span className="text-xs">Ver todas</span>
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 p-0">
            <div className="divide-y">
              {dashboard?.walletsData?.topWallets?.map((wallet: any) => (
                <div key={wallet.id} className="flex items-center justify-between py-3 px-6 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {wallet.bank?.logo ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-background">
                        <img 
                          src={wallet.bank.logo} 
                          alt={wallet.bank.name} 
                          className="w-6 h-6 object-contain" 
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                        <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{wallet.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {wallet.type === "BANK_INTEGRATION" 
                          ? wallet.bank?.name || "Banco" 
                          : wallet.type === "CASH" 
                            ? "Dinheiro físico" 
                            : "Carteira manual"}
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${wallet.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(wallet.balance)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="relative z-10 pt-0 pb-3 border-t">
            <div className="w-full flex items-center justify-between py-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Saldo total</span>
                <span className="text-xs text-muted-foreground">
                  {dashboard?.walletsData?.total || 0} carteiras
                </span>
              </div>
              <div className={`text-lg font-bold ${(dashboard?.walletsData?.balance || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(dashboard?.walletsData?.balance || 0)}
              </div>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};


export default Home;
