/**
 * Retorna o nome do mês em português com base no número (1-12)
 */
export function getMonthName(monthNumber: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  // Ajustar para índice 0-11
  const index = (((monthNumber - 1) % 12) + 12) % 12;
  return months[index];
}

/**
 * Formata um valor para exibição como moeda BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Paleta de cores consistente para o dashboard
 * Utiliza as variáveis CSS definidas em globals.css
 */
export const dashboardColors = {
  // Cores financeiras principais
  income: {
    primary: 'hsl(var(--income))',
    light: 'hsl(var(--income) / 0.1)',
    medium: 'hsl(var(--income) / 0.3)',
    dark: 'hsl(var(--income) / 0.8)',
    gradient: 'from-green-50 to-transparent dark:from-green-950/10 dark:to-transparent',
    icon: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
  },
  expense: {
    primary: 'hsl(var(--expense))',
    light: 'hsl(var(--expense) / 0.1)',
    medium: 'hsl(var(--expense) / 0.3)',
    dark: 'hsl(var(--expense) / 0.8)',
    gradient: 'from-red-50 to-transparent dark:from-red-950/10 dark:to-transparent',
    icon: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
  },
  investment: {
    primary: '#faba33',
    light: 'rgba(250, 186, 51, 0.1)',
    medium: 'rgba(250, 186, 51, 0.3)',
    dark: 'rgba(250, 186, 51, 0.8)',
    gradient: 'from-amber-50 to-transparent dark:from-amber-800/10 dark:to-transparent',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
  },
  transfer: {
    primary: '#faba33',
    light: 'rgba(250, 186, 51, 0.1)',
    medium: 'rgba(250, 186, 51, 0.3)',
    dark: 'rgba(250, 186, 51, 0.8)',
    gradient: 'from-amber-50 to-transparent dark:from-amber-800/10 dark:to-transparent',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
  },
  
  // Cores para o saldo
  balance: {
    primary: '#faba33',
    light: 'rgba(250, 186, 51, 0.1)',
    medium: 'rgba(250, 186, 51, 0.3)',
    dark: 'rgba(250, 186, 51, 0.8)',
    gradient: 'from-amber-50 to-transparent dark:from-amber-800/10 dark:to-transparent',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
  },
  
  // Cores para estados de progresso
  progress: {
    low: {
      bg: 'bg-green-500 dark:bg-green-400',
      text: 'text-green-600 dark:text-green-400',
      indicator: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
    },
    medium: {
      bg: 'bg-amber-500 dark:bg-amber-400',
      text: 'text-amber-600 dark:text-amber-400',
      indicator: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
    },
    high: {
      bg: 'bg-red-500 dark:bg-red-400',
      text: 'text-red-600 dark:text-red-400',
      indicator: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
    }
  },
  
  // Cores para categorias comuns de gastos
  categories: {
    alimentacao: '#ef4444',
    moradia: '#f97316',
    transporte: '#eab308',
    lazer: '#84cc16',
    saude: '#10b981',
    educacao: '#06b6d4',
    servicos: '#faba33',
    compras: '#faba33',
    investimentos: '#faba33',
    outros: '#94a3b8'
  }
};

/**
 * Determina a cor de progresso baseado no valor percentual
 */
export function getProgressColor(progress: number) {
  if (progress >= 90) return dashboardColors.progress.high.bg;
  if (progress >= 75) return dashboardColors.progress.medium.bg;
  return dashboardColors.progress.low.bg;
}

/**
 * Determina o estilo do badge baseado no valor percentual
 */
export function getProgressBadgeStyle(progress: number) {
  if (progress >= 90) return dashboardColors.progress.high.indicator;
  if (progress >= 75) return dashboardColors.progress.medium.indicator;
  return dashboardColors.progress.low.indicator;
}

/**
 * Obtém a cor para uma categoria específica
 */
export function getCategoryColor(category: string): string {
  const normalizedCategory = category.toLowerCase().trim();
  
  const colorMap: Record<string, string> = {
    "alimentação": dashboardColors.categories.alimentacao,
    "alimentacao": dashboardColors.categories.alimentacao,
    "moradia": dashboardColors.categories.moradia,
    "transporte": dashboardColors.categories.transporte,
    "lazer": dashboardColors.categories.lazer,
    "saúde": dashboardColors.categories.saude,
    "saude": dashboardColors.categories.saude,
    "educação": dashboardColors.categories.educacao,
    "educacao": dashboardColors.categories.educacao,
    "serviços": dashboardColors.categories.servicos,
    "servicos": dashboardColors.categories.servicos,
    "compras": dashboardColors.categories.compras,
    "investimentos": dashboardColors.categories.investimentos,
    "outros": dashboardColors.categories.outros
  };
  
  return colorMap[normalizedCategory] || dashboardColors.categories.outros;
} 