"use client";

import React from 'react';
import { Wallet } from '@prisma/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/_components/ui/dialog';
import { OfxImporter } from './OfxImporter';
import { useRouter } from 'next/navigation';
import { useRealtimeUpdates } from '@/app/_hooks/use-realtime-updates';

interface OfxImportModalProps {
  wallet: Wallet;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: (wallet: Wallet) => void;
}

export function OfxImportModal({ wallet, isOpen, onOpenChange, onImportComplete }: OfxImportModalProps) {
  const router = useRouter();
  const { emitWalletUpdate } = useRealtimeUpdates();
  
  const handleImportComplete = (updatedWallet?: Wallet) => {
    // Fechar o modal após importação completa
    onOpenChange(false);
    
    // Notificar componentes pais (se houver callback)
    if (onImportComplete && updatedWallet) {
      onImportComplete(updatedWallet);
    }
    
    // Emitir evento para atualizar todos os componentes que usam carteiras
    if (updatedWallet) {
      emitWalletUpdate({
        walletId: wallet.id,
        wallet: updatedWallet,
        action: 'updated'
      });
    }
    
    // Forçar atualização da UI
    router.refresh();
    
    // Se estamos em wallets, vamos garantir que a página seja completamente atualizada
    if (typeof window !== 'undefined' && window.location.pathname.includes('/wallets')) {
      // Adicionar um pequeno atraso antes de redirecionar para garantir
      // que os eventos sejam processados
      setTimeout(() => {
        window.location.href = '/wallets';
      }, 300);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Importar Transações OFX</DialogTitle>
          <DialogDescription>
            Importe extrato OFX para a carteira {wallet.name}
          </DialogDescription>
        </DialogHeader>
        
        <OfxImporter wallet={wallet} onImportComplete={handleImportComplete} />
      </DialogContent>
    </Dialog>
  );
} 