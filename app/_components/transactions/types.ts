import { z } from "zod";
import {
  TransactionType,
  TransactionCategory,
  TransactionPaymentMethod,
} from "@prisma/client";

// Schema de validação do formulário
export const transactionFormSchema = z.object({
  name: z.string().trim().min(1, {
    message: "O nome é obrigatório.",
  }),
  amount: z
    .number({
      required_error: "O valor é obrigatório.",
    })
    .positive({
      message: "O valor deve ser positivo.",
    }),
  type: z.nativeEnum(TransactionType, {
    required_error: "O tipo é obrigatório.",
  }),
  category: z.nativeEnum(TransactionCategory, {
    required_error: "A categoria é obrigatória.",
  }),
  paymentMethod: z.nativeEnum(TransactionPaymentMethod, {
    required_error: "O método de pagamento é obrigatório.",
  }),
  date: z.date({
    required_error: "A data é obrigatória.",
  }),
});

// Tipo para os valores do formulário
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

// Props para o componente principal
export interface UpsertTransactionDialogProps {
  isOpen: boolean;
  defaultValues?: TransactionFormValues;
  transactionId?: string;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: () => void;
}

// Props para o componente de formulário
export interface TransactionFormProps {
  defaultValues: TransactionFormValues;
  transactionId?: string;
  onSubmit: (data: TransactionFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
} 