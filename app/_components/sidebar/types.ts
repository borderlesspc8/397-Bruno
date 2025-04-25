import { ComponentType } from "react";

export enum SubscriptionPlan {
  FREE = "FREE",
  BASIC = "BASIC",
  PREMIUM = "PREMIUM",
  ENTERPRISE = "ENTERPRISE"
}

export interface MenuItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  plan: SubscriptionPlan;
  description: string;
  limits?: Partial<Record<SubscriptionPlan, string>>;
  feature?: string;
  premiumContent?: boolean;
  enterpriseFeature?: boolean;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
} 