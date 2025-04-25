"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, CreditCard } from "lucide-react";

import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog";

interface GoalDetailsProps {
  goal: {
    id: string;
    title: string;
    description: string | null;
    targetAmount: number;
    currentAmount: number;
    category: string;
    targetDate: Date;
    status: string;
    colorAccent: string | null;
    iconName: string | null;
  };
}

export function GoalDetails({ goal }: GoalDetailsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-blue-500";
      case "COMPLETED":
        return "bg-green-500";
      case "CANCELED":
        return "bg-gray-500";
      case "OVERDUE":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "Em Progresso";
      case "COMPLETED":
        return "Concluída";
      case "CANCELED":
        return "Cancelada";
      case "OVERDUE":
        return "Atrasada";
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "EMERGENCY_FUND":
        return "Fundo de Emergência";
      case "RETIREMENT":
        return "Aposentadoria";
      case "VACATION":
        return "Férias";
      case "EDUCATION":
        return "Educação";
      case "HOME":
        return "Casa";
      case "CAR":
        return "Carro";
      case "WEDDING":
        return "Casamento";
      case "DEBT_PAYMENT":
        return "Pagamento de Dívidas";
      case "INVESTMENT":
        return "Investimento";
      case "OTHER":
        return "Outro";
      default:
        return category;
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/goals/${goal.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir meta");
      }

      toast.success("Meta excluída com sucesso!");
      router.push("/goals");
      router.refresh();
    } catch (error) {
      console.error("Erro ao excluir meta:", error);
      toast.error("Erro ao excluir meta. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isCompleted = goal.status === "COMPLETED";
  const progressPercentage = calculateProgress(goal.currentAmount, goal.targetAmount);
  const remainingAmount = goal.targetAmount - goal.currentAmount;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundColor: goal.colorAccent || "#4F46E5",
          }}
        />
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className={getStatusColor(goal.status)}>
              {getStatusLabel(goal.status)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {format(goal.targetDate, "PPP", { locale: ptBR })}
            </span>
          </div>
          <CardTitle>{goal.title}</CardTitle>
          {goal.description && <CardDescription>{goal.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">
                {formatCurrency(goal.currentAmount)} de{" "}
                {formatCurrency(goal.targetAmount)}
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {Math.round(progressPercentage)}%
              </span>
              <span>{getCategoryLabel(goal.category)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 flex-wrap">
          {!isCompleted && (
            <Button
              variant="default"
              className="gap-2"
              onClick={() => router.push(`/goals/${goal.id}/contribute`)}
            >
              <CreditCard className="h-4 w-4" />
              Adicionar Contribuição
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push(`/goals/${goal.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Meta</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta meta? Esta ação não pode ser
                  desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Meta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-1">Categoria</h3>
            <p className="text-sm text-muted-foreground">
              {getCategoryLabel(goal.category)}
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Valor Alvo</h3>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(goal.targetAmount)}
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Valor Atual</h3>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(goal.currentAmount)}
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Valor Restante</h3>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(remainingAmount)}
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Data Alvo</h3>
            <p className="text-sm text-muted-foreground">
              {format(goal.targetDate, "PPP", { locale: ptBR })}
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Status</h3>
            <p className="text-sm text-muted-foreground">
              {getStatusLabel(goal.status)}
            </p>
          </div>
          {goal.description && (
            <div>
              <h3 className="font-medium mb-1">Descrição</h3>
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 