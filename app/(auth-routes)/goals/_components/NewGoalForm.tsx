"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
import { Textarea } from "@/app/_components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { Calendar } from "@/app/_components/ui/calendar";
import { Card, CardContent } from "@/app/_components/ui/card";

import { 
  useForm, 
  goalFormSchema, 
  GoalFormValues,
  FieldProps 
} from "../forms";
import { 
  categoryOptions, 
} from "../types";
import {
  currencyToNumber,
  formatCurrencyInput
} from "../utils";

export function NewGoalForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: "",
      description: "",
      targetAmount: "",
      category: "EMERGENCY_FUND",
      targetDate: new Date(),
    },
  });

  const onSubmit = async (data: GoalFormValues) => {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          targetAmount: currencyToNumber(data.targetAmount),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar meta");
      }

      toast.success("Meta criada com sucesso!");
      router.push("/goals");
      router.refresh();
    } catch (error) {
      console.error("Erro ao criar meta:", error);
      toast.error("Erro ao criar meta. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }: FieldProps<GoalFormValues, "title">) => (
            <FormItem>
              <FormLabel>Título da Meta</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Fundo de emergência" {...field} />
              </FormControl>
              <FormDescription>
                Um nome curto e claro para sua meta financeira
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }: FieldProps<GoalFormValues, "description">) => (
            <FormItem>
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva sua meta em mais detalhes..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="targetAmount"
            render={({ field: { onChange, ...field } }: FieldProps<GoalFormValues, "targetAmount">) => (
              <FormItem>
                <FormLabel>Valor da Meta</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      const formatted = formatCurrencyInput(e.target.value);
                      e.target.value = formatted;
                      onChange(e);
                    }}
                    placeholder="R$ 0,00"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }: FieldProps<GoalFormValues, "category">) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="targetDate"
          render={({ field }: FieldProps<GoalFormValues, "targetDate">) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data Alvo</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={"w-full pl-3 text-left font-normal"}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>Escolha uma data</span>
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
                    disabled={(date) =>
                      date < new Date() || date > new Date(2100, 0, 1)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                A data limite para atingir sua meta
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar Meta
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
} 
