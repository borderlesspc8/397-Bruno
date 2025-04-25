"use client";

import { Button } from "@/app/_components/ui/button";
import { PlusCircle } from "lucide-react";
import { useCallback } from "react";

interface ClientEmptyStateActionProps {
  label: string;
}

/**
 * Componente do cliente para lidar com ações interativas em estados vazios
 */
export function ClientEmptyStateAction({ label }: ClientEmptyStateActionProps) {
  const handleClick = useCallback(() => {
    // Procurar por um botão de criação de carteira e acioná-lo
    const createButton = document.getElementById('create-wallet-button');
    if (createButton) {
      createButton.click();
    } else {
      // Se não encontrar o botão específico, procurar por qualquer botão de criação de carteira modal
      const createWalletButtons = document.querySelectorAll('[data-create-wallet-button]');
      if (createWalletButtons.length > 0) {
        (createWalletButtons[0] as HTMLElement).click();
      }
    }
  }, []);

  return (
    <Button onClick={handleClick}>
      <PlusCircle className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
} 