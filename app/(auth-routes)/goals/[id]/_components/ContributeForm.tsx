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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { Calendar } from "@/app/_components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";

// Schema de validação para o formulário de contribuição
const formSchema = z.object({
  amount: z.string().refine(
    (value) => {
      const number = parseFloat(value.replace(/[^\d,]/g, "").replace(",", "."));
      return !isNaN(number) && number > 0;
    },
    {
      message: "Valor deve ser maior que zero",
    }
  ),
  date: z.date({
    required_error: "Data é obrigatória",
  }),
  note: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ContributeFormProps {
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

export function ContributeForm({ goal }: ContributeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      date: new Date(),
      note: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // Converter o valor da string para número
      const amount = parseFloat(data.amount.replace(/[^\d,]/g, "").replace(",", "."));

      const response = await fetch(`/api/goals/${goal.id}/contribute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          amount,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao adicionar contribuição");
      }

      toast.success("Contribuição adicionada com sucesso!");
      router.push(`/goals/${goal.id}`);
      router.refresh();
    } catch (error) {
      console.error("Erro ao adicionar contribuição:", error);
      toast.error("Erro ao adicionar contribuição. Tente novamente.");
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

  const progressPercentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
  const remainingAmount = goal.targetAmount - goal.currentAmount;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Contribuição</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Valor da Contribuição</FormLabel>
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
                    <FormDescription>
                      Valor restante: {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(remainingAmount)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Contribuição</FormLabel>
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
                            date > new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      A data em que você fez essa contribuição
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observação (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione uma observação sobre essa contribuição..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between items-center pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adicionar Contribuição
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Meta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-1">Meta</h3>
            <p className="text-lg">{goal.title}</p>
            {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
          </div>

          <div>
            <h3 className="font-medium mb-1">Progresso</h3>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(goal.currentAmount)}
              </span>
              <span className="font-medium">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(goal.targetAmount)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {progressPercentage}% concluído
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-1">Valor Alvo</h3>
              <p className="text-lg">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(goal.targetAmount)}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Valor Restante</h3>
              <p className="text-lg">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(remainingAmount)}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-1">Data Alvo</h3>
            <p className="text-sm">
              {format(new Date(goal.targetDate), "PPP", { locale: ptBR })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 