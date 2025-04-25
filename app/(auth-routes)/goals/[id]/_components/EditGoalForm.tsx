"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  targetAmount: z.string().refine(
    (value) => {
      const number = parseFloat(value.replace(/[^\d,]/g, "").replace(",", "."));
      return !isNaN(number) && number > 0;
    },
    {
      message: "Valor deve ser maior que zero",
    }
  ),
  category: z.enum([
    "EMERGENCY_FUND",
    "RETIREMENT",
    "VACATION",
    "EDUCATION",
    "HOME",
    "CAR",
    "WEDDING",
    "DEBT_PAYMENT",
    "INVESTMENT",
    "OTHER",
  ]),
  targetDate: z.date({
    required_error: "Data é obrigatória",
  }),
  walletId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const categoryOptions = [
  { value: "EMERGENCY_FUND", label: "Fundo de Emergência" },
  { value: "RETIREMENT", label: "Aposentadoria" },
  { value: "VACATION", label: "Férias" },
  { value: "EDUCATION", label: "Educação" },
  { value: "HOME", label: "Casa" },
  { value: "CAR", label: "Carro" },
  { value: "WEDDING", label: "Casamento" },
  { value: "DEBT_PAYMENT", label: "Pagamento de Dívidas" },
  { value: "INVESTMENT", label: "Investimento" },
  { value: "OTHER", label: "Outro" },
];

interface EditGoalFormProps {
  goal: {
    id: string;
    title: string;
    description: string | null;
    targetAmount: number;
    currentAmount: number;
    category: string;
    targetDate: Date;
    status: string;
    colorAccent: string | null;
    iconName: string | null;
  };
}

export function EditGoalForm({ goal }: EditGoalFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: goal.title,
      description: goal.description || "",
      targetAmount: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(goal.targetAmount),
      category: validateCategory(goal.category),
      targetDate: goal.targetDate,
    },
  });

  // Função auxiliar para validar categoria
  function validateCategory(category: string): "EMERGENCY_FUND" | "RETIREMENT" | "VACATION" | "EDUCATION" | "HOME" | "CAR" | "WEDDING" | "DEBT_PAYMENT" | "INVESTMENT" | "OTHER" {
    const validCategories = ["EMERGENCY_FUND", "RETIREMENT", "VACATION", "EDUCATION", "HOME", "CAR", "WEDDING", "DEBT_PAYMENT", "INVESTMENT", "OTHER"];
    return validCategories.includes(category) ? 
      category as "EMERGENCY_FUND" | "RETIREMENT" | "VACATION" | "EDUCATION" | "HOME" | "CAR" | "WEDDING" | "DEBT_PAYMENT" | "INVESTMENT" | "OTHER" : 
      "OTHER";
  }

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          targetAmount: parseFloat(
            data.targetAmount.replace(/[^\d,]/g, "").replace(",", ".")
          ),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar meta");
      }

      toast.success("Meta atualizada com sucesso!");
      router.push(`/goals/${goal.id}`);
      router.refresh();
    } catch (error) {
      console.error("Erro ao atualizar meta:", error);
      toast.error("Erro ao atualizar meta. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, "");
    const number = parseInt(onlyNumbers) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(number);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
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
          render={({ field }) => (
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
            render={({ field: { onChange, ...field } }) => (
              <FormItem>
                <FormLabel>Valor da Meta</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
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
            render={({ field }) => (
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
          render={({ field }) => (
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
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
} 