'use client';

import React, { Suspense, lazy, ComponentType } from 'react';

/**
 * Tipo para propriedades do componente de fallback durante o carregamento
 */
export interface LoadingProps {
  message?: string;
}

/**
 * Componente de fallback padrão enquanto o componente real é carregado
 */
const DefaultLoading: React.FC<LoadingProps> = ({ message = 'Carregando...' }) => (
  <div className="w-full h-full flex items-center justify-center p-4">
    <div className="flex flex-col items-center gap-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

/**
 * Configuração para o componente carregado dinamicamente
 */
interface LazyLoadOptions {
  /** Componente a ser exibido durante o carregamento */
  fallback?: React.ReactNode;
  /** Mensagem a ser exibida durante o carregamento (se usar o fallback padrão) */
  loadingMessage?: string;
  /** Opções para o lazy import */
  ssr?: boolean;
}

/**
 * Função para carregar componentes dinamicamente
 * 
 * @param factory Função que retorna a promessa do import do componente
 * @param options Opções de configuração
 * @returns Componente React carregado dinamicamente
 */
export function lazyLoad<P>(
  factory: () => Promise<{ default: ComponentType<P> }>,
  options: LazyLoadOptions = {}
): React.FC<P> & { preload: () => void } {
  const {
    fallback,
    loadingMessage = 'Carregando componente...',
    ssr = false
  } = options;

  // Criar o componente lazy com tratamento de erro
  const LazyComponent = lazy(() => 
    factory().catch(error => {
      console.error('Erro ao carregar componente lazy:', error);
      // Retornar um componente de fallback em caso de erro
      return {
        default: () => (
          <div className="p-4 text-center text-red-500">
            <p>Erro ao carregar componente</p>
            <p className="text-sm text-gray-500 mt-1">
              {error.message || 'Erro desconhecido'}
            </p>
          </div>
        )
      };
    })
  );
  
  // Função para pré-carregar o componente
  const preload = factory;
  
  // Envolver em um componente que usa Suspense
  const WrappedComponent = (props: any) => (
    <Suspense fallback={fallback || <DefaultLoading message={loadingMessage} />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  // Adicionar o método preload ao componente envolvido
  (WrappedComponent as React.FC<P> & { preload: () => void }).preload = preload;
  
  // Adicionar um nome de exibição para ajudar na depuração
  WrappedComponent.displayName = `LazyLoaded(${factory.name || 'Component'})`;

  return WrappedComponent as React.FC<P> & { preload: () => void };
}

/**
 * Exemplo de uso:
 * const LazyComponent = lazyLoad(() => import('./MeuComponentePesado'), {
 *   loadingMessage: 'Carregando dashboard...',
 *   ssr: false
 * });
 * 
 * // Para pré-carregar antes de renderizar (ex: ao passar o mouse sobre um link):
 * const handleMouseEnter = () => {
 *   LazyComponent.preload();
 * };
 */ 