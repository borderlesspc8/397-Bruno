"use client";

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  TransactionFormValues, 
  TransactionType, 
  TransactionCategory, 
  TransactionPaymentMethod 
} from '@/app/_types/transaction';
import { formatDateForStorage } from '@/app/_utils/date-formatter';
import { useToast } from '@/app/_components/ui/use-toast';
import { useErrorHandler } from '@/app/_hooks/error/use-error-handler';
import { useNotificationMiddleware } from '@/app/_hooks/notification';
import { NotificationType, NotificationPriority } from '@/app/_types/notification';

// Schema Zod para validação de transações
const transactionSchema = z.object({
  description: z.string()
    .min(1, { message: 'A descrição é obrigatória' })
    .max(100, { message: 'A descrição deve ter no máximo 100 caracteres' }),
  
  amount: z.number({ 
    required_error: 'O valor é obrigatório', 
    invalid_type_error: 'O valor deve ser um número' 
  })
  .positive({ message: 'O valor deve ser maior que zero' }),
  
  date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data inválida' }),
    z.date()
  ]),
  
  type: z.enum([
    TransactionType.EXPENSE, 
    TransactionType.INCOME, 
    TransactionType.TRANSFER, 
    TransactionType.INVESTMENT
  ], { 
    required_error: 'O tipo é obrigatório',
    invalid_type_error: 'Tipo de transação inválido' 
  }),
  
  category: z.union([
    z.nativeEnum(TransactionCategory),
    z.string().min(1, { message: 'A categoria é obrigatória' })
  ]),
  
  walletId: z.string().min(1, { message: 'A carteira é obrigatória' }),
  
  paymentMethod: z.nativeEnum(TransactionPaymentMethod, { 
    required_error: 'O método de pagamento é obrigatório',
    invalid_type_error: 'Método de pagamento inválido' 
  }),
  
  notes: z.string().optional(),
  
  isRecurring: z.boolean().optional(),
  
  tags: z.array(z.string()).optional(),
});

export type TransactionFormSchema = z.infer<typeof transactionSchema>;

interface UseTransactionFormProps {
  initialData?: Partial<TransactionFormValues>;
  onSubmitSuccess?: (data: TransactionFormValues) => void;
  onSubmitError?: (error: any) => void;
}

interface UseTransactionFormReturn {
  form: ReturnType<typeof useForm<TransactionFormSchema>>;
  isLoading: boolean;
  submitForm: (values: TransactionFormSchema) => Promise<void>;
  resetForm: () => void;
}

/**
 * Hook para gerenciar formulários de transação
 */
export function useTransactionForm({
  initialData,
  onSubmitSuccess,
  onSubmitError
}: UseTransactionFormProps = {}): UseTransactionFormReturn {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const { notifyEvent } = useNotificationMiddleware();
  
  // Criar as configurações padrão para o formulário
  const defaultValues: Partial<TransactionFormSchema> = {
    description: '',
    amount: 0,
    date: new Date(),
    type: TransactionType.EXPENSE,
    category: TransactionCategory.OTHER,
    paymentMethod: TransactionPaymentMethod.OTHER,
    isRecurring: false,
    tags: [],
    ...initialData
  };
  
  // Inicializar o formulário
  const form = useForm<TransactionFormSchema>({
    resolver: zodResolver(transactionSchema),
    defaultValues
  });
  
  // Manipular envio do formulário
  const submitForm = useCallback(async (values: TransactionFormSchema) => {
    setIsLoading(true);
    
    try {
      // Formatar a data para armazenamento
      const formattedValues = {
        ...values,
        date: values.date instanceof Date 
          ? formatDateForStorage(values.date) 
          : values.date
      };
      
      // Enviar para a API
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar transação');
      }
      
      const data = await response.json();
      
      // Mostrar toast de sucesso
      toast({
        title: 'Sucesso',
        description: 'Transação salva com sucesso',
      });
      
      // Adicionar notificação de evento
      notifyEvent({
        title: 'Nova transação registrada',
        message: `${values.description} - R$ ${values.amount.toFixed(2)}`,
        type: NotificationType.TRANSACTION,
        priority: NotificationPriority.LOW,
        link: '/dashboard/transactions',
        metadata: {
          transactionId: data.id,
          transactionType: values.type,
          amount: values.amount
        }
      });
      
      // Chamar callback de sucesso se existir
      if (onSubmitSuccess) {
        onSubmitSuccess(formattedValues);
      }
      
      // Resetar formulário
      form.reset(defaultValues);
      
    } catch (error) {
      // Usar o tratamento de erro centralizado
      handleError(error, {
        type: 'transaction',
        component: 'TransactionForm',
        action: 'create',
        data: values
      }, 'Falha ao salvar a transação');
      
      // Ainda mostrar toast para feedback imediato
      toast({
        title: 'Erro',
        description: error instanceof Error 
          ? error.message 
          : 'Ocorreu um erro ao salvar a transação',
        variant: 'destructive',
      });
      
      // Chamar callback de erro se existir
      if (onSubmitError) {
        onSubmitError(error);
      }
      
    } finally {
      setIsLoading(false);
    }
  }, [form, toast, defaultValues, onSubmitSuccess, onSubmitError, handleError, notifyEvent]);
  
  // Função para resetar o formulário
  const resetForm = useCallback(() => {
    form.reset(defaultValues);
  }, [form, defaultValues]);
  
  return {
    form,
    isLoading,
    submitForm,
    resetForm
  };
} 