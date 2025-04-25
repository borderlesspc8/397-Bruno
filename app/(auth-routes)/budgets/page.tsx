"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { PlusCircle, Filter, Search, PiggyBank, ChevronRight, ArrowUpDown } from "lucide-react";
import { Input } from "@/app/_components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { Progress } from "@/app/_components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { useToast } from "@/app/_components/ui/use-toast";
import { formatCurrency } from "@/app/_lib/formatters";
import { cn } from "@/app/_lib/utils";
import Link from "next/link";
import { format } from "date-fns";

interface Budget {
  id: string;
  title: string;
  description?: string;
  amount: number;
  period: string;
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  walletId?: string;
  colorAccent: string;
  iconName: string;
  spent?: number;
  remaining?: number;
  progress?: number;
  category?: {
    id: string;
    name: string;
    color: string;
  } | null;
  wallet?: {
    id: string;
    name: string;
  } | null;
  createdAt?: Date;
}

export default function BudgetsPage() {
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("progress");
  const [searchQuery, setSearchQuery] = useState("");

  // Carregar orçamentos
  useEffect(() => {
    async function loadBudgets() {
      try {
        setLoading(true);
        
        const response = await fetch("/api/budgets");
        
        if (!response.ok) {
          throw new Error("Falha ao carregar orçamentos");
        }
        
        const data = await response.json();
        
        // Os dados já vêm com os campos spent, remaining e progress calculados pela API
        setBudgets(data);
      } catch (error) {
        console.error("Erro ao carregar orçamentos:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os orçamentos",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadBudgets();
  }, [toast]);

  // Filtrar e ordenar orçamentos
  const filteredBudgets = budgets
    .filter(budget => {
      // Filtro de pesquisa
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          budget.title.toLowerCase().includes(query) ||
          (budget.description && budget.description.toLowerCase().includes(query)) ||
          (budget.category && budget.category.name.toLowerCase().includes(query))
        );
      }
      
      // Filtros por status
      switch (filter) {
        case "active":
          return !budget.endDate || new Date(budget.endDate) >= new Date();
        case "exceeded":
          return (budget.progress || 0) > 100;
        case "critical":
          return (budget.progress || 0) >= 80 && (budget.progress || 0) <= 100;
        case "safe":
          return (budget.progress || 0) < 80;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      // Ordenação
      switch (sortOrder) {
        case "amount":
          return b.amount - a.amount;
        case "progress":
          return (b.progress || 0) - (a.progress || 0);
        case "remaining":
          return (b.remaining || 0) - (a.remaining || 0);
        case "alphabetical":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  // Função para determinar a cor do progresso com base na porcentagem
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-yellow-600";
    if (progress >= 75) return "bg-yellow-500";
    return "bg-yellow-400";
  };

  // Calcular estatísticas de orçamento
  const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);
  const totalRemaining = budgets.reduce((sum, budget) => sum + (budget.remaining || 0), 0);
  const avgProgress = budgets.length 
    ? Math.round(budgets.reduce((sum, budget) => sum + (budget.progress || 0), 0) / budgets.length) 
    : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Meus Orçamentos</h1>
        <div className="flex items-center gap-2">
          <Link href="/budgets/new">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Novo Orçamento
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Estatísticas */}
      {!loading && budgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Orçado</p>
                <p className="text-2xl font-semibold">{formatCurrency(totalBudgeted)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Gasto</p>
                <p className="text-2xl font-semibold">{formatCurrency(totalSpent)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Restante</p>
                <p className="text-2xl font-semibold">{formatCurrency(totalRemaining)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Progresso Médio</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold">{avgProgress}%</p>
                  <Progress value={avgProgress} className="h-2 flex-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Filtros e pesquisa */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar orçamento" 
            className="pl-8" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="exceeded">Excedidos</SelectItem>
              <SelectItem value="critical">Críticos</SelectItem>
              <SelectItem value="safe">Seguros</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="progress">Progresso</SelectItem>
              <SelectItem value="amount">Valor</SelectItem>
              <SelectItem value="remaining">Restante</SelectItem>
              <SelectItem value="alphabetical">Alfabética</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Conteúdo da página */}
      <div className="space-y-4">
        {loading ? (
          // Skeletons de carregamento
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : filteredBudgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBudgets.map((budget) => (
              <Card 
                key={budget.id} 
                className="overflow-hidden group hover:shadow-md transition-all duration-300"
              >
                <div className="h-1 w-full" style={{ backgroundColor: budget.colorAccent }} />
                
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{budget.title}</CardTitle>
                    <div 
                      className="h-8 w-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${budget.colorAccent}30` }}
                    >
                      <PiggyBank 
                        className="h-4 w-4" 
                        style={{ color: budget.colorAccent }} 
                      />
                    </div>
                  </div>
                  
                  {budget.description && (
                    <CardDescription className="line-clamp-2">{budget.description}</CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="pb-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Orçado</span>
                    <span className="font-medium">{formatCurrency(budget.amount)}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Gasto {formatCurrency(budget.spent || 0)}
                      </span>
                      <span 
                        className={cn(
                          "text-xs font-medium rounded-full px-2 py-0.5",
                          (budget.progress || 0) >= 100 
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                            : (budget.progress || 0) >= 80 
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        )}
                      >
                        {budget.progress ? Math.round(budget.progress) : 0}%
                      </span>
                    </div>
                    
                    <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all", 
                          getProgressColor(budget.progress || 0)
                        )} 
                        style={{ width: `${Math.min(budget.progress || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  {budget.period && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {budget.period === "MONTHLY" 
                          ? "Mensal" 
                          : budget.period === "YEARLY" 
                            ? "Anual" 
                            : budget.period === "WEEKLY" 
                              ? "Semanal" 
                              : "Diário"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {budget.startDate && (
                          <>Iniciado em {format(new Date(budget.startDate), "dd/MM/yyyy")}</>
                        )}
                      </span>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="pt-0">
                  <Link href={`/budgets/${budget.id}`} className="w-full">
                    <Button 
                      variant="ghost" 
                      className="w-full text-xs justify-between hover:bg-secondary/30 transition-colors group"
                    >
                      <span>Ver detalhes</span>
                      <ChevronRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="w-full p-6 py-10 flex flex-col items-center justify-center">
            <PiggyBank className="h-12 w-12 text-muted-foreground/40 mb-4" />
            
            {searchQuery ? (
              <p className="text-center text-muted-foreground">
                Nenhum orçamento encontrado para <span className="font-medium">"{searchQuery}"</span>
              </p>
            ) : (
              <>
                <p className="text-center text-muted-foreground mb-4">
                  Você ainda não possui orçamentos cadastrados
                </p>
                <Link href="/budgets/new">
                  <Button className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Criar Orçamento
                  </Button>
                </Link>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
} 