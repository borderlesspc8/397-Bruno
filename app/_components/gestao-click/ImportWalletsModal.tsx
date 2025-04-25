/**
 * Modal para importação automática de dados do Gestão Click
 * Realiza o processo completo de importação de carteiras e transações
 * de todo o período disponível, evitando duplicações
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Database, Download, CheckCircle2, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/app/_lib/utils";

// Componente personalizado para badges de status
const StatusBadge = ({ 
  children, 
  status = 'success' 
}: { 
  children: React.ReactNode; 
  status?: 'success' | 'warning' | 'error' | 'info' 
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'error':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default:
        return 'bg-green-100 text-green-800 hover:bg-green-200';
    }
  };

  return (
    <Badge className={cn(getStatusStyles())}>
      {children}
    </Badge>
  );
};

// Definir o schema do formulário simplificado - sem campo obrigatório para o token de acesso
const ImportSchema = z.object({
  autoFetch: z.boolean().default(true)
});

type ImportFormValues = z.infer<typeof ImportSchema>;

// Propriedades do componente
interface ImportWalletsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Interface para o status de progresso
interface ImportProgress {
  currentStep: string;
  totalSteps: number;
  currentWallet: number;
  totalWallets: number;
  percentage: number;
}

// Interface para o resultado da importação
interface ImportResult {
  wallets: {
    created: number;
    existing: number;
    total: number;
    details: {
      id: string;
      name: string;
      type: string;
      balance: number;
      isNew: boolean;
    }[];
  };
  transactions: {
    imported: number;
    skipped: number;
    total: number;
    details: {
      walletId: string;
      walletName: string;
      newTransactions: number;
      skippedTransactions: number;
    }[];
  };
  progress: ImportProgress;
}

export function ImportWalletsModal({ open, onOpenChange }: ImportWalletsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ImportProgress>({
    currentStep: 'Aguardando início',
    totalSteps: 3,
    currentWallet: 0,
    totalWallets: 0,
    percentage: 0
  });
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const router = useRouter();

  // Inicializar formulário simplificado
  const form = useForm<ImportFormValues>({
    resolver: zodResolver(ImportSchema),
    defaultValues: {
      autoFetch: true
    }
  });

  // Efeito para limpar o intervalo ao desmontar o componente
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Função para iniciar a importação automática sem exigir credenciais manualmente
  async function startAutoImport() {
    try {
      setProgress({
        currentStep: 'Iniciando importação completa',
        totalSteps: 3,
        currentWallet: 0,
        totalWallets: 0,
        percentage: 5
      });
      
      // Preparar os dados a serem enviados - garantindo que é um objeto válido
      const requestData = {
        useEnvCredentials: true,
        importOptions: {
          fullHistory: true,            // Importar todo o histórico disponível
          importSales: true,            // Importar vendas
          importInstallments: true,     // Importar parcelas de vendas
          importPayments: true,         // Importar pagamentos
          importReceipts: true,         // Importar recebimentos
          importCostCenters: true,      // Importar centros de custo
          importStores: true,           // Importar lojas
          maxTransactions: 100000        // Valor alto para garantir importação completa
        },
        timestamp: new Date().toISOString() // Adicionar timestamp para evitar cache
      };
      
      console.log('Enviando requisição para auto-import com histórico completo:', requestData);
      
      // Fazer a requisição para a API de importação automática usando credenciais do ambiente
      const response = await fetch("/api/gestao-click/auto-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log('Resposta recebida:', { status: response.status, ok: response.ok });

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        // Tentar extrair o erro como JSON se possível
        try {
          const errorData = await response.json();
          console.error('Detalhes do erro:', errorData);
          throw new Error(errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`);
        } catch (parseError) {
          // Se não conseguir extrair o erro como JSON, usar o status HTTP
          console.error('Erro ao fazer parse da resposta de erro:', parseError);
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
      }

      // Tentar extrair o resultado como JSON
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta:', parseError);
        throw new Error('Resposta inválida do servidor. Por favor, tente novamente.');
      }
      
      console.log("Resultado da importação automática:", result);
      
      // Exibir informações sobre importação
      if (result.success) {
        // Extrair dados de resultado
        const importResult = result.result || {};
        const wallets = importResult.wallets || { 
          fromAccounts: { totalCreated: 0, skipped: 0, wallets: [] },
          fromCostCenters: { totalCreated: 0, skipped: 0, wallets: [] }
        };
        const transactions = importResult.transactions || { 
          totalImported: 0, 
          skipped: 0,
          failed: 0,
          details: []
        };
        
        // Calcular totais
        const totalWalletsCreated = 
          (wallets.fromAccounts?.totalCreated || 0) + 
          (wallets.fromCostCenters?.totalCreated || 0);
        
        const totalWalletsSkipped = 
          (wallets.fromAccounts?.skipped || 0) + 
          (wallets.fromCostCenters?.skipped || 0);
        
        const walletsDetails = [
          ...(wallets.fromAccounts?.wallets || []),
          ...(wallets.fromCostCenters?.wallets || [])
        ];
        
        // Montar resultado para exibição
        setImportResult({
          wallets: {
            created: totalWalletsCreated,
            existing: totalWalletsSkipped,
            total: totalWalletsCreated + totalWalletsSkipped,
            details: walletsDetails
          },
          transactions: {
            imported: transactions.totalImported || 0,
            skipped: transactions.skipped || 0,
            total: (transactions.totalImported || 0) + (transactions.skipped || 0),
            details: transactions.details || []
          },
          progress: {
            currentStep: 'Importação concluída com sucesso',
            totalSteps: 3,
            currentWallet: walletsDetails.length,
            totalWallets: walletsDetails.length,
            percentage: 100
          }
        });
        
        setProgress({
          currentStep: 'Importação concluída com sucesso',
          totalSteps: 3,
          currentWallet: walletsDetails.length,
          totalWallets: walletsDetails.length,
          percentage: 100
        });
        
        toast.success(
          "Importação concluída com sucesso",
          {
            description: `${totalWalletsCreated} carteiras novas, ${transactions.totalImported} transações importadas.`,
          }
        );
      }
      
      // Armazenar o ID da importação para polling (se disponível na resposta)
      if (result.importId) {
        setImportId(result.importId);
        startProgressPolling(result.importId);
      }
      
      router.refresh();
      return result;
    } catch (error: any) {
      console.error("Erro na importação automática:", error);
      setProgress({
        currentStep: 'Erro na importação',
        totalSteps: 3,
        currentWallet: 0,
        totalWallets: 0,
        percentage: 0
      });
      throw error;
    }
  }

  // Função para lidar com erros na importação
  function handleImportError(error: any) {
    console.error("Erro na importação:", error);
    
    let errorMessage = error.message || "Ocorreu um erro durante a importação";
    let errorDescription = "";
    
    // Verificar se é um erro relacionado às credenciais
    if (errorMessage.includes("Configuração incompleta") || 
        errorMessage.includes("GESTAO_CLICK_ACCESS_TOKEN") ||
        errorMessage.includes("token de acesso")) {
      errorMessage = "Credenciais não configuradas";
      errorDescription = "As credenciais do Gestão Click não estão configuradas no ambiente. Verifique o arquivo .env da aplicação.";
    } else if (errorMessage.includes("SyntaxError")) {
      errorMessage = "Erro de configuração";
      errorDescription = "Ocorreu um erro no processamento dos dados. Verifique as configurações do ambiente.";
    }
    
    toast.error(errorMessage, {
      description: errorDescription || error.message || "Tente novamente ou contate o suporte.",
    });
  }

  // Função para enviar o formulário
  async function onSubmit() {
    setIsLoading(true);
    setImportResult(null);
    
    try {
      // Iniciar toast de carregamento
      toast.loading("Iniciando processo de importação automática...");
      
      // Iniciar a importação automática usando credenciais do ambiente
      await startAutoImport();
      
    } catch (error: any) {
      handleImportError(error);
    } finally {
      setIsLoading(false);
      toast.dismiss();
    }
  }

  // Função para iniciar o polling de progresso
  const startProgressPolling = (importId: string) => {
    // Parar o polling anterior se existir
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Função para buscar o progresso atual
    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/import-history/${importId}`);
        
        if (!response.ok) {
          return;
        }
        
        const data = await response.json();
        
        if (data.import) {
          const importData = data.import;
          
          // Extrair metadados
          const metadata = importData.metadata || {};
          const walletsData = metadata.wallets || { 
            fromAccounts: { created: 0, skipped: 0, total: 0 }, 
            fromCostCenters: { created: 0, skipped: 0, total: 0 } 
          };
          const transactionsData = metadata.transactions || { 
            total: 0, imported: 0, skipped: 0, failed: 0 
          };
          
          // Calcular o progresso com base no status e dados
          let currentStep = 'Processando';
          let percentage = 0;
          
          switch (importData.status) {
            case 'PENDING':
              currentStep = 'Aguardando início';
              percentage = 5;
              break;
            case 'IN_PROGRESS':
              // Usar contador de transações para estimar progresso
              if (importData.totalTransactions === 0) {
                // Provavelmente ainda importando carteiras
                currentStep = 'Importando carteiras';
                percentage = 25;
              } else {
                const ratio = importData.importedTransactions / 
                  (importData.totalTransactions > 0 ? importData.totalTransactions : 100);
                percentage = 25 + (ratio * 70); // Entre 25% e 95%
                currentStep = 'Importando transações';
              }
              break;
            case 'COMPLETED':
              currentStep = 'Importação concluída';
              percentage = 100;
              
              // Parar o polling quando concluído
              if (pollingInterval) {
                clearInterval(pollingInterval);
                setPollingInterval(null);
              }
              break;
            case 'FAILED':
              currentStep = 'Erro na importação';
              percentage = 0;
              
              // Parar o polling quando falhar
              if (pollingInterval) {
                clearInterval(pollingInterval);
                setPollingInterval(null);
              }
              break;
          }
          
          // Estimar o número de carteiras com base nos metadados
          const totalWallets = 
            (walletsData.fromAccounts?.total || 0) + 
            (walletsData.fromCostCenters?.total || 0);
          
          // Estimar a carteira atual com base nas transações processadas
          // Assumindo que as transações são processadas sequencialmente por carteira
          const totalTransactions = transactionsData.total || 0;
          const processedTransactions = (transactionsData.imported || 0) + 
                                       (transactionsData.skipped || 0);
          
          let currentWallet = 0;
          if (totalWallets > 0 && totalTransactions > 0) {
            const ratio = processedTransactions / totalTransactions;
            currentWallet = Math.ceil(ratio * totalWallets);
            currentWallet = Math.min(currentWallet, totalWallets);
          }
          
          setProgress({
            currentStep,
            totalSteps: 3,
            currentWallet,
            totalWallets,
            percentage: Math.floor(percentage)
          });
          
          // Se concluído ou falha, criar o objeto de resultado
          if (importData.status === 'COMPLETED') {
            setImportResult({
              wallets: {
                created: (walletsData.fromAccounts?.created || 0) + (walletsData.fromCostCenters?.created || 0),
                existing: (walletsData.fromAccounts?.skipped || 0) + (walletsData.fromCostCenters?.skipped || 0),
                total: totalWallets,
                details: []
              },
              transactions: {
                imported: transactionsData.imported || 0,
                skipped: transactionsData.skipped || 0,
                total: totalTransactions,
                details: []
              },
              progress: {
                currentStep,
                totalSteps: 3,
                currentWallet,
                totalWallets,
                percentage: 100
              }
            });
            
            toast.success("Importação concluída com sucesso!");
            router.refresh();
          }
          
          if (importData.status === 'FAILED') {
            toast.error(`Erro na importação: ${importData.error || 'Ocorreu um erro desconhecido'}`);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar progresso da importação:", error);
      }
    };
    
    // Executar imediatamente e depois a cada 2 segundos
    fetchProgress();
    const interval = setInterval(fetchProgress, 2000);
    setPollingInterval(interval);
  };

  // Função para formatar o número
  function formatNumber(num: number | undefined) {
    if (num === undefined) return '0';
    return num.toLocaleString('pt-BR');
  }

  return (
    <Dialog open={open} onOpenChange={(newState) => {
      // Impedir fechamento enquanto está carregando
      if (isLoading && newState === false) return;
      onOpenChange(newState);
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Importação Completa do Gestão Click</DialogTitle>
              <DialogDescription>
                Importe todos os registros disponíveis de todo o período histórico, evitando duplicações automaticamente
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {progress.percentage > 0 && (
          <div className="space-y-4 my-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="font-medium">Progresso: {Math.floor(progress.percentage)}%</span>
              <span>{progress.currentStep}</span>
            </div>
            
            <div className="relative w-full h-3 bg-secondary/30 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-primary transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
              
              {/* Marcadores de estágios */}
              <div className="absolute top-0 left-0 w-full h-full flex">
                <div className="relative h-full flex-1 border-r border-background/20">
                  <div className={`absolute -top-5 -left-2 w-4 h-4 bg-secondary rounded-full flex items-center justify-center ${progress.currentStep === 'Preparando importação' ? 'ring-2 ring-primary ring-offset-1 ring-offset-background animate-pulse' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${progress.percentage >= 5 ? 'bg-primary' : 'bg-muted'}`} />
                  </div>
                  <span className="absolute -bottom-6 left-0 text-[10px] font-medium">Preparação</span>
                </div>
                <div className="relative h-full flex-1 border-r border-background/20">
                  <div className={`absolute -top-5 -left-2 w-4 h-4 bg-secondary rounded-full flex items-center justify-center ${progress.currentStep === 'Importando carteiras' ? 'ring-2 ring-primary ring-offset-1 ring-offset-background animate-pulse' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${progress.percentage >= 25 ? 'bg-primary' : 'bg-muted'}`} />
                  </div>
                  <span className="absolute -bottom-6 left-0 text-[10px] font-medium">Carteiras</span>
                </div>
                <div className="relative h-full flex-1 border-r border-background/20">
                  <div className={`absolute -top-5 -left-2 w-4 h-4 bg-secondary rounded-full flex items-center justify-center ${progress.currentStep === 'Importando transações' ? 'ring-2 ring-primary ring-offset-1 ring-offset-background animate-pulse' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${progress.percentage >= 50 ? 'bg-primary' : 'bg-muted'}`} />
                  </div>
                  <span className="absolute -bottom-6 left-0 text-[10px] font-medium">Transações</span>
                </div>
                <div className="relative h-full flex-1">
                  <div className={`absolute -top-5 -left-2 w-4 h-4 bg-secondary rounded-full flex items-center justify-center ${progress.currentStep === 'Importação concluída' ? 'ring-2 ring-primary ring-offset-1 ring-offset-background animate-pulse' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${progress.percentage >= 95 ? 'bg-primary' : 'bg-muted'}`} />
                  </div>
                  <span className="absolute -bottom-6 left-0 text-[10px] font-medium">Conclusão</span>
                </div>
              </div>
            </div>
            
            {progress.totalWallets > 0 && (
              <div className="flex justify-between items-center text-xs text-muted-foreground mt-7">
                <span className="font-medium flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  {progress.currentStep}
                  {progress.currentStep === 'Importando transações' && progress.currentWallet > 0 ? (
                    <span className="font-normal ml-1 text-muted-foreground">(Carteira {progress.currentWallet} de {progress.totalWallets})</span>
                  ) : null}
                </span>
                <span className="font-medium">{Math.round(progress.percentage)}%</span>
              </div>
            )}
          </div>
        )}

        {isLoading || importResult ? (
          <div className="space-y-6 py-4">
            {importResult && (
              <>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Carteiras</h3>
                        <StatusBadge>
                          {formatNumber(importResult.wallets.total)} carteiras
                        </StatusBadge>
                      </div>
                      
                      <div className="bg-secondary/50 p-2 rounded text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Novas carteiras:</span>
                          <span className="font-medium">{formatNumber(importResult.wallets.created)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Carteiras existentes:</span>
                          <span className="font-medium">{formatNumber(importResult.wallets.existing)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Transações</h3>
                        <StatusBadge>
                          {formatNumber(importResult.transactions.imported)} importadas
                        </StatusBadge>
                      </div>
                      
                      <div className="bg-secondary/50 p-2 rounded text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Novas transações:</span>
                          <span className="font-medium">{formatNumber(importResult.transactions.imported)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transações ignoradas (duplicadas):</span>
                          <span className="font-medium">{formatNumber(importResult.transactions.skipped)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total processado:</span>
                          <span className="font-medium">{formatNumber(importResult.transactions.total)}</span>
                        </div>
                      </div>
                      
                      {importResult.transactions.details.length > 0 && (
                        <div className="mt-2 max-h-32 overflow-y-auto">
                          <p className="text-xs font-medium mb-1">Detalhes por carteira:</p>
                          <div className="space-y-1">
                            {importResult.transactions.details.map((detail, index) => (
                              <div key={index} className="bg-secondary/30 p-1 rounded text-xs">
                                <div className="font-medium truncate">{detail.walletName}</div>
                                <div className="flex justify-between mt-1">
                                  <span>Importadas:</span>
                                  <span>{formatNumber(detail.newTransactions)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setIsLoading(true);
                      setImportResult(null);
                      onSubmit();
                    }}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Importar Novamente
                  </Button>
                  
                  <Button 
                    type="button" 
                    onClick={() => onOpenChange(false)}
                  >
                    Concluir
                  </Button>
                </div>
              </>
            )}
            
            {isLoading && !importResult && (
              <div className="flex flex-col items-center justify-center py-6 space-y-6">
                <div className="text-center space-y-4">
                  <div className="animate-spin text-primary">
                    <RefreshCw className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="font-medium">{progress.currentStep}</p>
                </div>
                
                <div className="w-full space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Progresso geral: {Math.floor(progress.percentage)}%</span>
                    <span className="text-muted-foreground">Etapa {progress.currentWallet}/{progress.totalWallets || '?'}</span>
                  </div>
                  
                  <div className="relative w-full h-6 bg-secondary/30 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-primary transition-all duration-300 flex items-center justify-center"
                      style={{ width: `${progress.percentage}%` }}
                    >
                      {progress.percentage > 15 && (
                        <span className="text-xs text-white font-medium px-2">{Math.floor(progress.percentage)}%</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-center text-muted-foreground mt-2">
                    {progress.currentStep === 'Importando transações' && progress.currentWallet > 0 && (
                      <p>Processando carteira {progress.currentWallet} de {progress.totalWallets}</p>
                    )}
                  </div>
                  
                  {progress.percentage > 15 && (
                    <div className="bg-primary/10 rounded-lg p-2 mt-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span>Período de importação:</span>
                        <span className="font-medium">Histórico completo (10 anos)</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span>Modo:</span>
                        <span className="font-medium text-primary">Importação sem duplicações</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-muted/50 p-4 rounded-lg mt-4 text-sm">
                    <h4 className="font-medium mb-2">Processo de importação completa</h4>
                    <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
                      <li className={progress.currentStep === 'Importando carteiras' ? 'text-primary font-medium' : 
                           progress.percentage >= 10 ? 'text-muted-foreground line-through' : ''}>
                        Buscando carteiras disponíveis no Gestão Click
                      </li>
                      <li className={progress.currentStep === 'Configurando período de importação' ? 'text-primary font-medium' : 
                           progress.percentage >= 20 ? 'text-muted-foreground line-through' : ''}>
                        Configurando período de importação (últimos 10 anos)
                      </li>
                      <li className={progress.currentStep === 'Importando transações' ? 'text-primary font-medium' : 
                           progress.percentage >= 90 ? 'text-muted-foreground line-through' : ''}>
                        Importando transações para cada carteira
                        
                        {/* Progresso por carteira durante a etapa de importação de transações */}
                        {progress.currentStep === 'Importando transações' && progress.currentWallet > 0 && (
                          <div className="mt-8 bg-secondary/20 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium flex items-center gap-1.5">
                                <Database className="h-3.5 w-3.5" />
                                Progresso por carteira
                              </h3>
                              <span className="text-xs bg-secondary rounded-full px-2 py-0.5 font-medium">
                                {Math.round((progress.currentWallet / progress.totalWallets) * 100)}% 
                                ({progress.currentWallet}/{progress.totalWallets})
                              </span>
                            </div>
                            
                            <div className="relative w-full h-2 bg-secondary/30 rounded-full overflow-hidden">
                              <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                                style={{ width: `${(progress.currentWallet / progress.totalWallets) * 100}%` }}
                              />
                            </div>
                            
                            <div className="space-y-2.5 pt-1">
                              <div className="flex items-center text-xs gap-2">
                                <div className={`w-2 h-2 rounded-full ${progress.percentage >= 60 && progress.percentage < 70 ? 'bg-primary animate-pulse' : 'bg-primary/60'}`} />
                                <span className="flex-grow">Verificação de transações existentes</span>
                              </div>
                              <div className="flex items-center text-xs gap-2">
                                <div className={`w-2 h-2 rounded-full ${progress.percentage >= 70 && progress.percentage < 80 ? 'bg-primary animate-pulse' : 'bg-primary/60'}`} />
                                <span className="flex-grow">Importação de novas transações</span>
                              </div>
                              <div className="flex items-center text-xs gap-2">
                                <div className={`w-2 h-2 rounded-full ${progress.percentage >= 80 && progress.percentage < 90 ? 'bg-primary animate-pulse' : 'bg-primary/60'}`} />
                                <span className="flex-grow">Atualização de categorias</span>
                              </div>
                              <div className="flex items-center text-xs gap-2">
                                <div className={`w-2 h-2 rounded-full ${progress.percentage >= 90 && progress.percentage < 95 ? 'bg-primary animate-pulse' : 'bg-primary/60'}`} />
                                <span className="flex-grow">Registro de data de sincronização</span>
                              </div>
                            </div>
                            
                            {/* Estatísticas em tempo real */}
                            <div className="mt-3 pt-3 border-t border-border/30 flex justify-between items-center">
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <RefreshCw className="h-3 w-3" />
                                Tempo estimado: ~{Math.max(1, Math.ceil((progress.totalWallets - progress.currentWallet) * 2))} min
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Download className="h-3 w-3" />
                                Importando dados de {progress.currentWallet}/{progress.totalWallets}
                              </span>
                            </div>
                          </div>
                        )}
                      </li>
                      <li className={progress.currentStep === 'Importação concluída' ? 'text-primary font-medium' : ''}>
                        Finalizando e salvando dados
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }} className="space-y-5">
              <div className="space-y-4 py-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                    Credenciais automáticas
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    As credenciais para a API do Gestão Click serão obtidas automaticamente do ambiente.
                    Não é necessário inseri-las manualmente.
                  </p>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Configuração necessária
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">
                    Certifique-se que as seguintes variáveis de ambiente estejam configuradas no arquivo <code className="text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-800/30 px-1 py-0.5 rounded">.env</code> da aplicação:
                  </p>
                  <pre className="text-xs bg-amber-100/50 dark:bg-amber-800/20 p-2 rounded overflow-x-auto">
                    GESTAO_CLICK_ACCESS_TOKEN=seu_token_de_acesso{'\n'}
                    GESTAO_CLICK_SECRET_ACCESS_TOKEN=seu_token_secreto{'\n'}
                    GESTAO_CLICK_API_URL=https://api.beteltecnologia.com
                  </pre>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg mt-2">
                  <h3 className="font-medium text-sm mb-2">Sobre a importação completa</h3>
                  <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
                    <li>Importa <strong>todos os registros disponíveis</strong> no Gestão Click</li>
                    <li>Busca dados completos dos últimos 10 anos</li>
                    <li>Evita duplicação através da verificação automática de registros existentes</li>
                    <li>Importa categorias e centros de custo automaticamente</li>
                    <li>Processo otimizado para grandes volumes de dados</li>
                  </ul>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
                >
                  Cancelar
                </Button>
                <Button type="submit" className="gap-2">
                  <Download className="h-4 w-4" />
                  Iniciar Importação Completa
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
} 