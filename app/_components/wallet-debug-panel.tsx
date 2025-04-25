'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/app/_components/ui/alert';
import { Skeleton } from '@/app/_components/ui/skeleton';
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, X, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/app/_lib/utils';

interface WalletDebugPanelProps {
  walletId: string;
}

/**
 * Componente de depuração para verificar e corrigir o saldo de carteiras
 * Usado temporariamente para diagnosticar problemas de cálculo de saldo
 */
export function WalletDebugPanel({ walletId }: WalletDebugPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [visible, setVisible] = useState(true);

  // Função para verificar o saldo da carteira
  const verifyWalletBalance = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/wallets/${walletId}/details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Erro ao verificar saldo: ${response.status}`);
      }

      const data = await response.json();
      setWalletInfo(data.wallet);
    } catch (err) {
      console.error('Erro ao verificar saldo da carteira:', err);
      setError((err as Error).message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Verificar o saldo ao montar o componente
  useEffect(() => {
    verifyWalletBalance();
  }, []);

  // Se o componente foi fechado, não renderizar nada
  if (!visible) return null;

  return (
    <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/30 shadow-md mb-6">
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg text-orange-700 dark:text-orange-400">
            Depuração de Saldo da Carteira
          </CardTitle>
          <CardDescription className="text-orange-600 dark:text-orange-400/80">
            Use este painel para verificar o cálculo de saldo
          </CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-orange-700 hover:text-orange-800 hover:bg-orange-200/50 dark:text-orange-400 dark:hover:bg-orange-800/20"
          onClick={() => setVisible(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center space-x-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Verificando saldo da carteira...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && walletInfo && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Saldo Armazenado</p>
                <p className="text-lg font-semibold">{formatCurrency(walletInfo.balance)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Saldo Calculado</p>
                <p className="text-lg font-semibold">{formatCurrency(walletInfo.calculatedBalance)}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-black/20 p-3 rounded-md">
              <p className="text-sm font-medium">Informações de Depuração</p>
              <ul className="space-y-1 text-sm mt-1">
                <li className="flex items-center gap-1">
                  <span className="text-muted-foreground">ID da Carteira:</span>
                  <span className="font-mono text-xs">{walletInfo.id}</span>
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-muted-foreground">Total de Transações:</span>
                  <span>{walletInfo.transactionCount || 'N/A'}</span>
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-muted-foreground">Diferença:</span>
                  <span>
                    {formatCurrency(Math.abs(walletInfo.calculatedBalance - walletInfo.balance))}
                    {Math.abs(walletInfo.calculatedBalance - walletInfo.balance) > 0.01 ? (
                      <span className="text-red-600 dark:text-red-400 ml-1">Discrepância!</span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400 ml-1">OK</span>
                    )}
                  </span>
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-muted-foreground">Saldo Corrigido:</span>
                  {walletInfo.balanceWasUpdated ? (
                    <span className="flex items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="h-3 w-3 mr-1" /> Sim
                    </span>
                  ) : (
                    <span className="flex items-center text-orange-600 dark:text-orange-400">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Não
                    </span>
                  )}
                </li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={verifyWalletBalance} 
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 text-white w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Verificar Saldo Novamente
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 