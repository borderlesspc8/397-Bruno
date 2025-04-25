import { prisma } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth-options";
import { getAuthSession } from "@/app/_lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { 
  ArrowLeft, 
  FileText, 
  CreditCard, 
  Building, 
  Coins, 
  Wallet, 
  RefreshCw, 
  Clock, 
  ArrowDownRight, 
  ArrowUpRight, 
  BarChart3, 
  PencilLine,
  Trash2,
  AlertTriangle,
  FileUp
} from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { formatCurrency, formatDate } from "@/app/_lib/utils";
import BankConnectionEditButton from "@/app/_components/bank-connection-edit-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Separator } from "@/app/_components/ui/separator";
import { Badge } from "@/app/_components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TransactionCard } from "@/app/_components/transactions/transaction-card";
import { EmptyState } from "@/app/_components/ui/empty-state";
import { WalletData } from "@/app/_components/wallets/wallet-card";
import { TransactionData, TransactionType } from "@/app/_components/transactions/transaction-card";
import { Wallet as PrismaWallet, Transaction, Bank } from "@prisma/client";
import { WalletDebugPanel } from "@/app/_components/wallet-debug-panel";

interface WalletPageProps {
  params: {
    walletId: string;
  };
}

// Definir tipos para os dados do Prisma com relacionamentos
interface WalletWithRelations extends PrismaWallet {
  bank: Bank | null;
  transactions: Transaction[];
  calculatedBalance?: number;
  balanceWasUpdated?: boolean;
  transactionCount?: number;
}

export const metadata: Metadata = {
  title: "Detalhes da Carteira",
  description: "Visualize os detalhes e transações da sua carteira",
};

