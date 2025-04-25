/**
 * Tipos para o módulo de metas financeiras
 */

/**
 * Categorias de metas financeiras
 */
export enum GoalCategory {
  EMERGENCY_FUND = "EMERGENCY_FUND",
  RETIREMENT = "RETIREMENT",
  VACATION = "VACATION",
  EDUCATION = "EDUCATION",
  HOME = "HOME",
  CAR = "CAR",
  WEDDING = "WEDDING",
  DEBT_PAYMENT = "DEBT_PAYMENT",
  INVESTMENT = "INVESTMENT",
  OTHER = "OTHER",
}

/**
 * Status de metas financeiras
 */
export enum GoalStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
  OVERDUE = "OVERDUE",
}

/**
 * Interface para meta financeira
 */
export interface FinancialGoal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  category: GoalCategory | string;
  startDate: Date;
  targetDate: Date;
  status: GoalStatus | string;
  walletId: string | null;
  colorAccent: string | null;
  iconName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface para contribuição à meta
 */
export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: Date;
  note: string | null;
  transactionId: string | null;
  createdAt: Date;
}

/**
 * Interface para props do componente GoalCard
 */
export interface GoalCardProps {
  goal: FinancialGoal;
}

/**
 * Interface para props do componente GoalDetails
 */
export interface GoalDetailsProps {
  goal: FinancialGoal;
}

/**
 * Interface para props do componente GoalContributions
 */
export interface GoalContributionsProps {
  goalId: string;
}

/**
 * Interface para props do componente EditGoalForm
 */
export interface EditGoalFormProps {
  goal: FinancialGoal;
}

/**
 * Interface para props do componente ContributeForm
 */
export interface ContributeFormProps {
  goal: FinancialGoal;
}

/**
 * Objeto com opções de categorias
 */
export const categoryOptions = [
  { value: GoalCategory.EMERGENCY_FUND, label: "Fundo de Emergência" },
  { value: GoalCategory.RETIREMENT, label: "Aposentadoria" },
  { value: GoalCategory.VACATION, label: "Férias" },
  { value: GoalCategory.EDUCATION, label: "Educação" },
  { value: GoalCategory.HOME, label: "Casa" },
  { value: GoalCategory.CAR, label: "Carro" },
  { value: GoalCategory.WEDDING, label: "Casamento" },
  { value: GoalCategory.DEBT_PAYMENT, label: "Pagamento de Dívidas" },
  { value: GoalCategory.INVESTMENT, label: "Investimento" },
  { value: GoalCategory.OTHER, label: "Outro" },
]; 