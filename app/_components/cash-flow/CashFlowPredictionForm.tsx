"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/app/_lib/utils";
import { Button } from "@/app/_components/ui/button";
import { Calendar } from "@/app/_components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { Input } from "@/app/_components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/app/_components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { toast } from "sonner";
import { CashFlowPredictionSource, TransactionType } from "@/app/_types/transaction";

// Esquema de validação para o formulário
const formSchema = z.object({
  description: z.string().min(3, {
    message: "A descrição deve ter pelo menos 3 caracteres",
  }),
  amount: z.coerce.number().positive({
    message: "O valor deve ser maior que zero",
  }),
  date: z.date({
    required_error: "Selecione uma data para a previsão",
  }),
  type: z.enum(["INCOME", "EXPENSE"]),
  recurrent: z.boolean().default(false),
  walletId: z.string().min(1, {
    message: "Selecione uma carteira",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface CashFlowPredictionFormProps {
  onSuccess?: () => void;
  defaultValues?: Partial<FormValues>;
}

export function CashFlowPredictionForm({
  onSuccess,
  defaultValues,
}: CashFlowPredictionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: defaultValues?.description || "",
      amount: defaultValues?.amount || undefined,
      date: defaultValues?.date || new Date(),
      type: defaultValues?.type || "EXPENSE",
      recurrent: defaultValues?.recurrent || false,
      walletId: defaultValues?.walletId || defaultWalletId || "",
    },
  });

  // Função de envio do formulário
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/cash-flow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          source: CashFlowPredictionSource.MANUAL,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao adicionar previsão");
      }

      toast.success("Previsão adicionada com sucesso!");
      form.reset({
        description: "",
        amount: undefined,
        date: new Date(),
        type: "EXPENSE",
        recurrent: false,
        walletId: defaultWalletId || "",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao adicionar previsão:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao adicionar previsão");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Descrição da previsão" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? undefined : parseFloat(value));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data da previsão</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => {
                      return date < new Date("1900-01-01");
                    }}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="EXPENSE" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Despesa
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="INCOME" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Receita
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="walletId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Carteira</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma carteira" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="default">Carteira Padrão</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Adicionando..." : "Adicionar Previsão"}
        </Button>
      </form>
    </Form>
  );
} 