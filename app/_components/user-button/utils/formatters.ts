import { SubscriptionPlan } from "@/app/types";

/**
 * Gera as iniciais para o avatar a partir do nome ou email
 */
export function generateInitials(name: string | null, email: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  
  return "??";
}

/**
 * Formata o nome do plano para exibição
 */
export function formatPlanName(plan: SubscriptionPlan | null | undefined): string {
  if (!plan) return "Gratuito";
  
  switch (plan) {
    case SubscriptionPlan.BASIC:
      return "Basic";
    case SubscriptionPlan.PREMIUM:
      return "Premium";
    case SubscriptionPlan.ENTERPRISE:
      return "Empresarial";
    default:
      return "Gratuito";
  }
}

/**
 * Retorna a variante de badge adequada para o plano
 */
export function getPlanBadgeVariant(plan: SubscriptionPlan | null | undefined): string {
  if (!plan) return "outline";
  
  switch (plan) {
    case SubscriptionPlan.BASIC:
      return "secondary";
    case SubscriptionPlan.PREMIUM:
      return "default";
    case SubscriptionPlan.ENTERPRISE:
      return "destructive";
    default:
      return "outline";
  }
}

/**
 * Formata uma data como relativa a agora (ex: "2 dias atrás")
 */
export function formatRelativeTime(date: Date | null | string): string {
  if (!date) return "Indisponível";
  
  // Garantir que a data seja uma instância de Date válida
  let dateObj: Date;
  
  try {
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    // Verificar se a data é válida
    if (isNaN(dateObj.getTime())) {
      return "Data inválida";
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInSecs / 60);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSecs < 60) {
      return "agora mesmo";
    } else if (diffInMins < 60) {
      return `${diffInMins} ${diffInMins === 1 ? 'minuto' : 'minutos'} atrás`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'} atrás`;
    } else if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'} atrás`;
    } else {
      return dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "Data inválida";
  }
}

/**
 * Formata o tamanho do uso em porcentagem com 2 casas decimais
 */
export function formatUsagePercentage(usage: number): string {
  return `${(usage * 100).toFixed(0)}%`;
}

/**
 * Determina a cor do indicador de uso baseado na porcentagem
 */
export function getUsageColor(percentage: number): string {
  if (percentage < 0.7) return "bg-green-500";
  if (percentage < 0.9) return "bg-yellow-500";
  return "bg-red-500";
}

/**
 * Retorna uma lista de opções de cores de fundo para avatar
 */
export function getAvatarColorOptions(): Array<{color: string, label: string}> {
  return [
    { color: "bg-blue-500", label: "Azul" },
    { color: "bg-green-500", label: "Verde" },
    { color: "bg-purple-500", label: "Roxo" },
    { color: "bg-pink-500", label: "Rosa" },
    { color: "bg-orange-500", label: "Laranja" },
    { color: "bg-red-500", label: "Vermelho" },
    { color: "bg-gray-500", label: "Cinza" },
    { color: "bg-teal-500", label: "Teal" },
    { color: "bg-indigo-500", label: "Índigo" },
    { color: "bg-amber-500", label: "Âmbar" }
  ];
} 