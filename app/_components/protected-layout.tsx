"use client";

import React from "react";
import { SocketProvider } from "./socket-provider";
import { TransactionProvider } from "@/app/_hooks/transaction";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

/**
 * Componente de layout que protege rotas autenticadas
 * e gerencia o perfil do usuário
 */
export const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <SocketProvider>
        <TransactionProvider>
          {children}
        </TransactionProvider>
      </SocketProvider>
    </div>
  );
}; 