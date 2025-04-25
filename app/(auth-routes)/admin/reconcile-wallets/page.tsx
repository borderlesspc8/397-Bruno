"use client";

import { useState } from "react";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function ReconcileWalletsPage() {
  const [isReconciling, setIsReconciling] = useState(false);
  const [results, setResults] = useState<any>(null);

  const reconcileAllWallets = async () => {
    setIsReconciling(true);
    setResults(null);

    try {
      const response = await fetch("/api/wallets/fix-balances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao reconciliar carteiras: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
      
      toast.success(
        `Reconciliação concluída: ${data.updatedCount} de ${data.totalWallets} carteiras atualizadas`
      );
    } catch (error) {
      console.error("Erro ao reconciliar carteiras:", error);
      toast.error("Erro ao reconciliar carteiras");
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Reconciliação de Carteiras</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Corrigir Saldos de Carteiras</CardTitle>
          <CardDescription>
            Esta ferramenta reconcilia o saldo de todas as carteiras com base nas transações registradas. 
            Use esta função se você perceber discrepâncias nos saldos exibidos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={reconcileAllWallets} 
            disabled={isReconciling}
            className="w-full sm:w-auto"
          >
            {isReconciling ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Reconciliando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconciliar Todas as Carteiras
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Reconciliação</CardTitle>
            <CardDescription>
              {results.updatedCount > 0 
                ? `${results.updatedCount} de ${results.totalWallets} carteiras foram atualizadas.`
                : `Nenhuma carteira precisou ser atualizada. Todos os ${results.totalWallets} saldos estão corretos.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.results?.map((result: any) => (
                <div 
                  key={result.walletId} 
                  className={`p-4 border rounded-lg ${
                    result.wasUpdated 
                      ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20" 
                      : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
                  }`}
                >
                  <div className="flex items-start">
                    {result.wasUpdated ? (
                      <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400 mr-2 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5" />
                    )}
                    <div>
                      <h3 className="font-medium">{result.wallet.name}</h3>
                      {result.wasUpdated ? (
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Saldo corrigido de {formatCurrency(result.storedBalance)} para {formatCurrency(result.calculatedBalance)}
                        </p>
                      ) : (
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Saldo correto: {formatCurrency(result.storedBalance)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
} 