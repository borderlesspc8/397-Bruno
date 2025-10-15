import { useEffect, useState } from "react";
import { useToast } from "@/app/_components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Progress } from "@/app/_components/ui/progress";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { formatCurrency } from "@/app/_lib/formatters";
import { PencilIcon, TrashIcon, AlertCircleIcon, ChartPieIcon } from "lucide-react";
import { BudgetFormModal } from "./BudgetFormModal";
import { useWallet } from "@/app/_hooks/useWallet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/app/_components/ui/alert-dialog";
import { DropdownMenuItem } from "@/app/_components/ui/dropdown-menu";
import Link from "next/link";

// Tipo para o orçamento
type Budget = {
  id: string;
  title: string;
  description: string;
  amount: number;
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  categoryId: string | null;
  walletId: string;
  startDate: string | null;
  endDate: string | null;
  colorAccent: string;
  iconName: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
  wallet: {
    id: string;
    name: string;
  };
  // Campos calculados que vêm da API
  spent: number;
  remaining: number;
  progress: number;
};

export function BudgetList() {
  const { toast } = useToast();
  const { selectedWallet } = useWallet();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Carregar orçamentos
  useEffect(() => {
    async function loadBudgets() {
      try {
        setLoading(true);
        const url = selectedWallet 
          ? `/api/budgets?walletId=${selectedWallet.id}` 
          : "/api/budgets";
        
        const response = await fetch(url);
        
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
  }, [selectedWallet, toast]);

  // Função para editar orçamento
  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  // Função para excluir orçamento
  const handleDelete = async () => {
    if (!deletingBudget) return;
    
    try {
      const response = await fetch(`/api/budgets?id=${deletingBudget.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Falha ao excluir orçamento");
      }
      
      // Remover orçamento da lista
      setBudgets(budgets.filter(b => b.id !== deletingBudget.id));
      
      toast({
        title: "Sucesso",
        description: "Orçamento excluído com sucesso",
      });
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o orçamento",
        variant: "destructive",
      });
    } finally {
      setDeletingBudget(null);
      setIsDeleteDialogOpen(false);
    }
  };

  // Função para confirmar exclusão
  const confirmDelete = (budget: Budget) => {
    setDeletingBudget(budget);
    setIsDeleteDialogOpen(true);
  };

  // Renderizar esqueletos durante o carregamento
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="pb-2">
              <Skeleton className="h-16 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // Renderizar mensagem quando não há orçamentos
  if (budgets.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-6 text-center">
        <AlertCircleIcon className="mb-2 h-10 w-10 text-muted-foreground" />
        <CardTitle className="mb-2">Nenhum orçamento encontrado</CardTitle>
        <CardDescription>
          Você ainda não criou nenhum orçamento. Clique em "Novo Orçamento" para começar.
        </CardDescription>
      </Card>
    );
  }

  // Função para formatar o período
  const formatPeriod = (period: string) => {
    const periods: Record<string, string> = {
      DAILY: "Diário",
      WEEKLY: "Semanal",
      MONTHLY: "Mensal",
      YEARLY: "Anual",
    };
    
    return periods[period] || period;
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => (
          <Card key={budget.id} className="overflow-hidden">
            <CardHeader 
              className="pb-2"
              style={{ borderBottom: `2px solid ${budget.colorAccent || "#6366F1"}` }}
            >
              <div className="flex items-center justify-between">
                <CardTitle>{budget.title}</CardTitle>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleEdit(budget)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <DropdownMenuItem asChild>
                    <Link href={`/budgets/${budget.id}/report`} className="cursor-pointer">
                      <ChartPieIcon className="mr-2 h-4 w-4" />
                      <span>Ver Relatório</span>
                    </Link>
                  </DropdownMenuItem>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => confirmDelete(budget)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {budget.description || `Orçamento ${formatPeriod(budget.period).toLowerCase()}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2 pt-4">
              <div className="mb-2 flex items-end justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Orçamento</p>
                  <p className="text-xl font-bold">{formatCurrency(budget.amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Gasto</p>
                  <p className="text-xl font-bold">{formatCurrency(budget.spent)}</p>
                </div>
              </div>
              <div className="mb-1">
                <Progress value={budget.progress} className="h-2" />
              </div>
              <div className="flex justify-between text-sm">
                <span>{budget.progress.toFixed(0)}% utilizado</span>
                <span>{formatCurrency(budget.remaining)} restante</span>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 px-6 py-3">
              <div className="flex w-full items-center justify-between text-sm">
                <span>
                  {budget.category ? (
                    <span 
                      className="inline-block rounded-full px-2 py-1 text-xs" 
                      style={{ 
                        backgroundColor: `${budget.category.color}20`,
                        color: budget.category.color 
                      }}
                    >
                      {budget.category.name}
                    </span>
                  ) : (
                    "Todas as categorias"
                  )}
                </span>
                <span className="text-muted-foreground">{formatPeriod(budget.period)}</span>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Modal de edição */}
      <BudgetFormModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }} 
        budget={editingBudget}
      />

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 
