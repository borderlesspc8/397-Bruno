import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ClientThemeProvider } from '@/app/_components/client-theme-provider';

/**
 * Wrapper personalizado que adiciona os providers necessários para testes
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClientThemeProvider>
      {children}
    </ClientThemeProvider>
  );
};

/**
 * Função de renderização personalizada com todos os providers necessários
 * 
 * @param ui Componente a ser renderizado
 * @param options Opções adicionais de renderização
 * @returns O resultado da renderização com getByRole, queryByText, etc.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Re-exporta tudo de @testing-library/react para simplificar os imports
 */
export * from '@testing-library/react'; 