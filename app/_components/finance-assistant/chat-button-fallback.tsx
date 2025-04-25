"use client";

import React from 'react';
import { Button } from "@/app/_components/ui/button";
import { MessageSquare } from "lucide-react";

/**
 * Versão simplificada do ChatButton para uso como fallback quando ocorrem erros
 * Este componente é muito mais leve e tem menos dependências
 */
export function ChatButtonFallback() {
  return (
    <Button
      variant="default"
      size="icon"
      className="fixed bottom-6 right-6 shadow-lg h-14 w-14 rounded-full"
      onClick={() => console.log('Assistente indisponível no momento. Entre em contato com o suporte.')}
    >
      <MessageSquare className="h-6 w-6" />
    </Button>
  );
} 