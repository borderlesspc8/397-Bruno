"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DatabaseIcon, 
  Download, 
  FileText, 
  PieChart, 
  ShieldAlert, 
  Tags, 
  Wallet, 
  XCircle 
} from "lucide-react";

import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { Separator } from "@/app/_components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/app/_components/ui/table";
import { Badge } from "@/app/_components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Skeleton } from "@/app/_components/ui/skeleton";

import ImportMenu from "./ImportMenu";

// Componente para exibir o status da importação com cores específicas
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "PENDING":
        return { label: "Pendente", variant: "outline" as const };
      case "IN_PROGRESS":
        return { label: "Em andamento", variant: "secondary" as const };
      case "COMPLETED":
      case "SUCCESS":
        return { label: "Concluído", variant: "default" as const, className: "bg-green-600" };
      case "FAILED":
      case "ERROR":
        return { label: "Falha", variant: "destructive" as const };
      case "CANCELLED":
        return { label: "Cancelado", variant: "outline" as const };
      default:
        return { label: status, variant: "outline" as const };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};

export default function ImportDetails({ id }: { id: string }) {
  const router = useRouter();
  const [importDetails, setImportDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Carregar detalhes da importação
  useEffect(() => {
    loadImportDetails();
  }, [id]);
  
  const loadImportDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/import-history/${id}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar detalhes: ${response.statusText}`);
      }
      
      const data = await response.json();
      setImportDetails(data);
    } catch (error: any) {
      console.error("Erro ao carregar detalhes da importação:", error);
      setError(`Erro ao carregar detalhes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Cancelar importação
  const cancelImport = async () => {
    if (!window.confirm("Deseja realmente cancelar esta importação?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/import-history/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "cancel" })
      });
      
      if (!response.ok) {
        throw new Error(`Falha ao cancelar importação: ${response.statusText}`);
      }
      
      // Recarregar dados
      loadImportDetails();
    } catch (error: any) {
      console.error("Erro ao cancelar importação:", error);
      setError(`Erro ao cancelar importação: ${error.message}`);
    }
  };
  
  // Funções auxiliares para formatação
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-";
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins === 0) {
      return `${secs} segundos`;
    }
    
    return `${mins} minutos e ${secs} segundos`;
  };
  
  const formatFullDate = (date?: string | Date) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  };
  
  if (loading) {
    return (
      <div>
        <ImportMenu />
        <div className="grid gap-6">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div>
        <ImportMenu />
        <div className="grid gap-6">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Detalhes da Importação</h1>
          </div>
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  
  if (!importDetails) {
    return (
      <div>
        <ImportMenu />
        <div className="grid gap-6">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Detalhes da Importação</h1>
          </div>
          <Alert>
            <AlertTitle>Importação não encontrada</AlertTitle>
            <AlertDescription>
              Não foi possível encontrar os detalhes desta importação.
              <Button variant="link" onClick={() => router.push("/wallets/import-dashboard")}>
                Voltar para o dashboard
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  
  // Propriedades dos detalhes
  const {
    source,
    status,
    startTime,
    endTime,
    duration,
    totalItems,
    details,
    transactions = []
  } = importDetails;
  
  // Extrair informações detalhadas
  const walletsInfo = details?.wallets || {};
  const transactionsImported = details?.transactions || 0;
  const errors = details?.errors || 0;
  
  return (
    <div>
      <ImportMenu />
      <div className="grid gap-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Detalhes da Importação</h1>
              <p className="text-sm text-muted-foreground">
                ID: {id}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {(status === "IN_PROGRESS" || status === "PENDING") && (
              <Button variant="destructive" onClick={cancelImport}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Importação
              </Button>
            )}
            <Button variant="outline" onClick={loadImportDetails}>
              Atualizar
            </Button>
          </div>
        </div>
        
        {/* Card de status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Importação {source === "GESTAO_CLICK" ? "do Gestão Click" : source}</span>
              <StatusBadge status={status} />
            </CardTitle>
            <CardDescription>
              Iniciada em {formatFullDate(startTime)}
              {endTime && ` e concluída em ${formatFullDate(endTime)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Tempo de Processamento</span>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-xl font-semibold">{formatDuration(duration)}</span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Itens Processados</span>
                <div className="flex items-center">
                  <DatabaseIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-xl font-semibold">{totalItems || 0}</span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Taxa de Sucesso</span>
                <div className="flex items-center">
                  {errors === 0 ? (
                    <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 mr-2 text-amber-500" />
                  )}
                  <span className="text-xl font-semibold">
                    {totalItems ? Math.round(((totalItems - errors) / totalItems) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
            
            {status === "IN_PROGRESS" && (
              <div className="mt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Importação em andamento...</span>
                  <span className="text-sm font-medium">
                    {Math.min(99, Math.round(totalItems ? ((totalItems - errors) / (totalItems + 10)) * 100 : 30))}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(99, Math.round(totalItems ? ((totalItems - errors) / (totalItems + 10)) * 100 : 30))} 
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Abas de detalhes */}
        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="wallets">Carteiras</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
          </TabsList>
          
          {/* Aba de Resumo */}
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Importação</CardTitle>
                <CardDescription>
                  Visão geral dos dados importados do {source === "GESTAO_CLICK" ? "Gestão Click" : source}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Carteiras</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Wallet className="h-5 w-5 mr-2 text-muted-foreground" />
                          <span>Contas Bancárias</span>
                        </div>
                        <Badge variant="outline">{walletsInfo.accounts || 0}</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <PieChart className="h-5 w-5 mr-2 text-muted-foreground" />
                          <span>Centros de Custo</span>
                        </div>
                        <Badge variant="outline">{walletsInfo.costCenters || 0}</Badge>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center font-medium">
                        <span>Total de Carteiras</span>
                        <Badge variant="default">
                          {(walletsInfo.accounts || 0) + (walletsInfo.costCenters || 0)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Transações</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                          <span>Importadas</span>
                        </div>
                        <Badge variant="outline">{transactionsImported || 0}</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <ShieldAlert className="h-5 w-5 mr-2 text-muted-foreground" />
                          <span>Erros</span>
                        </div>
                        <Badge variant="destructive">{errors || 0}</Badge>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center font-medium">
                        <span>Total de Transações</span>
                        <Badge variant="default">{(transactionsImported || 0) + (errors || 0)}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Detalhes adicionais */}
                {details?.error && (
                  <Alert variant="destructive" className="mt-6">
                    <AlertTitle>Erro durante a importação</AlertTitle>
                    <AlertDescription>{details.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Aba de Carteiras */}
          <TabsContent value="wallets">
            <Card>
              <CardHeader>
                <CardTitle>Carteiras Importadas</CardTitle>
                <CardDescription>
                  Detalhes das carteiras importadas do {source === "GESTAO_CLICK" ? "Gestão Click" : source}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {details && details.walletDetails ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Transações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.walletDetails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6">
                            Nenhuma carteira importada
                          </TableCell>
                        </TableRow>
                      ) : (
                        details.walletDetails.map((wallet: any, index: number) => (
                          <TableRow key={wallet.id || index}>
                            <TableCell className="font-medium">{wallet.name}</TableCell>
                            <TableCell>
                              {wallet.type === "GESTAO_CLICK" ? "Conta Bancária" : 
                               wallet.type === "GESTAO_CLICK_COST_CENTER" ? "Centro de Custo" : 
                               wallet.type}
                            </TableCell>
                            <TableCell>
                              <Badge variant={wallet.isNew ? "default" : "outline"}>
                                {wallet.isNew ? "Nova" : "Existente"}
                              </Badge>
                            </TableCell>
                            <TableCell>{wallet.transactions || 0}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Detalhes de carteiras não disponíveis para esta importação
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Aba de Transações */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transações Importadas</CardTitle>
                <CardDescription>
                  Primeiras 100 transações importadas do {source === "GESTAO_CLICK" ? "Gestão Click" : source}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions && transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Tipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-medium">{transaction.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Tags className="h-4 w-4 mr-1 text-muted-foreground" />
                              {transaction.category}
                            </div>
                          </TableCell>
                          <TableCell className={
                            transaction.amount > 0 
                              ? "text-green-600 font-medium" 
                              : "text-red-600 font-medium"
                          }>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(Math.abs(transaction.amount))}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              transaction.type === 'INCOME'
                                ? "default"
                                : "destructive"
                            }>
                              {transaction.type === 'INCOME' ? 'Receita' : 'Despesa'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Nenhuma transação importada ou informações não disponíveis
                  </div>
                )}
                
                {transactions && transactions.length > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    Exibindo {transactions.length} transações de um total de {transactionsImported || "desconhecido"}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 