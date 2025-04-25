import { SubscriptionPlan } from "@/app/types";

export interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  emailVerified: Date | null;
  subscriptionPlan: SubscriptionPlan;
  lastActivity: Date | null;
  resourceUsage?: ResourceUsage;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceUsage {
  wallets: {
    used: number;
    limit: number;
    percentage: number;
  };
  transactions: {
    used: number;
    limit: number;
    percentage: number;
  };
  connections: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export interface AvatarOption {
  id: string;
  src?: string;
  backgroundColor?: string;
  label: string;
}

export interface ThemePreference {
  theme: 'light' | 'dark' | 'system';
  colorScheme?: string;
}

export interface UserStats {
  transactionsCount: number;
  categoriesCount: number;
  walletsCount: number;
  totalBalance: number;
  memberSince: Date;
  lastSync?: Date;
}

export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  security: SecuritySettings;
  appearance: ThemePreference;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  categories: {
    transactions: boolean;
    security: boolean;
    system: boolean;
    marketing: boolean;
  };
}

export interface PrivacySettings {
  shareUsageData: boolean;
  allowCookies: boolean;
  dataRetention: 'standard' | 'extended' | 'minimal';
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  passwordLastChanged?: Date;
  activeSessions: number;
}

export type UserMenuSection = 
  | 'profile' 
  | 'plan' 
  | 'history'
  | 'settings'
  | 'security'
  | 'help'; 