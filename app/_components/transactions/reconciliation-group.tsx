import { useState } from 'react';
import { Transaction } from '@prisma/client';
import { TransactionCard } from './transaction-card';
import { Button } from '@/app/_components/ui/button';
import { useTransactionReconciliation } from '@/app/_hooks/use-transaction-reconciliation';
import { formatCurrency } from '@/app/_lib/utils';

interface ReconciliationGroupProps {
  code: string;
  transactions: (Transaction & {
    metadata?: {
      reconciliationData?: {
        isPartOfGroup?: boolean;
        groupSize?: number;
        groupCode?: string;
        groupTransactions?: string[];
        isManual?: boolean;
        date?: string;
      };
      [key: string]: any;
    };
  })[];
  onReconciliation?: () => void;
}

export function ReconciliationGroup({ code, transactions, onReconciliation }: ReconciliationGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { reconcileTransactions, isLoading } = useTransactionReconciliation({
    onSuccess: onReconciliation,
  });

  const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const handleReconcile = async () => {
    try {
      await reconcileTransactions(code, transactions.map(t => t.id));
    } catch (error) {
      // Erro já é tratado no hook
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Código: {code}</h3>
          <p className="text-sm text-muted-foreground">
            {transactions.length} transação{transactions.length !== 1 ? 'es' : ''} • 
            Total: {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Recolher' : 'Expandir'}
          </Button>
          <Button
            size="sm"
            onClick={handleReconcile}
            disabled={isLoading}
          >
            {isLoading ? 'Conciliando...' : 'Conciliar'}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {transactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              id={transaction.id}
              description={transaction.description || ''}
              amount={Number(transaction.amount)}
              date={transaction.date}
              category={transaction.category || ''}
              paymentMethod={transaction.paymentMethod || ''}
              type={transaction.type}
              isReconciled={transaction.isReconciled}
              metadata={transaction.metadata}
            />
          ))}
        </div>
      )}
    </div>
  );
} 