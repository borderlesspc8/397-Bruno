import { ReactNode } from "react";

export interface MenuItem {
  name: string;
  href: string;
  icon: ReactNode;
  badge?: string;
  isPro?: boolean;
  children?: MenuItem[];
  description?: string;
} 
