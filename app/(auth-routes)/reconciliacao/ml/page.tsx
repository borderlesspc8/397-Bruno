"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { Loader2, Brain, FileSpreadsheet, Wallet } from "lucide-react";
import { Badge } from "@/app/_components/ui/badge";
import { toast } from "sonner";
import { Progress } from "@/app/_components/ui/progress";
import { useWallets } from "@/app/_hooks/use-wallets";
import { formatCurrency } from "@/app/_lib/formatters";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";

export default function MLReconciliationPage() {
  const { wallets, isLoading: isLoadingWallets } = useWallets();

  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 dias atrás
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingModel, setIsCheckingModel] = useState(true);
  const [modelStatus, setModelStatus] = useState<{
    isReady: boolean;
    trainingMatches: number;
    minRequired: number;
  } | null>(null);
  const [result, setResult] = useState<any>(null);

  // Verificar status do modelo ao carregar a página
  const checkModelStatus = async () => {
    try {
      setIsCheckingModel(true);
      const response = await fetch("/api/reconciliation/ml");
      
      if (!response.ok) {
        throw new Error("Falha ao verificar status do modelo");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setModelStatus({
          isReady: data.data.isModelReady,
          trainingMatches: data.data.trainingMatches,
          minRequired: data.data.minTrainingRequired
        });
      }
    } catch (error) {
      console.error("Erro ao verificar status do modelo:", error);
      toast.error("Não foi possível verificar status do modelo de ML");
    } finally {
      setIsCheckingModel(false);
    }
  };

  // Verificar status do modelo ao montar o componente
  useEffect(() => {
    checkModelStatus();
  }, []);

  const handleReconciliation = async () => {
    if (!startDate || !endDate) {
      toast.error("Selecione o período para conciliação");
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);

      const response = await fetch("/api/reconciliation/ml", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          walletId: selectedWallet === "all" ? undefined : selectedWallet,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha na conciliação automática");
      }

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
        toast.success(`Conciliação finalizada: ${data.data.matched} correspondências encontradas`);
      } else {
        throw new Error(data.error || "Falha na conciliação automática");
      }
    } catch (error: any) {
      console.error("Erro na conciliação:", error);
      toast.error(error.message || "Erro ao executar conciliação automática");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatus = () => {
    checkModelStatus();
    toast.info("Atualizando status do modelo...");
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conciliação Inteligente com ML</h1>
          <p className="text-muted-foreground">
            Use inteligência artificial para conciliar vendas com transações bancárias
          </p>
        </div>
        
        {!isCheckingModel && modelStatus && (
          <Badge 
            variant={modelStatus.isReady ? "success" : "destructive"}
            className="px-3 py-1 text-sm"
          >
            <Brain className="w-4 h-4 mr-1" />
            {modelStatus.isReady 
              ? "Modelo ML pronto" 
              : "Modelo em treinamento"}
          </Badge>
        )}
      </div>

      {!isCheckingModel && modelStatus && !modelStatus.isReady && (
        <Alert>
          <Brain className="h-4 w-4" />
          <AlertTitle>Modelo de ML em treinamento</AlertTitle>
          <AlertDescription>
            O modelo de aprendizado de máquina precisa de mais dados para funcionar com precisão.
            Atualmente temos {modelStatus.trainingMatches} de {modelStatus.minRequired} correspondências 
            necessárias para o treinamento. Continue conciliando manualmente para melhorar o modelo.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Conciliação Automática com Machine Learning
          </CardTitle>
          <CardDescription>
            Selecione o período e a carteira para realizar a conciliação automática
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <DatePicker
                date={startDate}
                setDate={setStartDate}
                className="w-full"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <DatePicker
                date={endDate}
                setDate={setEndDate}
                className="w-full"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Carteira (opcional)</label>
              <Select
                value={selectedWallet}
                onValueChange={setSelectedWallet}
                disabled={isLoading || isLoadingWallets}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as carteiras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as carteiras</SelectItem>
                  {wallets?.map((wallet: { id: string; name: string }) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={refreshStatus}
            disabled={isCheckingModel}
          >
            {isCheckingModel ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando modelo...
              </>
            ) : (
              <>Verificar status do modelo</>
            )}
          </Button>
          <Button 
            onClick={handleReconciliation}
            disabled={isLoading || (!modelStatus?.isReady && !result)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>Conciliar Automaticamente</>
            )}
          </Button>
        </CardFooter>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Conciliação</CardTitle>
            <CardDescription>
              Foram processadas {result.totalProcessed} vendas no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Conciliadas</div>
                <div className="text-2xl font-bold">{result.matched}</div>
                <Progress 
                  value={result.totalProcessed ? (result.matched / result.totalProcessed) * 100 : 0}
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Não Conciliadas</div>
                <div className="text-2xl font-bold">{result.unmatched}</div>
                <Progress 
                  value={result.totalProcessed ? (result.unmatched / result.totalProcessed) * 100 : 0}
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Taxa de Sucesso</div>
                <div className="text-2xl font-bold">
                  {result.totalProcessed 
                    ? ((result.matched / result.totalProcessed) * 100).toFixed(1) + "%" 
                    : "0%"}
                </div>
              </div>
            </div>

            {result.details && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm font-medium">Vendas Processadas</div>
                  <div className="text-xl">{result.details.salesProcessed}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Transações Processadas</div>
                  <div className="text-xl">{result.details.transactionsProcessed}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Novas Associações</div>
                  <div className="text-xl">{result.details.newLinksCreated}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Sem Correspondência</div>
                  <div className="text-xl">{result.details.noMatchFound}</div>
                </div>
              </div>
            )}

            {result.details?.mlConfidence && (
              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">Confiança do Modelo ML</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-muted p-2">
                    <div className="text-xs text-muted-foreground">Média</div>
                    <div className="font-medium">
                      {(result.details.mlConfidence.average * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <div className="text-xs text-muted-foreground">Mínima</div>
                    <div className="font-medium">
                      {(result.details.mlConfidence.min * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <div className="text-xs text-muted-foreground">Máxima</div>
                    <div className="font-medium">
                      {(result.details.mlConfidence.max * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 