"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import useSocketNotifications from '@/app/_hooks/use-socket-notifications';

// Definição do tipo para o contexto de socket
interface SocketContextType {
  isConnected: boolean;
  connectionError: string | null;
}

// Criar o contexto
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Hook para acessar o contexto do socket
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket deve ser usado dentro de um SocketProvider');
  }
  return context;
};

// Componente provedor de socket
export function SocketProvider({ children }: { children: ReactNode }) {
  // Usar o hook de socket
  const { isConnected, connectionError } = useSocketNotifications();

  // Valor do contexto
  const value = {
    isConnected,
    connectionError,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketProvider; 