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
import { useState } from "react";
import { toast } from "sonner";
import { Wallet } from "@prisma/client";
import { ExtractData, ExtractList } from "./extract-list";
import { format } from "date-fns";
import { Calendar } from "@/app/_components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { CalendarIcon } from "lucide-react";

const formSchema = z.object({
  startDate: z.date({
    required_error: "A data inicial é obrigatória",
  }),
  endDate: z.date({
    required_error: "A data final é obrigatória",
  }).refine(date => date instanceof Date, {
    message: "Data final inválida",
  }),
}).refine(data => data.endDate >= data.startDate, {
  message: "A data final deve ser maior ou igual à data inicial",
  path: ["endDate"],
});

interface ExtractFormProps {
  wallet: Wallet;
}

export function ExtractForm({ wallet }: ExtractFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [extractData, setExtractData] = useState<ExtractData | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // 30 dias atrás
      endDate: new Date(),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      
      const startDate = format(values.startDate, "yyyy-MM-dd");
      const endDate = format(values.endDate, "yyyy-MM-dd");
      
      const response = await fetch(`/api/banks/extracts?walletId=${wallet.id}&startDate=${startDate}&endDate=${endDate}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar extrato");
      }
      
      const data = await response.json();
      
      if (data.extrato && data.extrato.listaLancamentos) {
        setExtractData({
          wallet: data.wallet,
          transactions: data.extrato.listaLancamentos,
          startDate: values.startDate,
          endDate: values.endDate,
        });
        
        toast.success("Extrato obtido com sucesso!");
      } else {
        toast.warning("Nenhuma transação encontrada para o período selecionado");
        setExtractData(null);
      }
    } catch (error) {
      console.error("EXTRACT_ERROR", error);
      toast.error(error instanceof Error ? error.message : "Erro ao buscar extrato");
      setExtractData(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Data Inicial</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
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
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Data de início do extrato
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Data Final</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
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
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Data final do extrato
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Consultando..." : "Consultar Extrato"}
          </Button>
        </form>
      </Form>

      {extractData && (
        <ExtractList data={extractData} />
      )}
    </div>
  );
} 