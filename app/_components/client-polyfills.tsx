"use client";

import { useEffect } from "react";

/**
 * Componente para inicializar polyfills necessários no lado do cliente
 * Este componente deve ser adicionado no app/layout.tsx
 */
export default function ClientPolyfills() {
  useEffect(() => {
    // Simular global.process para evitar erros com módulos que usam isso
    if (typeof window !== 'undefined' && typeof (window as any).process === 'undefined') {
      (window as any).process = {
        env: { NODE_ENV: process.env.NODE_ENV }
      };
    }
    
    // Registrar polyfills para módulos Node.js
    const registerPolyfills = async () => {
      try {
        // Isso permite que alguns módulos Node.js funcionem no navegador
        if (typeof (window as any).global === 'undefined') {
          (window as any).global = window;
        }
        
        // Adicionar outros polyfills conforme necessário
        console.log("[POLYFILLS] Polyfills inicializados com sucesso");
      } catch (error) {
        console.error("[POLYFILLS] Erro ao inicializar polyfills:", error);
      }
    };
    
    registerPolyfills();
  }, []);

  // Não renderiza nada, apenas inicializa polyfills
  return null;
} 