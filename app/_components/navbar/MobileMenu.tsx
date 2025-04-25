"use client";

// Este componente não é mais necessário pois o SideNav já fornece a funcionalidade de menu móvel
// Mantido para compatibilidade, mas retornando null

import { FC } from "react";

export interface MobileMenuProps {
  selectedWallet?: any;
}

export const MobileMenu: FC<MobileMenuProps> = () => {
  return null;
};

export default MobileMenu; 