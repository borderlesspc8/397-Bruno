import * as z from 'zod';
import { ReactNode } from 'react';

// Esquema de validação para transações
export const transactionFormSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(3, {
    message: 'A descrição deve ter pelo menos 3 caracteres.',
  }),
  amount: z.coerce.number().positive({
    message: 'O valor deve ser maior que zero.',
  }),
  date: z.date({
    required_error: 'Por favor, selecione uma data.',
  }),
  type: z.enum(['income', 'expense', 'investment', 'transfer'], {
    required_error: 'Por favor, selecione um tipo de transação.',
  }),
  categoryId: z.string().optional(),
  walletId: z.string({
    required_error: 'Por favor, selecione uma carteira.',
  }),
  destinationWalletId: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isRecurrent: z.boolean().default(false),
  recurrenceInterval: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']).optional(),
  recurrenceEndDate: z.date().optional(),
  paymentMethod: z.string().optional(),
  attachment: z.any().optional(),
});

// Tipo inferido do esquema de validação
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

// Tipos para as categorias
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'investment' | 'transfer' | 'all';
  icon?: ReactNode;
  color?: string;
}

// Tipos para as carteiras
export interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: string;
  icon?: ReactNode;
  color?: string;
}

// Tipos para métodos de pagamento
export interface TransactionPaymentMethod {
  id: string;
  name: string;
  icon?: ReactNode;
} 