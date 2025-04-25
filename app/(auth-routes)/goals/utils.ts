import { GoalCategory, GoalStatus } from "./types";

/**
 * Calcula a porcentagem de progresso de uma meta
 */
export const calculateProgress = (currentAmount: number, targetAmount: number): number => {
  return Math.min(Math.round((currentAmount / targetAmount) * 100), 100);
};

/**
 * Formata um valor monetário no padrão brasileiro
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

/**
 * Formata valor monetário a partir de um campo de input
 */
export const formatCurrencyInput = (value: string): string => {
  const onlyNumbers = value.replace(/\D/g, "");
  const number = parseInt(onlyNumbers) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number || 0);
};

/**
 * Converte valor formatado para número
 */
export const currencyToNumber = (value: string): number => {
  return parseFloat(value.replace(/[^\d,]/g, "").replace(",", "."));
};

/**
 * Retorna a classe CSS para a cor de fundo do status
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case GoalStatus.IN_PROGRESS:
      return "bg-blue-500";
    case GoalStatus.COMPLETED:
      return "bg-green-500";
    case GoalStatus.CANCELED:
      return "bg-gray-500";
    case GoalStatus.OVERDUE:
      return "bg-red-500";
    default:
      return "bg-blue-500";
  }
};

/**
 * Retorna o label localizado para o status
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case GoalStatus.IN_PROGRESS:
      return "Em Progresso";
    case GoalStatus.COMPLETED:
      return "Concluída";
    case GoalStatus.CANCELED:
      return "Cancelada";
    case GoalStatus.OVERDUE:
      return "Atrasada";
    default:
      return status;
  }
};

/**
 * Retorna o label localizado para a categoria
 */
export const getCategoryLabel = (category: string): string => {
  switch (category) {
    case GoalCategory.EMERGENCY_FUND:
      return "Fundo de Emergência";
    case GoalCategory.RETIREMENT:
      return "Aposentadoria";
    case GoalCategory.VACATION:
      return "Férias";
    case GoalCategory.EDUCATION:
      return "Educação";
    case GoalCategory.HOME:
      return "Casa";
    case GoalCategory.CAR:
      return "Carro";
    case GoalCategory.WEDDING:
      return "Casamento";
    case GoalCategory.DEBT_PAYMENT:
      return "Pagamento de Dívidas";
    case GoalCategory.INVESTMENT:
      return "Investimento";
    case GoalCategory.OTHER:
      return "Outro";
    default:
      return category;
  }
}; 