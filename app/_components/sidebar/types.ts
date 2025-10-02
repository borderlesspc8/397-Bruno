import { ComponentType } from "react";

export interface MenuItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
} 