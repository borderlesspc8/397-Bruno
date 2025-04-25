"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Plus, CreditCard, Wallet, DownloadCloud, PlusCircle, RefreshCw } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import CreateWalletModal from "@/app/_components/modals/create-wallet-modal";
import { ImportWalletsModal } from "@/app/_components/gestao-click/ImportWalletsModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/_components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/_components/ui/dropdown-menu";
import { toast } from "sonner";

interface WalletActionsProps {
  userId: string;
  type?: "card" | "button";
  walletId?: string;
  showGestaoClickSync?: boolean;
}

export function WalletActions({ userId, type = "button", walletId, showGestaoClickSync = false }: WalletActionsProps) {
  const [openNewWallet, setOpenNewWallet] = useState(false);
  const [openImportWallets, setOpenImportWallets] = useState(false);
  const [selectedWalletType, setSelectedWalletType] = useState<"MANUAL" | "BANK_INTEGRATION" | null>(null);
  const [isSyncingGestaoClick, setIsSyncingGestaoClick] = useState(false);

  const handleWalletTypeSelect = (type: "MANUAL" | "BANK_INTEGRATION" | "GESTAO_CLICK") => {
    if (type === "GESTAO_CLICK") {
      setOpenImportWallets(true);
    } else {
      setSelectedWalletType(type);
      setOpenNewWallet(true);
    }
  };

  // Função para sincronizar uma carteira do Gestão Click
  const syncGestaoClickWallet = async () => {
    if (!walletId) {
      toast.error("ID da carteira não encontrado");
      return;
    }

    try {
      setIsSyncingGestaoClick(true);
      toast.loading("Sincronizando novas transações do Gestão Click...");

      const response = await fetch(`/api/gestao-click/sync-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ walletId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao sincronizar carteira');
      }

      const result = await response.json();

      // Mostrar resultado da sincronização
      if (result.success) {
        const { newTransactions } = result;
        
        if (newTransactions > 0) {
          toast.success(
            `${newTransactions} novas transações importadas`,
            { description: 'A carteira foi atualizada com sucesso' }
          );
        } else {
          toast.info(
            'Carteira já sincronizada',
            { description: 'Não há novas transações para importar' }
          );
        }
      }
    } catch (error: any) {
      console.error("Erro ao sincronizar carteira:", error);
      toast.error("Falha na sincronização", {
        description: error.message || "Ocorreu um erro ao sincronizar com o Gestão Click"
      });
    } finally {
      setIsSyncingGestaoClick(false);
      toast.dismiss();
    }
  };

  if (type === "card") {
    return (
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full h-auto py-4 px-4 justify-start flex flex-col items-start gap-2 border-dashed"
          onClick={() => handleWalletTypeSelect("MANUAL")}
        >
          <Plus className="h-5 w-5" />
          <div className="text-left space-y-1">
            <h3 className="font-medium">Nova carteira</h3>
            <p className="text-xs text-muted-foreground">
              Crie uma nova carteira manual
            </p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="w-full h-auto py-4 px-4 justify-start flex flex-col items-start gap-2 border-dashed"
          asChild
        >
          <Link href="/wallets/bank-connect">
            <CreditCard className="h-5 w-5" />
            <div className="text-left space-y-1">
              <h3 className="font-medium">Conectar Banco</h3>
              <p className="text-xs text-muted-foreground">
                Integre com seu banco automaticamente
              </p>
            </div>
          </Link>
        </Button>

        <Button
          variant="outline"
          className="w-full h-auto py-4 px-4 justify-start flex flex-col items-start gap-2 border-dashed"
          onClick={() => setOpenImportWallets(true)}
        >
          <Database className="h-5 w-5" />
          <div className="text-left space-y-1">
            <h3 className="font-medium">Importar do Gestão Click</h3>
            <p className="text-xs text-muted-foreground">
              Importe carteiras e transações automaticamente
            </p>
          </div>
        </Button>

        <CreateWalletModal
          existingWallet={undefined}
          isOpen={openNewWallet}
          onOpenChange={setOpenNewWallet}
          initialType={selectedWalletType || undefined}
          banks={[]}
        />

        <ImportWalletsModal
          open={openImportWallets}
          onOpenChange={setOpenImportWallets}
        />
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      {showGestaoClickSync && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-1"
                onClick={syncGestaoClickWallet}
                disabled={isSyncingGestaoClick}
              >
                <RefreshCw className={`h-4 w-4 ${isSyncingGestaoClick ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sincronizar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Importar novas transações do Gestão Click para esta carteira</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1"
              onClick={() => setOpenImportWallets(true)}
            >
              <DownloadCloud className="h-4 w-4" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Importar carteiras e transações do Gestão Click</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-8 gap-1"
      >
        <Link href="/wallets/bank-connect">
          <CreditCard className="h-4 w-4" />
          <span className="hidden sm:inline">Conectar Banco</span>
        </Link>
      </Button>

      {/* Dropdown para criar nova carteira */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="default"
            size="sm"
            className="h-8 gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Nova Carteira</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Adicionar carteira</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleWalletTypeSelect("MANUAL")}>
            <Plus className="mr-2 h-4 w-4" />
            Carteira Manual
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleWalletTypeSelect("BANK_INTEGRATION")}>
            <CreditCard className="mr-2 h-4 w-4" />
            Banco do Brasil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Importação automática</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleWalletTypeSelect("GESTAO_CLICK")}>
            <Database className="mr-2 h-4 w-4" />
            Gestão Click
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWalletModal
        existingWallet={undefined}
        isOpen={openNewWallet}
        onOpenChange={setOpenNewWallet}
        initialType={selectedWalletType || undefined}
        banks={[]}
      />

      <ImportWalletsModal
        open={openImportWallets}
        onOpenChange={setOpenImportWallets}
      />
    </div>
  );
} 