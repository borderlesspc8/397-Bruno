"use client";

import React, { useState, useEffect } from "react";
import { WalletsList } from "@/app/_components/connected-wallets";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { BarChart3, RefreshCcw, Wallet, WalletCards, PlusCircle, Plus } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { toast } from "sonner";
import { formatCurrency } from "@/app/_lib/utils";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/_components/ui/dropdown-menu";
import Link from "next/link";
import { MdAccountBalance } from "react-icons/md";
import { TbBrandCashapp } from "react-icons/tb";
import { CreateWalletForm } from "@/app/(auth-routes)/wallets/new/_components/create-wallet-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/_components/ui/dialog";
import { ImportWalletsModal } from "@/app/_components/gestao-click/ImportWalletsModal";
import { useRouter } from "next/navigation";

/**
 * Formata números para exibição em português brasileiro
 */
function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num);
}

/**
 * Tipo para banco
 */
type Bank = {
  id: string;
  name: string;
  logo: string;
};

/**
 * Interface para dados de carteira
 */
interface WalletData {
  id: string;
  name: string;
  balance: number;
  type: string;
  bankId: string | null;
  bank?: {
    id: string;
    name: string;
    logo: string;
  };
  metadata: any;
  createdAt: string;
}

/**
 * Props para o componente de página de carteiras
 */
interface WalletsPageClientProps {
  totalBalance: number;
  wallets: any[];
  banks: Bank[];
  stats: {
    totalWallets: number;
    bankWallets: number;
    cashWallets: number;
    otherWallets: number;
    positiveBalanceWallets: number;
    negativeBalanceWallets: number;
  };
}

/**
 * Componente principal da página de carteiras
 */
