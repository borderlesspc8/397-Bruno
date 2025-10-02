"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isHydrationError: boolean;
}

export class HydrationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isHydrationError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Verificar se é um erro de hidratação
    const isHydrationError = 
      error.message.includes('hydration') ||
      error.message.includes('originalFactory.call') ||
      error.message.includes('readChunk') ||
      error.message.includes('mountLazyComponent');

    return {
      hasError: true,
      error,
      isHydrationError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('HydrationErrorBoundary capturou um erro:', error, errorInfo);
    
    // Log específico para erros de hidratação
    if (this.state.isHydrationError) {
      console.error('Erro de hidratação detectado:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, isHydrationError: false });
    
    // Forçar uma recarga suave da página para resolver problemas de hidratação
    if (this.state.isHydrationError) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="mx-auto max-w-md mt-8">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-lg">
              {this.state.isHydrationError ? 'Erro de Hidratação' : 'Erro de Renderização'}
            </CardTitle>
            <CardDescription>
              {this.state.isHydrationError 
                ? 'Ocorreu um problema ao sincronizar o conteúdo entre servidor e cliente.'
                : 'Ocorreu um erro inesperado ao renderizar este componente.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Erro:</strong> {this.state.error.message}
                </p>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                {this.state.isHydrationError ? 'Recarregar Página' : 'Tentar Novamente'}
              </Button>
              
              {!this.state.isHydrationError && (
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/dashboard/vendas'}
                  className="w-full"
                >
                  Ir para Dashboard
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default HydrationErrorBoundary;
