import { useEffect, useState } from 'react';
import { getEventsClient } from '@/app/_lib/socket';

interface UseRealtimeUpdatesOptions {
  onTransactionsChanged?: (data: any) => void;
  onWalletsChanged?: (data: any) => void;
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const [isConnected, setIsConnected] = useState(true);
  
  useEffect(() => {
    // Usar o sistema de eventos DOM para atualizações em tempo real
    const eventsClient = getEventsClient();
    
    if (!eventsClient) {
      console.warn('Sistema de eventos não está disponível no ambiente atual');
      return;
    }
    
    setIsConnected(eventsClient.isConnected());
    
    // Eventos específicos da aplicação
    const onTransactionsChanged = (data: any) => {
      if (options.onTransactionsChanged) {
        options.onTransactionsChanged(data);
      }
    };
    
    const onWalletsChanged = (data: any) => {
      if (options.onWalletsChanged) {
        options.onWalletsChanged(data);
      }
    };
    
    // Registrar callbacks no sistema de eventos
    eventsClient.on('transactions-changed', onTransactionsChanged);
    eventsClient.on('wallets-changed', onWalletsChanged);
    
    // Alternativa: escutar eventos personalizados do DOM diretamente
    const handleWalletUpdated = (event: any) => {
      if (options.onWalletsChanged) {
        options.onWalletsChanged(event.detail);
      }
    };
    
    const handleTransactionUpdated = (event: any) => {
      if (options.onTransactionsChanged) {
        options.onTransactionsChanged(event.detail);
      }
    };
    
    window.addEventListener('wallet-updated', handleWalletUpdated);
    window.addEventListener('transaction-updated', handleTransactionUpdated);
    
    return () => {
      // Remover todos os listeners
      eventsClient.off('transactions-changed', onTransactionsChanged);
      eventsClient.off('wallets-changed', onWalletsChanged);
      
      window.removeEventListener('wallet-updated', handleWalletUpdated);
      window.removeEventListener('transaction-updated', handleTransactionUpdated);
    };
  }, [options]);
  
  // Método para emitir evento de atualização manualmente
  const emitWalletUpdate = (data: any) => {
    const eventsClient = getEventsClient();
    if (eventsClient) {
      eventsClient.emit('wallets-changed', data);
    }
    
    // Disparar o evento DOM também como fallback
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('wallet-updated', { detail: data });
      window.dispatchEvent(event);
    }
  };
  
  const emitTransactionUpdate = (data: any) => {
    const eventsClient = getEventsClient();
    if (eventsClient) {
      eventsClient.emit('transactions-changed', data);
    }
    
    // Disparar o evento DOM também como fallback
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('transaction-updated', { detail: data });
      window.dispatchEvent(event);
    }
  };
  
  return {
    isConnected,
    emitWalletUpdate,
    emitTransactionUpdate
  };
} 