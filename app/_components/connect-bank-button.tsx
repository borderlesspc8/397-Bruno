"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Bank } from "@/app/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface ConnectBankButtonProps {
  bank: Bank;
  onSuccess?: () => void;
}

// Schema para conexão com o BB
const bbFormSchema = z.object({
  agencia: z.string().min(1, "Agência é obrigatória"),
  conta: z.string().min(1, "Conta é obrigatória"),
});

export function ConnectBankButton({ bank, onSuccess }: ConnectBankButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Formulário para o Banco do Brasil
  const bbForm = useForm<z.infer<typeof bbFormSchema>>({
    resolver: zodResolver(bbFormSchema),
    defaultValues: {
      agencia: "",
      conta: "",
    },
  });

  // Verifica se é o Banco do Brasil pelo ID
  const isBancoDoBrasil = bank.id === "bb001";

  const handleConnect = async () => {
    if (isBancoDoBrasil) {
      // Se for BB, mostrar formulário
      setShowForm(true);
      return;
    }
    
    // Outros bancos seguem o fluxo normal
    try {
      setIsLoading(true);

      const response = await fetch("/api/banks/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankId: bank.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao conectar com o banco");
      }

      const data = await response.json();

      // Redirecionar para a URL de autorização do banco
      window.location.href = data.authUrl;

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Erro ao conectar com o banco");
      console.error("[CONNECT_BANK]", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBBConnect = async (values: z.infer<typeof bbFormSchema>) => {
    try {
      setIsLoading(true);
      
      // Obter os dados do formulário
      const { agencia, conta } = values;
      
      // Primeiro, tentar conectar com o Banco do Brasil
      try {
        const bbResponse = await fetch("/api/banks/connect/bb", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Valores padrão para demo/testes
            applicationKey: "app-key-demo",
            clientBasic: "client-basic-demo",
            clientId: "client-id-demo",
            clientSecret: "client-secret-demo",
            apiUrl: "https://api.sandbox.bb.com.br/extratos/v1",
            agencia,
            conta,
          }),
        });
        
        if (bbResponse.ok) {
          const data = await bbResponse.json();
          toast.success("Conexão com o Banco do Brasil estabelecida com sucesso");
          
          if (onSuccess) {
            onSuccess();
          }
          
          return;
        }
      } catch (bbError) {
        console.error("[CONNECT_BB_DIRECT]", bbError);
        // Continuar com a abordagem alternativa
      }
      
      // Se a conexão direta falhar, cria apenas a carteira
      const response = await fetch("/api/wallets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${bank.name} - Conta ${conta}`,
          initialBalance: 0,
          type: "BANK_INTEGRATION",
          bankId: bank.id,
          metadata: {
            agencia,
            conta,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error("Falha ao criar carteira com integração bancária");
      }
      
      toast.success("Carteira conectada com sucesso!");
      setShowForm(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Erro ao conectar carteira");
      console.error("[CONNECT_BB]", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleConnect}
        disabled={isLoading}
        className="w-full"
        variant="outline"
      >
        {isLoading ? "Conectando..." : "Conectar"}
      </Button>
      
      {/* Formulário específico para o BB */}
      {isBancoDoBrasil && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Conectar {bank.name}</DialogTitle>
              <DialogDescription>
                Preencha os dados da sua conta para sincronizar automaticamente.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...bbForm}>
              <form onSubmit={bbForm.handleSubmit(handleBBConnect)} className="space-y-4">
                <FormField
                  control={bbForm.control}
                  name="agencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agência</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={bbForm.control}
                  name="conta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 56789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Conectando..." : "Conectar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 