export default async function WalletPage({ params }: WalletPageProps) {
  const session = await getAuthSession();
  const user = session?.user;

  if (!user?.id) {
    redirect("/auth/login");
  }

  // Buscar dados da carteira via API para obter o saldo calculado corretamente
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const walletResponse = await fetch(`${apiUrl}/api/wallets/${params.walletId}/details`, {
    headers: {
      Cookie: `next-auth.session-token=${user.id}`,
    },
    cache: "no-store", // Evita cache para garantir dados atualizados
  });

  // Se a API falhar, buscar do banco como fallback
  let wallet: WalletWithRelations | null = null;
  let usedApi = false;
  
  if (walletResponse.ok) {
    try {
      const data = await walletResponse.json();
      wallet = data.wallet as WalletWithRelations;
      usedApi = true;
      
      // Adicionar informação de debug para verificação
      console.log(`[WALLET_DETAIL] Usando API: Saldo calculado=${wallet.calculatedBalance}, Saldo armazenado=${wallet.balance}, Atualizado=${wallet.balanceWasUpdated}`);
    } catch (error) {
      console.error("[WALLET_DETAIL] Erro ao processar resposta da API:", error);
    }
  }

  // Fallback para busca direta no banco de dados
  if (!wallet) {
    console.warn("[WALLET_DETAIL] Usando fallback do banco de dados");
    wallet = await prisma.wallet.findFirst({
      where: {
        id: params.walletId,
        userId: user.id,
      },
      include: {
        bank: true,
        transactions: {
          orderBy: {
            date: "desc",
          },
          take: 10
        },
      },
    }) as WalletWithRelations | null;

    if (!wallet) {
      redirect("/wallets");
    }
  }

  const metadata = wallet.metadata as Record<string, any> || {};
  
  // Buscar a conexão bancária associada à carteira
  let connectionId = null;
  if (wallet.type === "CHECKING" || wallet.type === "GESTAO_CLICK") {
    // Verificar se o ID da conexão está armazenado nos metadados
    connectionId = metadata.connectionId;
  }
  
  // Preparar dados iniciais se houver uma conexão
  const initialData = connectionId && metadata ? {
    applicationKey: metadata.applicationKey || "",
    clientId: metadata.clientId || "",
    clientSecret: metadata.clientSecret || "",
    apiUrl: metadata.apiUrl || "",
    agencia: metadata.agencia || "",
    conta: metadata.conta || "",
  } : undefined;
  
  // Formatação da data da última sincronização
  const formatLastSync = (lastSyncStr?: string) => {
    if (!lastSyncStr) return null;
    
    try {
      const lastSync = new Date(lastSyncStr);
      return {
        // Formato completo: "12 de maio de 2023, 14:30"
        full: format(lastSync, "PPP, HH:mm", { locale: ptBR }),
        // Formato relativo: "há 5 minutos", "há 2 horas", etc.
        relative: formatDistanceToNow(lastSync, { locale: ptBR, addSuffix: true })
      };
    } catch (e) {
      return null;
    }
  };

  const lastSyncFormatted = formatLastSync(metadata.lastSync);
  
  // Mapear o tipo de carteira para o componente WalletCard
  const mapWalletType = (type: string): "bank" | "cash" | "creditCard" | "investment" => {
    switch (type) {
      case "CHECKING":
      case "SAVINGS":
      case "DIGITAL":
      case "GESTAO_CLICK":
        return "bank";
      case "CASH":
        return "cash";
      case "CREDIT_CARD":
        return "creditCard";
      case "INVESTMENT":
        return "investment";
      default:
        return "cash";
    }
  };
  
  // Mapear tipo de transação do Prisma para o componente TransactionCard
  const mapTransactionType = (type: string): TransactionType => {
    switch (type) {
      case "DEPOSIT":
        return "income";
      case "WITHDRAWAL":
        return "expense";
      case "TRANSFER":
        return "transfer";
      default:
        return "expense";
    }
  };
  
  // Usar o saldo calculado se disponível
  const displayBalance = usedApi && wallet.calculatedBalance !== undefined 
    ? wallet.calculatedBalance 
    : wallet.balance;
  
  // Converter para o formato do WalletCard
  const walletData: WalletData = {
    id: wallet.id,
    name: wallet.name,
    type: mapWalletType(wallet.type),
    balance: displayBalance,
    institution: wallet.bank?.name,
    accountNumber: metadata.conta,
    lastSync: lastSyncFormatted?.full,
    isConnected: wallet.type === "CHECKING" || wallet.type === "GESTAO_CLICK",
  };
  
  // Converter transações para o formato do TransactionCard
  const transactionsData: TransactionData[] = wallet.transactions.map(transaction => ({
    id: transaction.id,
    description: transaction.name,
    amount: transaction.amount,
    date: transaction.date.toISOString(),
    type: mapTransactionType(transaction.type),
    category: undefined,
    wallet: {
      id: wallet.id,
      name: wallet.name
    }
  }));
  
  // Calcular estatísticas
  const incomeTransactions = transactionsData.filter(t => t.type === "income");
  const expenseTransactions = transactionsData.filter(t => t.type === "expense");
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Detalhes da Carteira</h2>
          <p className="text-muted-foreground">
            Visualize os detalhes e transações da sua carteira
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/wallets">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          
          {(wallet.type === "CHECKING" || wallet.type === "GESTAO_CLICK") && (
            <>
              <Button asChild size="sm">
                <Link href={`/wallets/${wallet.id}/extract`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Extrato
                </Link>
              </Button>
              
              <Button asChild size="sm" variant="outline">
                <Link href={`/wallets/${wallet.id}/import`}>
                  <FileUp className="h-4 w-4 mr-2" />
                  Importar OFX
                </Link>
              </Button>
              
              {connectionId && (
                <BankConnectionEditButton 
                  connectionId={connectionId} 
                  walletId={wallet.id}
                  initialData={initialData}
                  variant="icon"
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Painel de depuração para ajudar a diagnosticar problemas de saldo */}
      {process.env.NODE_ENV !== 'production' && (
        <WalletDebugPanel walletId={params.walletId} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 relative overflow-hidden">
          {/* Gradiente de fundo */}
          <div className="absolute inset-0 bg-gradient-to-br from-card to-background opacity-60"></div>
          
          <CardHeader className="relative z-10 pb-2">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-md ${
                (wallet.type === "CHECKING" || wallet.type === "GESTAO_CLICK") 
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" 
                  : wallet.type === "CASH" 
                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}>
                {(wallet.type === "CHECKING" || wallet.type === "GESTAO_CLICK") ? (
                  <Building className="h-6 w-6" />
                ) : wallet.type === "CASH" ? (
                  <Coins className="h-6 w-6" />
                ) : (
                  <Wallet className="h-6 w-6" />
                )}
              </div>
              
              <div>
                <CardTitle className="text-2xl">{wallet.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  {wallet.bank?.name || "Carteira pessoal"}
                  {metadata.agencia && metadata.conta && (
                    <span> • Ag. {metadata.agencia as string} • Conta: {metadata.conta as string}</span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 pt-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground">Saldo atual</span>
              <span className={`text-3xl font-bold ${
                displayBalance >= 0 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              }`}>
                {formatCurrency(displayBalance)}
              </span>
            </div>
            
            {lastSyncFormatted && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-4">
                <Clock className="h-3 w-3" />
                <span>Atualizado {lastSyncFormatted.relative}</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {lastSyncFormatted.full}
                </Badge>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="relative z-10 flex justify-between pt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/transactions/new?walletId=${wallet.id}&type=expense`}>
                <ArrowUpRight className="h-4 w-4 mr-2 text-red-500" />
                Nova Despesa
              </Link>
            </Button>
            
            <Button variant="outline" size="sm" asChild>
              <Link href={`/transactions/new?walletId=${wallet.id}&type=income`}>
                <ArrowDownRight className="h-4 w-4 mr-2 text-green-500" />
                Nova Receita
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {(wallet.type === "CHECKING" || wallet.type === "GESTAO_CLICK") && !connectionId && (
          <div className="md:col-span-1">
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 mt-0.5" />
                <div>
                  <h4 className="font-medium">Conexão bancária não configurada</h4>
                  <p className="text-sm mt-1">
                    Esta carteira está configurada como uma conta bancária, mas não possui uma conexão bancária configurada.
                    Configure a conexão para sincronizar automaticamente suas transações.
                  </p>
                  {initialData && (
                    <Button variant="outline" size="sm" className="mt-2">
                      Configurar Conexão
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList>
          <TabsTrigger value="transactions" className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            <span>Transações</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Detalhes</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Últimas Transações</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/transactions?walletId=${wallet.id}`}>
                    Ver Todas
                  </Link>
                </Button>
              </div>
              <CardDescription>
                As transações mais recentes desta carteira
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {transactionsData.length > 0 ? (
                <div className="space-y-4">
                  {transactionsData.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      compact={true}
                      showWallet={false}
                      linkTo={`/transactions/${transaction.id}`}
                      actionType="view"
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<CreditCard className="h-10 w-10" />}
                  title="Nenhuma transação encontrada"
                  description="Esta carteira ainda não possui transações registradas."
                  action={
                    <Button asChild>
                      <Link href={`/transactions/new?walletId=${wallet.id}`}>
                        Registrar Transação
                      </Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detalhes da Carteira</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/wallets/${wallet.id}/edit`}>
                    <PencilLine className="h-4 w-4 mr-2" />
                    Editar
                  </Link>
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Nome</h3>
                    <p>{wallet.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Tipo</h3>
                    <p>
                      {(wallet.type === "CHECKING" || wallet.type === "GESTAO_CLICK") ? "Conta Bancária" : 
                       wallet.type === "CASH" ? "Dinheiro" : 
                       wallet.type === "CREDIT_CARD" ? "Cartão de Crédito" :
                       wallet.type === "INVESTMENT" ? "Investimento" : "Outro"}
                    </p>
                  </div>
                  
                  {wallet.bank && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Instituição</h3>
                      <p>{wallet.bank.name}</p>
                    </div>
                  )}
                  
                  {metadata.agencia && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Agência</h3>
                      <p>{metadata.agencia as string}</p>
                    </div>
                  )}
                  
                  {metadata.conta && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Conta</h3>
                      <p>{metadata.conta as string}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Data de Criação</h3>
                    <p>{format(new Date(wallet.createdAt), "PPP", { locale: ptBR })}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Saldo</h3>
                    <p className={displayBalance >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(displayBalance)}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Total de Transações</h3>
                    <p>{wallet.transactionCount || 0}</p>
                  </div>
                </div>
                
                {(wallet.type === "CHECKING" || wallet.type === "GESTAO_CLICK") && !connectionId && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Conexão bancária não configurada</h4>
                        <p className="text-sm mt-1">
                          Esta carteira está configurada como uma conta bancária, mas não possui uma conexão bancária configurada.
                          Configure a conexão para sincronizar automaticamente suas transações.
                        </p>
                        {initialData && (
                          <Button variant="outline" size="sm" className="mt-2" asChild>
                            <Link href={`/wallets/${wallet.id}/connect`}>
                              Configurar Conexão
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter>
              <Button variant="destructive" size="sm" asChild>
                <Link href={`/wallets/${wallet.id}/delete`}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Carteira
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}