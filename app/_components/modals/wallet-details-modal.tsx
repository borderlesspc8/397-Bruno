"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/_components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { 
  ArrowLeft, 
  FileText, 
  CreditCard, 
  Pencil, 
  RefreshCw, 
  FileUp, 
  Trash2, 
  AlertTriangle,
  Database,
  Download
} from "lucide-react";
import { formatCurrency } from "@/app/_lib/utils";
import BankConnectionEditButton from "@/app/_components/bank-connection-edit-button";
import { toast } from "sonner";
import TestConnectionButton from "../test-connection-button";
import { OfxImportModal } from "../wallets/import/OfxImportModal";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: "DEPOSIT" | "WITHDRAWAL";
  date: string;
  category?: string;
}

interface Bank {
  id: string;
  name: string;
  logo: string;
}

interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: string;
  bankId: string | null;
  bank?: Bank;
  transactions: Transaction[];
  metadata?: Record<string, any>;
  userId: string;
}

interface WalletDetailsModalProps {
  walletId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletDetailsModal({ walletId, isOpen, onClose }: WalletDetailsModalProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSyncingGestaoClick, setIsSyncingGestaoClick] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && walletId) {
      loadWalletDetails(walletId);
    }
  }, [isOpen, walletId]);

  async function loadWalletDetails(id: string) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/wallets/${id}/details`);
      
      if (!response.ok) {
        throw new Error("Falha ao carregar detalhes da carteira");
      }
      
      const data = await response.json();
      setWallet(data.wallet);
    } catch (error) {
      console.error("[LOAD_WALLET_DETAILS_ERROR]", error);
      setError("Erro ao carregar detalhes. Tente novamente.");
      toast.error("Erro ao carregar detalhes da carteira");
    } finally {
      setIsLoading(false);
    }
  }

  async function syncWallet() {
    if (!wallet || isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      const response = await fetch(`/api/wallets/${wallet.id}/sync`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao sincronizar carteira");
      }
      
      const data = await response.json();
      
      // Atualizar os dados da carteira no estado
      setWallet(prevWallet => {
        if (!prevWallet) return data.wallet;
        return {
          ...prevWallet,
          balance: data.wallet.balance,
          transactions: data.wallet.transactions,
          metadata: data.wallet.metadata
        };
      });
      
      toast.success("Carteira sincronizada com sucesso!");
    } catch (error) {
      console.error("[SYNC_WALLET_ERROR]", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao sincronizar carteira";
      toast.error(errorMessage);
    } finally {
      setIsSyncing(false);
    }
  }

  // Função para lidar com a conclusão da importação OFX
  const handleImportComplete = (updatedWallet?: any) => {
    // Se recebemos dados atualizados, usamos eles diretamente
    if (updatedWallet) {
      setWallet(updatedWallet);
      toast.success("Transações importadas com sucesso!");
    } else {
      // Caso contrário, recarregamos os dados da carteira
      if (wallet) {
        loadWalletDetails(wallet.id);
        toast.success("Transações importadas com sucesso!");
      }
    }
  };

  // Preparar dados iniciais para a edição de conexão
  const metadata = wallet?.metadata || {};
  const connectionId = metadata.connectionId || wallet?.id;
  const initialData = wallet ? {
    applicationKey: metadata.applicationKey || "",
    clientBasic: metadata.clientBasic || "",
    clientId: metadata.clientId || "",
    clientSecret: metadata.clientSecret || "",
    apiUrl: metadata.apiUrl || "",
    agencia: metadata.agencia || "",
    conta: metadata.conta || ""
  } : undefined;

  // Função para excluir a carteira
  const handleDeleteWallet = async () => {
    if (!wallet) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/wallets/${wallet.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao excluir carteira");
      }
      
      toast.success("Carteira excluída com sucesso!");
      
      // Fechar o modal e redirecionar
      onClose();
      
      // Forçar atualização completa da página
      router.refresh();
      
      // Adicionar um pequeno atraso antes de redirecionar para garantir 
      // que a atualização tenha efeito
      setTimeout(() => {
        window.location.href = '/wallets';
      }, 300);
      
    } catch (error) {
      console.error("[DELETE_WALLET_ERROR]", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao excluir carteira";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Verificar se a carteira é do tipo Gestão Click
  const isGestaoClickWallet = () => {
    if (!wallet) return false;

    // Verificar pelo tipo ou metadados
    return (
      wallet.type.includes('INTEGRATION') ||
      (wallet.metadata?.source && typeof wallet.metadata.source === 'string' && wallet.metadata.source.includes('gestao-click'))
    );
  };

  // Função para sincronizar transações do Gestão Click
  const syncGestaoClickWallet = async () => {
    if (!wallet || isSyncingGestaoClick) return;
    
    setIsSyncingGestaoClick(true);
    
    try {
      toast.loading("Sincronizando transações do Gestão Click...");
      
      const response = await fetch('/api/gestao-click/sync-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ walletId: wallet.id })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao sincronizar transações');
      }
      
      const result = await response.json();
      
      // Verificar se novas transações foram importadas
      if (result.newTransactions > 0) {
        toast.success(
          `${result.newTransactions} novas transações importadas`,
          { description: 'A carteira foi atualizada com sucesso' }
        );
      } else {
        toast.info(
          'Carteira já sincronizada',
          { description: 'Não há novas transações para importar' }
        );
      }
      
      // Recarregar os dados da carteira
      loadWalletDetails(wallet.id);
    } catch (error) {
      console.error("[GESTAO_CLICK_SYNC_ERROR]", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao sincronizar transações";
      toast.error(errorMessage);
    } finally {
      setIsSyncingGestaoClick(false);
      toast.dismiss();
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Carteira</DialogTitle>
            <DialogDescription>Carregando detalhes...</DialogDescription>
          </DialogHeader>
          <div className="h-40 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !wallet) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
            <DialogDescription>
              {error || "Não foi possível carregar os detalhes da carteira"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Detalhes da Carteira</DialogTitle>
                <DialogDescription>
                  Visualize os detalhes e transações da sua carteira
                </DialogDescription>
              </div>
              
              <div className="flex space-x-2">
                {wallet.type === "BANK_INTEGRATION" && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      onClick={syncWallet}
                      disabled={isSyncing}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                    </Button>
                    
                    {connectionId && (
                      <>
                        <TestConnectionButton 
                          connectionId={connectionId}
                          walletId={wallet.id}
                          variant="icon"
                        />
                        <BankConnectionEditButton 
                          connectionId={connectionId}
                          walletId={wallet.id}
                          initialData={initialData}
                          variant="icon"
                        />
                      </>
                    )}
                  </>
                )}
                
                {/* Botão de sincronização do Gestão Click */}
                {isGestaoClickWallet() && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                    onClick={syncGestaoClickWallet}
                    disabled={isSyncingGestaoClick}
                  >
                    <Download className={`h-3 w-3 mr-1 ${isSyncingGestaoClick ? 'animate-spin' : ''}`} />
                    {isSyncingGestaoClick ? 'Sincronizando...' : 'Sincronizar GClick'}
                  </Button>
                )}
                
                {/* Botão de importação OFX */}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  onClick={() => setIsImportModalOpen(true)}
                >
                  <FileUp className="h-3 w-3 mr-1" />
                  Importar OFX
                </Button>

                {/* Botão de integração com Gestão Click */}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                  onClick={() => router.push(`/wallets/${wallet.id}/gestao-click`)}
                >
                  <Database className="h-3 w-3 mr-1" />
                  Gestão Click
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-4">
                {wallet.bank?.logo ? (
                  <img 
                    src={wallet.bank.logo} 
                    alt={wallet.bank.name} 
                    className="h-8 w-8 object-contain" 
                  />
                ) : (
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                )}
                <div>
                  <CardTitle>{wallet.name}</CardTitle>
                  <CardDescription>
                    {wallet.bank?.name || "Carteira pessoal"}
                    {metadata.agencia && metadata.conta && (
                      <span> • Ag. {metadata.agencia} • Conta: {metadata.conta}</span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(wallet.balance)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimas Transações</CardTitle>
              <CardDescription>
                As transações mais recentes desta carteira
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wallet.transactions.length > 0 ? (
                <div className="space-y-4">
                  {wallet.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">{transaction.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            try {
                              return new Date(transaction.date).toLocaleDateString('pt-BR');
                            } catch (error) {
                              // Em caso de erro, retornar uma string placeholder
                              console.error("Erro ao formatar data:", error);
                              return "Data não disponível";
                            }
                          })()}
                        </p>
                      </div>
                      <div className={`font-medium ${transaction.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  Nenhuma transação encontrada para esta carteira
                </p>
              )}
            </CardContent>
          </Card>
          
          <div className="flex justify-end mt-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Carteira
              </Button>
              
              <Button onClick={onClose} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de importação OFX */}
      {wallet && (
        <OfxImportModal
          wallet={{
            id: wallet.id,
            name: wallet.name,
            type: wallet.type as any,
            userId: wallet.userId,
            balance: wallet.balance,
            bankId: wallet.bankId,
            // Campos obrigatórios do modelo Prisma
            createdAt: new Date(),
            updatedAt: new Date(),
            icon: null,
            color: null,
            isActive: true,
            allowNegative: false,
            // Campos opcionais
            creditLimit: null,
            dueDay: null,
            closingDay: null,
            // Metadados
            metadata: wallet.metadata || {}
          }}
          isOpen={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          onImportComplete={handleImportComplete}
        />
      )}
      
      {/* Diálogo de confirmação para excluir carteira */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a carteira
              <strong> {wallet?.name}</strong> e todas as suas transações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteWallet();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 