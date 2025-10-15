import { SubscriptionPlan } from "@/app/types";

// Interface para os dados de carteira
export interface Wallet {
  id: string;
  name: string;
  balance: number;
  icon?: string;
  isDefault?: boolean;
  type?: string;
  bankId?: string | null;
  bank?: {
    id: string;
    name: string;
    logo: string;
  };
  metadata?: {
    accountId?: string;
    lastSync?: string;
    integration?: string;
    connectionId?: string;
    isDefault?: boolean;
  };
}

// Interface para notificações
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  date: Date;
  read: boolean;
  source?: string;
  actionUrl?: string;
} 
