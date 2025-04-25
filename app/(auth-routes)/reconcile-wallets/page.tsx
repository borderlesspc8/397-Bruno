'use client'

import { useEffect, useState } from 'react';
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/app/_components/ui/use-toast";
import { Badge } from '@/app/_components/ui/badge';
import { Separator } from '@/app/_components/ui/separator';
import { formatCurrency } from '@/app/_lib/utils';

type ReconcileResult = {
  walletId: string;
  name: string;
  oldBalance: number;
  newBalance: number;
  difference: number;
  updated: boolean;
  error?: string;
};

type ReconcileResponse = {
  success: boolean;
  message: string;
  results: {
    total: number;
    updated: number;
    details: ReconcileResult[];
  };
};

export default function ReconcileWalletsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ReconcileResponse | null>(null);
  const { toast } = useToast();

  async function reconcileAllWallets() {
    setIsLoading(true);
    setResults(null);
    
    try {
      const response = await fetch('/api/wallets/reconcile-all', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao reconciliar carteiras');
      }
      
      const data = await response.json();
      setResults(data);
      
      toast({
        title: "Reconciliação finalizada",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Erro ao reconciliar carteiras:", error);
      toast({
        title: "Erro",
        description: "Não foi possível reconciliar os saldos das carteiras.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Reconciliação de Saldos</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Reconciliar Saldos de Carteiras
          </CardTitle>
          <CardDescription>
            Essa ferramenta verifica e corrige discrepâncias entre os saldos exibidos e os saldos calculados com base nas transações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Ao clicar no botão abaixo, o sistema irá:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Recalcular o saldo de cada carteira com base em suas transações</li>
            <li>Identificar carteiras com saldos incorretos</li>
            <li>Corrigir os saldos para garantir que todos estejam exibindo o valor correto</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Este processo pode levar alguns segundos para ser concluído, dependendo do número de carteiras e transações.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={reconcileAllWallets} 
            disabled={isLoading} 
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconciliar Todos os Saldos
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.results.updated > 0 ? (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              Resultados da Reconciliação
            </CardTitle>
            <CardDescription>
              {results.results.updated} de {results.results.total} carteiras foram atualizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.results.details.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 font-medium text-sm text-muted-foreground">
                  <div>Carteira</div>
                  <div>Saldo Anterior</div>
                  <div>Saldo Atual</div>
                </div>
                <Separator />
                
                {results.results.details.map((result) => (
                  <div key={result.walletId} className="grid grid-cols-3 items-center py-2">
                    <div className="flex items-center gap-2">
                      {result.updated ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
                          Corrigido
                        </Badge>
                      ) : result.error ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
                          Erro
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                          Correto
                        </Badge>
                      )}
                      <span className="font-medium">{result.name}</span>
                    </div>
                    <div className={result.updated ? "text-amber-600" : ""}>
                      {formatCurrency(result.oldBalance)}
                    </div>
                    <div className={result.updated ? "font-medium text-green-600" : ""}>
                      {result.error ? "-" : formatCurrency(result.newBalance)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">
                Nenhuma carteira encontrada para reconciliar.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 