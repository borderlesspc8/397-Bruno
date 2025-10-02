import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/_lib/prisma";
import { CashFlowView } from "@/app/_components/cash-flow/CashFlowView";
import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { CashFlowPredictionForm } from "@/app/_components/cash-flow/CashFlowPredictionForm";
import { PlusIcon } from "lucide-react";
import { SalesPreviewModal } from "@/app/_components/cash-flow/SalesPreviewModal";

export const metadata: Metadata = {
  title: "Fluxo de Caixa | Conta Rápida",
  description: "Visualize e gerencie seu fluxo de caixa com previsões de receitas e despesas",
};

export default async function CashFlowPage() {
  const user = await getCurrentUser();

  if (!user) {
      redirect("/auth");
  }

  // Recuperar carteiras do usuário
  const wallets = await prisma.wallet.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      name: 'asc',
    },
    select: {
      id: true,
      name: true,
    }
  });

  // Verificar se o usuário tem pelo menos uma carteira
  if (wallets.length === 0) {
    redirect("/wallets?message=É necessário ter pelo menos uma carteira para acessar o fluxo de caixa");
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie suas finanças com previsões futuras
          </p>
        </div>
        <div className="flex gap-2">
          <SalesPreviewModal 
            wallets={wallets}
            defaultWalletId={wallets[0]?.id}
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nova Previsão
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar Previsão</DialogTitle>
                <DialogDescription>
                  Adicione uma nova previsão de receita ou despesa ao seu fluxo de caixa
                </DialogDescription>
              </DialogHeader>
              <CashFlowPredictionForm
                wallets={wallets}
                defaultWalletId={wallets[0]?.id}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <CashFlowView 
        showFilters={true} 
        initialGroupBy="month"
      />
    </div>
  );
} 