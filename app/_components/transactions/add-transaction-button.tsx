"use client";

import { useState } from 'react';
import { 
  ActionButton, 
  ActionItem 
} from '@/app/_components/common/action-button';
import { 
  TransactionType,
  TransactionFormValues
} from '@/app/_types/transaction';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  PiggyBank, 
  RefreshCw,
  Plus 
} from 'lucide-react';
import { Dialog, DialogContent } from '@/app/_components/ui/dialog';
import { TransactionForm } from './transaction-form';

export interface AddTransactionButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  fullWidth?: boolean;
  showIcon?: boolean;
  showText?: boolean;
  text?: string;
  onSuccess?: () => void;
}

/**
 * Botão para adicionar novas transações
 */
export function AddTransactionButton({
  variant = 'default',
  size = 'default',
  className = '',
  fullWidth = false,
  showIcon = true,
  showText = true,
  text = 'Nova Transação',
  onSuccess
}: AddTransactionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.EXPENSE);
  
  // Definir os itens do menu
  const actionItems: ActionItem[] = [
    {
      id: 'expense',
      label: 'Nova Despesa',
      icon: <ArrowUpRight className="h-4 w-4 text-red-500" />,
      onClick: () => {
        setTransactionType(TransactionType.EXPENSE);
        setIsModalOpen(true);
      },
      className: "hover:bg-red-50 dark:hover:bg-red-950/30"
    },
    {
      id: 'income',
      label: 'Nova Receita',
      icon: <ArrowDownRight className="h-4 w-4 text-emerald-500" />,
      onClick: () => {
        setTransactionType(TransactionType.INCOME);
        setIsModalOpen(true);
      },
      className: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
    },
    {
      id: 'investment',
      label: 'Novo Investimento',
      icon: <PiggyBank className="h-4 w-4 text-blue-500" />,
      onClick: () => {
        setTransactionType(TransactionType.INVESTMENT);
        setIsModalOpen(true);
      },
      className: "hover:bg-blue-50 dark:hover:bg-blue-950/30"
    },
    {
      id: 'transfer',
      label: 'Nova Transferência',
      icon: <RefreshCw className="h-4 w-4 text-purple-500" />,
      onClick: () => {
        setTransactionType(TransactionType.TRANSFER);
        setIsModalOpen(true);
      },
      className: "hover:bg-purple-50 dark:hover:bg-purple-950/30"
    }
  ];
  
  // Manipular o sucesso na submissão da transação
  const handleSuccess = () => {
    setIsModalOpen(false);
    if (onSuccess) onSuccess();
  };
  
  return (
    <>
      <ActionButton
        text={text}
        icon={<Plus className="h-4 w-4" />}
        items={actionItems}
        variant={variant}
        size={size}
        className={className}
        fullWidth={fullWidth}
        showIcon={showIcon}
        showText={showText}
        onMainAction={() => {
          setTransactionType(TransactionType.EXPENSE);
          setIsModalOpen(true);
        }}
      />
      
      <Dialog 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
      >
        <DialogContent className="max-w-md p-0">
          <TransactionForm
            initialData={{ type: transactionType }}
            onSuccess={handleSuccess}
            onCancel={() => setIsModalOpen(false)}
            headerTitle={
              transactionType === TransactionType.EXPENSE ? 'Nova Despesa' :
              transactionType === TransactionType.INCOME ? 'Nova Receita' :
              transactionType === TransactionType.INVESTMENT ? 'Novo Investimento' :
              'Nova Transferência'
            }
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 