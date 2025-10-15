import { ReactNode } from 'react';

/**
 * Interface para um item de navegação
 */
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  requiresAuth?: boolean;
  requiresPlan?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children?: NavigationItem[];
  description?: string;
}

/**
 * Props para o componente NavigationMenu
 */
export interface NavigationMenuProps {
  items: NavigationItem[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  variant?: 'sidebar' | 'navbar' | 'minimal';
  userPlan?: string;
  showIcons?: boolean;
  className?: string;
  sectionTitles?: Record<string, string>;
  activeItemIndicator?: 'background' | 'border' | 'both';
  defaultExpandedSections?: string[];
}

/**
 * Props para a seção de navegação
 */
export interface NavigationSectionProps {
  sectionId: string;
  sectionTitle?: string;
  items: NavigationItem[];
  isCollapsed: boolean;
  isFirstSection: boolean;
  expandedSections: Record<string, boolean>;
  toggleSection: (sectionId: string) => void;
  showIcons: boolean;
  activeItemIndicator: 'background' | 'border' | 'both';
  isActive: (item: NavigationItem) => boolean;
} 
