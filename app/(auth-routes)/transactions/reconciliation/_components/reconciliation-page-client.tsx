'use client';

import { useEffect, useState } from 'react';
import { Transaction } from '@prisma/client';
import { ReconciliationGroup } from '@/app/_components/transactions/reconciliation-group';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';

interface GroupedTransactions {
  [code: string]: (Transaction & {
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
}

export function ReconciliationPageClient() {
  const [transactions, setTransactions] = useState<(Transaction & {
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
  })[]>([]);
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransactions>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unreconciled'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    groupTransactions();
  }, [transactions, searchTerm, filterType]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Erro ao buscar transações');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupTransactions = () => {
    const filtered = transactions.filter(transaction => {
      const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || !transaction.isReconciled;
      return matchesSearch && matchesFilter;
    });

    const grouped = filtered.reduce((acc, transaction) => {
      const code = transaction.metadata?.reconciliationData?.groupCode || transaction.description;
      if (!code) return acc;
      
      if (!acc[code]) {
        acc[code] = [];
      }
      acc[code].push(transaction);
      return acc;
    }, {} as GroupedTransactions);

    setGroupedTransactions(grouped);
  };

  const handleReconciliation = () => {
    fetchTransactions();
  };

  if (isLoading) {
    return <div>Carregando transações...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Buscar por descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Label htmlFor="filter">Filtrar</Label>
          <Select value={filterType} onValueChange={(value: 'all' | 'unreconciled') => setFilterType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="unreconciled">Não conciliadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedTransactions).map(([code, transactions]) => (
          <ReconciliationGroup
            key={code}
            code={code}
            transactions={transactions}
            onReconciliation={handleReconciliation}
          />
        ))}
      </div>

      {Object.keys(groupedTransactions).length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          Nenhuma transação encontrada para conciliação
        </div>
      )}
    </div>
  );
} 