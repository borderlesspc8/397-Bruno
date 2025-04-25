"use client";

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent
} from './ui/dialog';
import { Loader2 } from 'lucide-react';
import { TransactionQuickForm } from './transactions/transaction-quick-form';
import { TransactionFormValues, Category, Wallet as WalletType, TransactionPaymentMethod } from './transactions/transaction-schema';
import { toast } from 'sonner';

// Importando categorias e carteiras padrão
import { 
  ALL_CATEGORIES, 
  DEFAULT_WALLETS, 
  DEFAULT_PAYMENT_METHODS 
} from '../_lib/default-categories';

export interface TransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: {
    type?: 'expense' | 'income' | 'investment' | 'transfer';
  };
}

export function TransactionDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  initialData = {}
}: TransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>(ALL_CATEGORIES);
  const [wallets, setWallets] = useState<WalletType[]>(DEFAULT_WALLETS);
  const [paymentMethods, setPaymentMethods] = useState<TransactionPaymentMethod[]>(DEFAULT_PAYMENT_METHODS);

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Carregar dados necessários para o formulário
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carregar categorias
      const categoriesResponse = await fetch('/api/categories');
      const categoriesData = await categoriesResponse.json();
      
      // Carregar carteiras
      const walletsResponse = await fetch('/api/wallets');
      const walletsData = await walletsResponse.json();
      
      // Definir dados - usar dados da API se disponíveis, caso contrário usar os padrões
      const apiCategories = categoriesData.categories || [];
      const apiWallets = walletsData.wallets || [];
      
      setCategories(apiCategories.length > 0 ? apiCategories : ALL_CATEGORIES);
      setWallets(apiWallets.length > 0 ? apiWallets : DEFAULT_WALLETS);
      setPaymentMethods(DEFAULT_PAYMENT_METHODS);
      
      // Log para debug
      console.log("Carteiras carregadas:", apiWallets.length > 0 ? apiWallets : DEFAULT_WALLETS);
      console.log("Categorias carregadas:", apiCategories.length > 0 ? apiCategories : ALL_CATEGORIES);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Usando dados padrão porque não foi possível carregar do servidor');
      // Em caso de erro, usar os dados padrão
      setCategories(ALL_CATEGORIES);
      setWallets(DEFAULT_WALLETS);
      setPaymentMethods(DEFAULT_PAYMENT_METHODS);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (data: TransactionFormValues) => {
    setIsLoading(true);
    try {
      // Log dos dados do formulário para depuração
      console.log("Dados do formulário:", data);
      
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao criar transação');
      }
      
      toast.success('Transação criada com sucesso!');
      
      // Fechar o modal
      onOpenChange(false);
      
      // Chamar o callback de sucesso se existir
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast.error('Erro ao salvar a transação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0" hideCloseButton>
        {isLoading && categories.length === 0 ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <TransactionQuickForm
            initialData={{ type: initialData?.type }}
            onSubmit={handleSubmit}
            categories={categories}
            wallets={wallets}
            paymentMethods={paymentMethods}
            isLoading={isLoading}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
} 