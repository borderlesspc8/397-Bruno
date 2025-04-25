"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { Link } from "lucide-react";
import Image from "next/image";
import { getBanks } from "@/app/_actions/get-banks";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface Bank {
  id: string;
  name: string;
  logo: string;
}

// Schema para formulário do BB
const bbFormSchema = z.object({
  agencia: z.string().min(1, "Agência é obrigatória"),
  conta: z.string().min(1, "Conta é obrigatória"),
  applicationKey: z.string().optional(),
  clientBasic: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  apiUrl: z.string().url("URL da API inválida").default("https://api.sandbox.bb.com.br/extratos/v1").optional(),
});

export default function ConnectBankDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  // Formulário para o Banco do Brasil
  const bbForm = useForm<z.infer<typeof bbFormSchema>>({
    resolver: zodResolver(bbFormSchema),
    defaultValues: {
      applicationKey: "",
      clientBasic: "",
      clientId: "",
      clientSecret: "",
      apiUrl: "https://api.sandbox.bb.com.br/extratos/v1",
      agencia: "",
      conta: "",
    },
  });

  useEffect(() => {
    async function loadBanks() {
      const { banks, error } = await getBanks();

      if (error) {
        toast.error("Erro ao carregar bancos");
        return;
      }

      setBanks(banks);
    }

    loadBanks();
  }, []);

  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank);
  };

  const handleConnect = async (bankId: string) => {
    setLoading(true);
    try {
      // Implementação padrão para bancos que não têm formulário específico
      console.log("Conectando ao banco:", bankId);
      setOpen(false);
    } catch (error) {
      console.error("Erro ao conectar banco:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBBConnect = async (values: z.infer<typeof bbFormSchema>) => {
    setLoading(true);
    try {
      // Enviar dados para API específica do BB
      const response = await fetch("/api/banks/connect/bb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationKey: values.applicationKey,
          clientBasic: values.clientBasic,
          clientId: values.clientId,
          clientSecret: values.clientSecret,
          apiUrl: values.apiUrl,
          agencia: values.agencia,
          conta: values.conta,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao conectar com o Banco do Brasil");
      }

      toast.success("Conexão com o Banco do Brasil estabelecida com sucesso");
      setOpen(false);
    } catch (error) {
      console.error("[BB_CONNECT_ERROR]", error);
      toast.error(error instanceof Error ? error.message : "Erro ao conectar com o Banco do Brasil");
    } finally {
      setLoading(false);
    }
  };

  // Verificar se é o Banco do Brasil pelo ID
  const isBancoDoBrasil = selectedBank?.id === "bb001";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Link className="mr-2 h-4 w-4" />
          Conectar Banco
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Conectar Banco</DialogTitle>
          <DialogDescription>
            Conecte sua conta bancária para sincronizar automaticamente suas transações.
          </DialogDescription>
        </DialogHeader>

        {selectedBank ? (
          // Mostrar formulário específico para o banco selecionado
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative h-10 w-10">
                <Image
                  src={selectedBank.logo}
                  alt={selectedBank.name}
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="text-lg font-semibold">{selectedBank.name}</h3>
            </div>

            {isBancoDoBrasil ? (
              <Form {...bbForm}>
                <form onSubmit={bbForm.handleSubmit(handleBBConnect)} className="space-y-4">
                  <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                    <h3 className="font-medium text-sm">Dados da Conta</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={bbForm.control}
                        name="agencia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agência *</FormLabel>
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
                            <FormLabel>Conta *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 56789" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                    <h3 className="font-medium text-sm">Dados de API (Opcional)</h3>
                    <FormField
                      control={bbForm.control}
                      name="applicationKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chave da Aplicação</FormLabel>
                          <FormControl>
                            <Input placeholder="Chave da aplicação registrada no BB" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bbForm.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client ID</FormLabel>
                          <FormControl>
                            <Input placeholder="ID do cliente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bbForm.control}
                      name="clientSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Secret</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Segredo do cliente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bbForm.control}
                      name="clientBasic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Basic</FormLabel>
                          <FormControl>
                            <Input placeholder="Token Basic" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setSelectedBank(null)}
                    >
                      Voltar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Conectando..." : "Conectar"}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              // Botão padrão para outros bancos
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedBank(null)}
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => handleConnect(selectedBank.id)}
                  disabled={loading}
                >
                  {loading ? "Conectando..." : "Conectar"}
                </Button>
              </div>
            )}
          </>
        ) : (
          // Lista de bancos para seleção
          <div className="grid gap-4 py-4">
            {banks.map((bank) => (
              <Button
                key={bank.id}
                variant="outline"
                className="flex items-center justify-start gap-4 h-16"
                disabled={loading}
                onClick={() => handleBankSelect(bank)}
              >
                <div className="relative h-8 w-8">
                  <Image
                    src={bank.logo}
                    alt={bank.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <span>{bank.name}</span>
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 