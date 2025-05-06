"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

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
  PopoverTrigger 
} from "@/app/_components/ui/popover";
import { Calendar } from "@/app/_components/ui/calendar";
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

export function FormularioMeta({ id }: FormularioMetaProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
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

  // Gerar opções de anos para o calendário
  const renderOpcoesAnos = () => {
    const anoAtual = new Date().getFullYear();
    const anos = [];
    
    for (let i = anoAtual - 5; i <= anoAtual + 2; i++) {
      anos.push(i);
    }
    
    return anos;
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "MMMM 'de' yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione o mês</span>
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
                          disabled={(date) => date > new Date()}
                          initialFocus
                          captionLayout="dropdown-buttons"
                        />
                      </PopoverContent>
                    </Popover>
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
                        <Input
                          placeholder="0,00"
                          {...field}
                          value={field.value === 0 ? "" : `R$ ${field.value.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                          onChange={(e) => {
                            const valor = e.target.value.replace(/\D/g, "");
                            field.onChange(valor ? parseFloat(valor) / 100 : 0);
                          }}
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
                        <Input
                          placeholder="0,00"
                          {...field}
                          value={field.value === 0 ? "" : `R$ ${field.value.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                          onChange={(e) => {
                            const valor = e.target.value.replace(/\D/g, "");
                            field.onChange(valor ? parseFloat(valor) / 100 : 0);
                          }}
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
                        <Input
                          placeholder="0,00"
                          {...field}
                          value={field.value === 0 ? "" : `R$ ${field.value.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                          onChange={(e) => {
                            const valor = e.target.value.replace(/\D/g, "");
                            field.onChange(valor ? parseFloat(valor) / 100 : 0);
                          }}
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