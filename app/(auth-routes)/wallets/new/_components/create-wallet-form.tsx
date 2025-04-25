"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/app/_components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { toast } from "sonner";
import { DialogClose } from "@/app/_components/ui/dialog";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatCurrency, parseCurrencyToNumber } from "@/app/_lib/utils";

interface Bank {
  id: string;
  name: string;
  logo: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  initialBalance: z.string().refine((value) => !isNaN(parseCurrencyToNumber(value)), {
    message: "Saldo inicial deve ser um número válido",
  }),
  type: z.enum(["MANUAL", "BANK", "BANK_INTEGRATION"]),
  bankId: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  walletType: z.enum(["CASH", "BANK"]).default("CASH"),
});

interface CreateWalletFormProps {
  banks: Bank[];
  onSuccess?: () => void;
  defaultType?: "MANUAL" | "BANK" | "BANK_INTEGRATION";
}

export function CreateWalletForm({ banks, onSuccess, defaultType = "MANUAL" }: CreateWalletFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balanceDisplay, setBalanceDisplay] = useState("R$ 0,00");
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      initialBalance: "0",
      type: defaultType,
      agencia: "",
      conta: "",
      walletType: "CASH",
      bankId: "",
    },
  });

  useEffect(() => {
    form.setValue("type", defaultType);
  }, [defaultType, form]);

  // Função para formatar a entrada monetária
  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove todos os caracteres não numéricos
    const numericValue = e.target.value.replace(/\D/g, "");
    
    // Converte para número e divide por 100 para ter os centavos
    const valueInCents = parseInt(numericValue || "0");
    const formattedValue = formatCurrency(valueInCents / 100);
    
    // Atualiza o display
    setBalanceDisplay(formattedValue);
    
    // Atualiza o valor no formulário (mantemos como string)
    form.setValue("initialBalance", numericValue !== "" ? numericValue : "0");
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      
      // Converte o saldo inicial para número a partir da string (valor em centavos)
      const initialBalanceNumber = parseInt(values.initialBalance) / 100;
      
      // Convertemos o tipo "BANK" para "MANUAL" para garantir compatibilidade
      const type = values.type === "BANK" ? "MANUAL" : values.type;
      
      // Se o tipo de carteira for dinheiro, não enviamos o bankId
      const selectedBankId = values.walletType === "CASH" ? undefined : values.bankId;
      
      const response = await fetch("/api/wallets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          initialBalance: initialBalanceNumber,
          type: type,
          bankId: selectedBankId,
          metadata: {
            agencia: values.agencia,
            conta: values.conta,
            walletType: values.walletType,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha ao criar carteira");
      }

      toast.success("Carteira criada com sucesso!");
      form.reset();
      
      // Disparar evento para atualizar a lista de carteiras
      const event = new CustomEvent('walletCreated');
      window.dispatchEvent(event);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Erro ao criar carteira");
      console.error("[CREATE_WALLET_ERROR]", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Carteira</FormLabel>
              <FormControl>
                <Input placeholder="Minha Carteira" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="initialBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo Inicial</FormLabel>
              <FormControl>
                <Input
                  placeholder="R$ 0,00"
                  value={balanceDisplay}
                  onChange={handleBalanceChange}
                  className="font-medium"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="walletType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Carteira</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === "CASH") {
                    form.setValue("bankId", "");
                  }
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de carteira" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CASH" className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 h-8 w-8 rounded-full flex items-center justify-center">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="h-5 w-5 text-green-700"
                        >
                          <rect width="18" height="12" x="3" y="6" rx="2" />
                          <path d="M3 10h18" />
                          <path d="M7 15h.01" />
                          <path d="M11 15h2" />
                        </svg>
                      </div>
                      <span>Dinheiro</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="BANK" className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 h-8 w-8 rounded-full flex items-center justify-center">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="h-5 w-5 text-blue-700"
                        >
                          <path d="M20 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
                          <path d="M12 10.3a2 2 0 1 0 0 3.4 2 2 0 1 0 0-3.4" />
                          <path d="M2 11h20" />
                        </svg>
                      </div>
                      <span>Conta Bancária</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("walletType") === "BANK" && (
          <FormField
            control={form.control}
            name="bankId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banco</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    // Garantir que nunca enviamos um valor vazio
                    field.onChange(value || undefined);
                  }} 
                  defaultValue={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o banco" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {banks.map((bank) => (
                      bank.id ? (
                        <SelectItem key={bank.id} value={bank.id}>
                          <div className="flex items-center gap-2">
                            <img src={bank.logo} alt={bank.name} className="h-6 w-6 rounded object-contain" />
                            <span>{bank.name}</span>
                          </div>
                        </SelectItem>
                      ) : null
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Criando..." : "Criar Carteira"}
        </Button>
      </form>
    </Form>
  );
} 