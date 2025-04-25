"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/app/_components/ui/alert';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: any[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Componente de Error Boundary para capturar erros em componentes React
 * Utiliza a API de ciclo de vida de classe do React para capturar erros em componentes filhos
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Registrar o erro para análise posterior
    console.error('Error boundary capturou um erro:', error, errorInfo);
    
    // Chamar o callback onError, se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Resetar o estado de erro se as resetKeys mudarem
    if (
      this.state.hasError &&
      this.props.resetKeys !== undefined &&
      prevProps.resetKeys !== undefined &&
      this.props.resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index])
    ) {
      this.setState({
        hasError: false,
        error: null
      });
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Renderizar fallback personalizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Caso contrário, renderizar interface de erro padrão
      return (
        <Card className="w-full max-w-md mx-auto my-4 shadow-lg border-red-200">
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <CardTitle className="flex items-center text-red-700 dark:text-red-300">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Ocorreu um erro
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Algo deu errado</AlertTitle>
              <AlertDescription className="mt-2">
                {this.state.error?.message || 'Ocorreu um erro inesperado ao renderizar este componente.'}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground mt-2">
              Tente recarregar a página ou contate o suporte se o problema persistir.
            </p>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 bg-gray-50 dark:bg-gray-900/20">
            <Button variant="outline" onClick={this.handleReset}>
              Tentar Novamente
            </Button>
            <Button 
              variant="default" 
              onClick={() => window.location.reload()}
            >
              Recarregar Página
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
} 