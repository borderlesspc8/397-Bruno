"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/_components/ui/form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { useErrorHandler } from '@/app/_hooks/error';
import { ErrorDisplay } from '@/app/_components/error';
import { LoadingIndicator } from '@/app/_components/ui/loading-indicator';

// Schema para validação de formulário
const formSchema = z.object({
  apiKey: z.string().min(1, 'API Key é obrigatória'),
  secretToken: z.string().min(1, 'Secret Token é obrigatório'),
  apiUrl: z.string().url('URL da API inválida').default('https://api.beteltecnologia.com'),
});

type FormValues = z.infer<typeof formSchema>;

interface CredentialsFormProps {
  initialData?: Partial<FormValues>;
  onSave?: (data: FormValues) => Promise<void>;
}

/**
 * Formulário para gerenciar credenciais do Gestão Click
 */
export function CredentialsForm({ initialData, onSave }: CredentialsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: initialData?.apiKey || '',
      secretToken: initialData?.secretToken || '',
      apiUrl: initialData?.apiUrl || 'https://api.beteltecnologia.com',
    },
  });
  
  const handleSubmit = async (data: FormValues) => {
    setIsLoading(true);
    
    try {
      // Enviar credenciais para a API
      const response = await fetch('/api/gestao-click/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletId: 'global',
          settings: {
            scope: 'global',
            gestaoClick: {
              apiKey: data.apiKey,
              secretToken: data.secretToken,
              apiUrl: data.apiUrl,
              lastSync: new Date().toISOString(),
            },
          },
        }),
      });
      
      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.message || 'Erro ao salvar credenciais');
      }
      
      // Chamar callback onSave se existir
      if (onSave) {
        await onSave(data);
      }
      
    } catch (error) {
      await handleError(error, { component: 'CredentialsForm' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Credenciais do Gestão Click</CardTitle>
      </CardHeader>
      
      {error.message && (
        <div className="px-6 -mt-2 mb-2">
          <ErrorDisplay 
            error={error} 
            variant="subtle" 
            title="Erro ao salvar credenciais"
            onDismiss={clearError}
            onRetry={() => form.handleSubmit(handleSubmit)()}
          />
        </div>
      )}
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Insira a API Key..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="secretToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secret Token</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Insira o Secret Token..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="apiUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da API</FormLabel>
                  <FormControl>
                    <Input placeholder="URL da API..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button 
          onClick={form.handleSubmit(handleSubmit)} 
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingIndicator size="sm" text="Salvando..." />
          ) : 'Salvar Credenciais'}
        </Button>
      </CardFooter>
    </Card>
  );
} 