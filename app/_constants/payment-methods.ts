/**
 * Enum para métodos de pagamento na aplicação
 * Este enum substitui o TransactionPaymentMethod que foi removido do Prisma client
 */
export const PaymentMethods = {
  CREDIT_CARD: "CREDIT_CARD",
  DEBIT_CARD: "DEBIT_CARD",
  BANK_TRANSFER: "BANK_TRANSFER",
  BANK_SLIP: "BANK_SLIP",
  BOLETO: "BOLETO", // Adicionado para compatibilidade com o novo enum
  CASH: "CASH",
  PIX: "PIX",
  OTHER: "OTHER"
} as const;

export type PaymentMethod = keyof typeof PaymentMethods;

// Mapeamento de métodos de pagamento para rótulos legíveis
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Transferência Bancária",
  BANK_SLIP: "Boleto Bancário",
  BOLETO: "Boleto Bancário",
  CASH: "Dinheiro",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  OTHER: "Outros",
  PIX: "Pix",
};

// Mapeamento de métodos de pagamento para ícones
export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  CREDIT_CARD: "credit-card.svg",
  DEBIT_CARD: "debit-card.svg",
  BANK_TRANSFER: "bank-transfer.svg",
  BANK_SLIP: "bank-slip.svg",
  BOLETO: "bank-slip.svg",
  CASH: "money.svg",
  PIX: "pix.svg",
  OTHER: "other.svg",
}; 