export function WalletsPageClient({ 
  totalBalance: initialTotalBalance = 0, 
  wallets: initialWallets = [], 
  banks = [], 
  stats: initialStats = {
    totalWallets: 0,
    bankWallets: 0,
    cashWallets: 0,
    otherWallets: 0,
    positiveBalanceWallets: 0,
    negativeBalanceWallets: 0
  }
}: WalletsPageClientProps) {
  // Garantir que os valores iniciais são válidos
  const safeInitialWallets = Array.isArray(initialWallets) ? initialWallets : [];
  const safeInitialTotalBalance = typeof initialTotalBalance === 'number' ? initialTotalBalance : 0;
  const safeInitialStats = initialStats || {
    totalWallets: 0,
    bankWallets: 0,
    cashWallets: 0,
    otherWallets: 0,
    positiveBalanceWallets: 0,
    negativeBalanceWallets: 0
  };

  const [totalBalance, setTotalBalance] = useState(safeInitialTotalBalance);
  const [wallets, setWallets] = useState<WalletData[]>(safeInitialWallets);
  const [stats, setStats] = useState(safeInitialStats);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFixingBalances, setIsFixingBalances] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  // Estados para controlar modais
  const [createWalletModalOpen, setCreateWalletModalOpen] = useState(false);
  const [gestaoClickModalOpen, setGestaoClickModalOpen] = useState(false);

  const router = useRouter();

  // Efeito para atualizar os dados das carteiras uma vez ao carregar o componente
  useEffect(() => {
    // Atualizar os dados ao montar o componente
    refreshWallets();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Adicionar listener para evento de atualização de carteira
    const handleWalletUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { wallet } = customEvent.detail;
      
      if (wallet) {
        setWallets(prev => 
          prev.map(w => w.id === wallet.id ? wallet : w)
        );
        
        // Recalcular o saldo total
        let newTotalBalance = 0;
        setWallets(prev => {
          newTotalBalance = prev.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
          return prev;
        });
        
        setTotalBalance(newTotalBalance);
      }
    };
    
    window.addEventListener('wallet-updated', handleWalletUpdate);
    
    // Listener para nova carteira
    const handleNewWallet = () => {
      refreshWallets();
    };
    
    window.addEventListener('wallet-created', handleNewWallet);
    
    return () => {
      window.removeEventListener('wallet-updated', handleWalletUpdate);
      window.removeEventListener('wallet-created', handleNewWallet);
    };
  }, []);

  // Converter wallets para o formato esperado pelo componente WalletsList
  const convertedWallets = wallets.map(wallet => ({
    id: wallet.id,
    name: wallet.name,
    type: wallet.type,
    balance: wallet.balance,
    bank: wallet.bank ? {
      id: wallet.bank.id || wallet.bankId || wallet.id,
      name: wallet.bank.name,
      logo: wallet.bank.logo
    } : undefined,
    account: wallet.metadata?.conta,
    agency: wallet.metadata?.agencia,
    lastSync: wallet.metadata?.lastSync
  }));

  // Filtrar carteiras por tipo
  const bankWallets = convertedWallets.filter(wallet => wallet.type === 'BANK');
  const cashWallets = convertedWallets.filter(wallet => wallet.type === 'CASH');
  const otherWallets = convertedWallets.filter(wallet => 
    wallet.type !== 'BANK' && wallet.type !== 'CASH'
  );

  // Função para alterar a aba ativa
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  /**
   * Atualiza a lista de carteiras do servidor
   */
  const refreshWallets = async () => {
    try {
      setIsRefreshing(true);
      
      const response = await fetch('/api/wallets', {
        cache: 'no-store', // Evitar cache para garantir dados frescos
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao atualizar carteiras: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Garantir que as propriedades retornadas são válidas
      const safeWallets = Array.isArray(data.wallets) ? data.wallets : [];
      const safeTotalBalance = typeof data.totalBalance === 'number' ? data.totalBalance : 0;
      const safeStats = data.stats || {
        totalWallets: safeWallets.length,
        bankWallets: 0,
        cashWallets: 0,
        otherWallets: 0, 
        positiveBalanceWallets: 0,
        negativeBalanceWallets: 0
      };

      setWallets(safeWallets);
      setTotalBalance(safeTotalBalance);
      setStats(safeStats);
      
      console.log('[WALLETS_CLIENT] Dados atualizados com sucesso:', { 
        walletCount: safeWallets.length,
        totalBalance: safeTotalBalance
      });
      
      // Toast somente se o componente não estiver montando pela primeira vez
      if (isRefreshing) {
        toast.success('Carteiras atualizadas com sucesso!');
      }
    } catch (error) {
      console.error('[WALLETS_CLIENT] Erro ao atualizar carteiras:', error);
      toast.error('Erro ao atualizar carteiras');
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Corrige os saldos de todas as carteiras do usuário
   */
  const fixWalletBalances = async () => {
    try {
      setIsFixingBalances(true);
      
      const response = await fetch('/api/wallets/fix-balances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao corrigir saldos');
      }
      
      const data = await response.json();
      
      if (data.updatedCount > 0) {
        toast.success(`Saldos corrigidos: ${data.updatedCount} de ${data.totalWallets} carteiras atualizadas`);
        // Atualizar os dados para refletir os novos saldos
        refreshWallets();
      } else {
        toast.info('Todos os saldos já estão corretos!');
      }
    } catch (error) {
      console.error('[WALLETS_CLIENT] Erro ao corrigir saldos:', error);
      toast.error('Falha ao corrigir saldos. Tente novamente.');
    } finally {
      setIsFixingBalances(false);
    }
  };

  // Função para corrigir saldos
  const handleFixBalances = () => {
    toast.info("Corrigindo saldos de todas as carteiras...");
    // Recarregar a página para forçar o recálculo
    router.refresh();
  };

  // Componente para debug
  const DebugWalletList = ({ 
    wallets, 
    filterType,
    onSelect,
    selectedWallets,
    onDelete,
    syncStatus
  }: { 
    wallets: any[];
    filterType?: string;
    onSelect?: (walletIds: string[]) => void;
    selectedWallets?: string[];
    onDelete?: (walletIds: string | string[]) => void;
    syncStatus?: Record<string, boolean>;
  }) => {
    console.log("DebugWalletList renderizando com", wallets.length, "carteiras");
    console.log("Tem onSelect?", !!onSelect);
    console.log("Tem onDelete?", !!onDelete);
    
    return (
      <WalletsList 
        wallets={wallets} 
        filterType={filterType}
        onSelect={onSelect}
        selectedWallets={selectedWallets}
        onDelete={onDelete}
        syncStatus={syncStatus}
      />
    );
  };

  return (
    <div className="mx-auto space-y-4">
      {/* Cabeçalho da página */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">Minhas Carteiras</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleFixBalances}
            disabled={isFixingBalances || isRefreshing}
          >
            <RefreshCcw className={`h-4 w-4 ${isFixingBalances ? 'animate-spin' : ''}`} />
            <span>{isFixingBalances ? 'Corrigindo...' : 'Corrigir Saldos'}</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => router.refresh()}
            disabled={isRefreshing || isFixingBalances}
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
          
          {/* Menu dropdown para criar nova carteira */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Carteira
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Adicionar carteira</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setCreateWalletModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Carteira Manual
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/wallets/new?type=bank">
                  <MdAccountBalance className="mr-2 h-4 w-4" />
                  Banco do Brasil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Importação automática</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setGestaoClickModalOpen(true)}>
                <TbBrandCashapp className="mr-2 h-4 w-4" />
                Gestão Click
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xl">Saldo Total</CardTitle>
            <CardDescription>
              Soma dos saldos de todas as carteiras
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 px-4 pb-3">
            <div className="text-3xl font-bold">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.positiveBalanceWallets} carteiras com saldo positivo
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xl">Tipos de Carteiras</CardTitle>
            <CardDescription>
              {formatNumber(stats.totalWallets)} carteiras
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 px-4 pb-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/50">
                <WalletCards className="h-5 w-5 text-primary mb-1" />
                <span className="text-sm font-medium">{stats.bankWallets}</span>
                <span className="text-xs text-muted-foreground">Bancárias</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/50">
                <Wallet className="h-5 w-5 text-primary mb-1" />
                <span className="text-sm font-medium">{stats.cashWallets}</span>
                <span className="text-xs text-muted-foreground">Dinheiro</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/50">
                <BarChart3 className="h-5 w-5 text-primary mb-1" />
                <span className="text-sm font-medium">{stats.otherWallets}</span>
                <span className="text-xs text-muted-foreground">Outras</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas de carteiras */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 mb-3">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="bank">Bancárias</TabsTrigger>
          <TabsTrigger value="cash">Dinheiro</TabsTrigger>
          <TabsTrigger value="other">Outras</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {isRefreshing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-[180px] w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="w-full">
              <DebugWalletList 
                wallets={convertedWallets} 
                filterType="ALL"
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="bank" className="mt-0">
          {isRefreshing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-[180px] w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="w-full">
              <DebugWalletList 
                wallets={bankWallets} 
                filterType="BANK"
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="cash" className="mt-0">
          {isRefreshing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-[180px] w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="w-full">
              <DebugWalletList 
                wallets={cashWallets} 
                filterType="CASH"
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="other" className="mt-0">
          {isRefreshing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-[180px] w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="w-full">
              <DebugWalletList 
                wallets={otherWallets} 
                filterType="OTHER"
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal para criar carteira manualmente */}
      <Dialog open={createWalletModalOpen} onOpenChange={setCreateWalletModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Carteira</DialogTitle>
            <DialogDescription>
              Crie uma nova carteira para gerenciar suas finanças
            </DialogDescription>
          </DialogHeader>
          <CreateWalletForm 
            onSuccess={() => {
              setCreateWalletModalOpen(false);
              refreshWallets();
              toast.success("Carteira criada com sucesso!");
            }}
            banks={banks}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para importação via Gestão Click */}
      <ImportWalletsModal 
        open={gestaoClickModalOpen} 
        onOpenChange={setGestaoClickModalOpen} 
      />
    </div>
  );
} 