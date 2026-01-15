"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Progress } from "@/app/_components/ui/progress";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  Calendar,
  DollarSign
} from "lucide-react";
import { FinancialMetrics, WalletBalance, FinancialSummary } from "../types";

interface TrendAnalysisProps {
  metrics: FinancialMetrics;
  wallets: WalletBalance[];
  summary: FinancialSummary;
  loading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

function HealthIndicator({ 
  label, 
  value, 
  status, 
  description 
}: { 
  label: string; 
  value: string; 
  status: 'good' | 'warning' | 'critical'; 
  description: string;
}) {
  const statusConfig = {
    good: {
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      badgeColor: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      badgeColor: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800'
    },
    critical: {
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      badgeColor: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
      <div className="flex items-center space-x-3">
        <div className={`rounded-full p-2 ${config.bgColor}`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Badge variant="outline" className={config.badgeColor}>
        {value}
      </Badge>
    </div>
  );
}

export function TrendAnalysis({ metrics, wallets, summary, loading }: TrendAnalysisProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Análise da saúde financeira
  const profitMarginStatus = 
    metrics.profitMargin >= 20 ? 'good' :
    metrics.profitMargin >= 10 ? 'warning' : 'critical';

  const burnRateStatus = 
    metrics.burnRate <= 1000 ? 'good' :
    metrics.burnRate <= 5000 ? 'warning' : 'critical';

  // Calcular distribuição de saldo por carteiras
  const totalWalletBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const diversificationStatus = wallets.length >= 3 ? 'good' : 'warning';

  // Projeção de fluxo de caixa (simplificada)
  const averageDailyExpenses = metrics.burnRate;
  const daysOfCash = summary.totalBalance > 0 && averageDailyExpenses > 0 
    ? Math.floor(summary.totalBalance / averageDailyExpenses) 
    : 0;

  const cashFlowStatus = 
    daysOfCash >= 90 ? 'good' :
    daysOfCash >= 30 ? 'warning' : 'critical';

  return (
    <div className="space-y-6">
      {/* Saúde Financeira */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Saúde Financeira</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <HealthIndicator
              label="Margem de Lucro"
              value={`${metrics.profitMargin.toFixed(1)}%`}
              status={profitMarginStatus}
              description="Percentual de lucro sobre as receitas"
            />
            
            <HealthIndicator
              label="Taxa de Queima (Burn Rate)"
              value={formatCurrency(metrics.burnRate)}
              status={burnRateStatus}
              description="Gasto médio por dia"
            />
            
            <HealthIndicator
              label="Diversificação de Carteiras"
              value={`${wallets.length} carteiras`}
              status={diversificationStatus}
              description="Distribuição de recursos"
            />
            
            <HealthIndicator
              label="Reserva de Emergência"
              value={`${daysOfCash} dias`}
              status={cashFlowStatus}
              description="Tempo de cobertura com gastos atuais"
            />
          </div>
        </CardContent>
      </Card>

      {/* Distribuição por Carteiras */}
      {wallets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Distribuição por Carteiras</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {wallets.map((wallet, index) => {
                const percentage = totalWalletBalance > 0 
                  ? (wallet.balance / totalWalletBalance) * 100 
                  : 0;
                
                return (
                  <div key={wallet.walletId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{wallet.walletName}</p>
                        <p className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}% do total
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {formatCurrency(wallet.balance)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Atualizado: {new Date(wallet.lastUpdate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                  </div>
                );
              })}
              
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Geral</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(totalWalletBalance)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights e Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Insights e Recomendações</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Insight baseado na margem de lucro */}
            {metrics.profitMargin < 10 && (
              <div className="p-4 rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200">
                      Margem de Lucro Baixa
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Sua margem de lucro está abaixo de 10%. Considere revisar suas despesas ou aumentar suas receitas.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Insight baseado no burn rate */}
            {metrics.burnRate > 5000 && (
              <div className="p-4 rounded-lg border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                <div className="flex items-start space-x-3">
                  <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800 dark:text-orange-200">
                      Alta Taxa de Queima
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      Seus gastos diários estão altos. Revise suas despesas recorrentes e considere otimizações.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Insight positivo */}
            {metrics.profitMargin >= 20 && daysOfCash >= 90 && (
              <div className="p-4 rounded-lg border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200">
                      Excelente Saúde Financeira
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Parabéns! Sua margem de lucro e reserva de emergência estão em níveis ideais.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recomendação de diversificação */}
            {wallets.length < 3 && (
              <div className="p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">
                      Diversifique suas Carteiras
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Considere criar mais carteiras para melhor organização e controle dos seus recursos.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}