"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NumericFormat } from "react-number-format";

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
  SelectValue
} from "@/app/_components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { useToast } from "@/app/_components/ui/use-toast";
import { cn } from "@/app/_lib/utils";

// Schema de validação do formulário
const metaSchema = z.object({
  mesReferencia: z.date({
    required_error: "Selecione um mês de referência",
  }),
  metaMensal: z.coerce.number({
    required_error: "Informe a meta mensal",
    invalid_type_error: "O valor deve ser um número",
  }).min(0, "A meta não pode ser negativa"),
  metaSalvio: z.coerce.number({
    required_error: "Informe a meta do Salvio",
    invalid_type_error: "O valor deve ser um número",
  }).min(0, "A meta não pode ser negativa"),
  metaCoordenador: z.coerce.number({
    required_error: "Informe a meta do Coordenador",
    invalid_type_error: "O valor deve ser um número",
  }).min(0, "A meta não pode ser negativa"),
  observacoes: z.string().optional(),
});

type MetaFormValues = z.infer<typeof metaSchema>;

interface FormularioMetaProps {
  id?: string;
}

// Nova função utilitária para gerar opções de meses
function generateMonthOptions() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  const options = [];

  for (const year of years) {
    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month, 1);
      const value = date.toISOString();
      const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
      options.push({ value, label, date });
    }
  }

  return options;
}

export function FormularioMeta({ id }: FormularioMetaProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Gerar opções de meses uma vez
  const monthOptions = useMemo(() => generateMonthOptions(), []);
  
  // Definir formulário
  const form = useForm<MetaFormValues>({
    resolver: zodResolver(metaSchema),
    defaultValues: {
      mesReferencia: new Date(),
      metaMensal: 0,
      metaSalvio: 0,
      metaCoordenador: 0,
      observacoes: "",
    },
  });

  // Efeito para buscar os dados da meta caso esteja editando
  useEffect(() => {
    if (id) {
      const buscarMeta = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/metas-vendas/${id}`);
          
          if (!response.ok) {
            throw new Error("Erro ao buscar meta");
          }
          
          const meta = await response.json();
          
          // Converter string para Date e ajustar campos
          form.reset({
            mesReferencia: new Date(meta.mesReferencia),
            metaMensal: meta.metaMensal,
            metaSalvio: meta.metaSalvio,
            metaCoordenador: meta.metaCoordenador,
            observacoes: meta.observacoes || "",
          });
        } catch (error) {
          console.error("Erro ao buscar meta:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados da meta.",
            variant: "destructive",
          });
          router.push("/metas-vendas");
        } finally {
          setIsLoading(false);
        }
      };
      
      buscarMeta();
    }
  }, [id, form, router, toast]);

  // Helper para converter string para número
  const converterParaNumero = (valor: string): number => {
    if (!valor) return 0;
    
    // Remover caracteres não numéricos, exceto ponto e vírgula
    const apenasNumeros = valor.replace(/[^\d,.]/g, "");
    // Substituir vírgula por ponto para conversão correta
    const valorNumerico = parseFloat(apenasNumeros.replace(/,/g, "."));
    
    return isNaN(valorNumerico) ? 0 : valorNumerico;
  };

  // Função de envio do formulário
  const onSubmit = async (values: MetaFormValues) => {
    setIsLoading(true);
    
    try {
      // Definir método e URL com base em criação ou edição
      const method = id ? "PUT" : "POST";
      const url = id ? `/api/metas-vendas/${id}` : "/api/metas-vendas";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mesReferencia: values.mesReferencia,
          metaMensal: values.metaMensal,
          metaSalvio: values.metaSalvio,
          metaCoordenador: values.metaCoordenador,
          observacoes: values.observacoes || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar meta");
      }
      
      toast({
        title: id ? "Meta atualizada" : "Meta criada",
        description: id 
          ? "A meta foi atualizada com sucesso." 
          : "A meta foi criada com sucesso.",
      });
      
      // Redirecionar para a lista
      router.push("/metas-vendas");
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao salvar meta:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a meta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para formatar valor monetário ao digitar
  const formatarValorMonetario = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir excluir tudo
    if (!e.target.value) {
      return "";
    }
    
    // Remover caracteres não numéricos
    const valor = e.target.value.replace(/\D/g, "");
    // Converter para número e formatar como moeda
    const numeroFormatado = (parseFloat(valor) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    return `R$ ${numeroFormatado}`;
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle>{id ? "Editar Meta" : "Nova Meta"}</CardTitle>
        <CardDescription>
          {id 
            ? "Atualize os dados da meta de vendas selecionada." 
            : "Preencha o formulário para criar uma nova meta de vendas."}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="mesReferencia"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Mês de Referência</FormLabel>
                    <Select
                      value={field.value instanceof Date ? field.value.toISOString() : undefined}
                      onValueChange={(value) => {
                        // Converter string ISO para objeto Date
                        field.onChange(new Date(value));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o mês">
                          {field.value instanceof Date 
                            ? format(field.value, "MMMM 'de' yyyy", { locale: ptBR })
                            : "Selecione o mês"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecione o mês para o qual esta meta é válida.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="metaMensal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Mensal (R$)</FormLabel>
                      <FormControl>
                        <NumericFormat
                          customInput={Input}
                          thousandSeparator="."
                          decimalSeparator=","
                          decimalScale={2}
                          fixedDecimalScale
                          allowNegative={false}
                          prefix="R$ "
                          placeholder="0,00"
                          value={field.value}
                          onValueChange={(values) => {
                            field.onChange(values.value);
                          }}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="metaSalvio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Salvio (R$)</FormLabel>
                      <FormControl>
                        <NumericFormat
                          customInput={Input}
                          thousandSeparator="."
                          decimalSeparator=","
                          decimalScale={2}
                          fixedDecimalScale
                          allowNegative={false}
                          prefix="R$ "
                          placeholder="0,00"
                          value={field.value}
                          onValueChange={(values) => {
                            field.onChange(values.value);
                          }}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="metaCoordenador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Coordenador (R$)</FormLabel>
                      <FormControl>
                        <NumericFormat
                          customInput={Input}
                          thousandSeparator="."
                          decimalSeparator=","
                          decimalScale={2}
                          fixedDecimalScale
                          allowNegative={false}
                          prefix="R$ "
                          placeholder="0,00"
                          value={field.value}
                          onValueChange={(values) => {
                            field.onChange(values.value);
                          }}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações adicionais sobre esta meta..." 
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Informações adicionais relevantes para esta meta (opcional).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/metas-vendas")}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                      {id ? "Salvando..." : "Criando..."}
                    </div>
                  ) : id ? "Salvar Alterações" : "Criar Meta"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
} 
