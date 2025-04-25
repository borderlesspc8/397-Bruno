"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Clock, ListPlus, Loader2 } from "lucide-react";

import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";

interface Contribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
}

interface GoalContributionsProps {
  goalId: string;
}

export function GoalContributions({ goalId }: GoalContributionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [contributions, setContributions] = useState<Contribution[]>([]);

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/goals/${goalId}/contribute`);
        
        if (!response.ok) {
          throw new Error("Erro ao buscar contribuições");
        }
        
        const data = await response.json();
        setContributions(data);
      } catch (error) {
        console.error("Erro ao buscar contribuições:", error);
        toast.error("Erro ao carregar contribuições");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContributions();
  }, [goalId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totalContributed = contributions.reduce((total, contribution) => total + contribution.amount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Histórico de Contribuições</CardTitle>
          <CardDescription>
            Acompanhe todas as contribuições para esta meta
          </CardDescription>
        </div>
        <Button
          onClick={() => router.push(`/goals/${goalId}/contribute`)}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          <ListPlus className="h-4 w-4" />
          Nova
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-52">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : contributions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma contribuição encontrada
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Você ainda não adicionou nenhuma contribuição para esta meta.
              Adicione sua primeira contribuição para começar a rastrear seu progresso.
            </p>
            <Button onClick={() => router.push(`/goals/${goalId}/contribute`)}>
              Adicionar Contribuição
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-muted rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Contribuições</p>
                  <p className="text-xl font-bold">{formatCurrency(totalContributed)}</p>
                </div>
                <div>
                  <Badge variant="outline">{contributions.length} contribuições</Badge>
                </div>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="hidden md:table-cell">Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.map((contribution) => (
                    <TableRow key={contribution.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(contribution.date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(contribution.amount)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {contribution.note || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 