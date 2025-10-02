"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { 
  Plus, 
  Calendar, 
  Trash2,
  Loader2,
  Target,
  Edit,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle
} from "lucide-react";

// Componentes UI
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/app/_components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/app/_components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/app/_components/ui/dialog";
import { Separator } from "@/app/_components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/app/_components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { Textarea } from "@/app/_components/ui/textarea";
import { MoneyInput } from "@/app/_components/money-input";
import { NumberFormatValues } from "react-number-format";
import { cn } from "@/app/_lib/utils";

  // Esquema de validação para o formulário de meta
const metaSchema = z.object({
  mesReferencia: z.date({
    required_error: "Selecione o mês de referência",
  }),
  metaMensal: z.string().refine((val) => val && val.trim() !== "", {
    message: "Meta mensal é obrigatória"
  }),
  metaSalvio: z.string().refine((val) => val && val.trim() !== "", {
    message: "Meta Salvio é obrigatória"
  }),
  metaCoordenador: z.string().refine((val) => val && val.trim() !== "", {
    message: "Meta coordenador é obrigatória"
  }),
  metasVendedores: z.array(
    z.object({
      vendedorId: z.string().min(1, "Vendedor obrigatório"),
      nome: z.string(),
      meta: z.string().min(1, "Valor obrigatório")
    })
  ).optional(),
});

type MetaFormValues = z.infer<typeof metaSchema>;

// Interface para dados de meta
interface Meta {
  id: string;
  mesReferencia: Date;
  metaMensal: number;
  metaSalvio: number;
  metaCoordenador: number;
  metasVendedores?: Array<{
    vendedorId: string;
    nome: string;
    meta: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para dados de vendedor
interface Vendedor {
  id: string;
  nome: string;
}

// Função auxiliar para gerar opções de meses
function generateMonthOptions() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  const options = [];

  // Adicionar opções para o ano atual primeiro
  const currentYearIndex = years.indexOf(currentYear);
  if (currentYearIndex !== -1) {
    // Primeiro mostrar o ano atual
    const year = years[currentYearIndex];
    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month, 1);
      const value = date.toISOString();
      const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
      options.push({ value, label, date, year });
    }
    
    // Depois outros anos
    for (let i = 0; i < years.length; i++) {
      if (i !== currentYearIndex) {
        const year = years[i];
        for (let month = 0; month < 12; month++) {
          const date = new Date(year, month, 1);
          const value = date.toISOString();
          const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
          options.push({ value, label, date, year });
        }
      }
    }
  }

  return options;
}

export default function MetasPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Definição das etapas do formulário
  const steps = [
    { id: "informacoes-basicas", label: "Informações Básicas" },
    { id: "metas-gerais", label: "Metas Gerais" },
    { id: "metas-vendedor", label: "Metas por Vendedor" }
  ];
  
  const router = useRouter();

  // Valores padrão para o formulário
  const defaultValues: MetaFormValues = {
    mesReferencia: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    metaMensal: "",
    metaSalvio: "",
    metaCoordenador: "",
    metasVendedores: [],
  };
  
  // Configuração do formulário
  const form = useForm<MetaFormValues>({
    resolver: zodResolver(metaSchema),
    defaultValues,
  });
  
  // Gerar opções de meses uma vez
  const monthOptions = useMemo(() => generateMonthOptions(), []);
  
  // Efeito para monitorar mudanças no step
  useEffect(() => {
    console.log("Current step changed to:", currentStep);
    // Force dialog to stay open during step transitions
    if (isDialogOpen) {
      const keepDialogOpen = () => setIsDialogOpen(true);
      // Usar timeout to ensure dialog doesn't close during transitions
      const timeoutId = setTimeout(keepDialogOpen, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [currentStep, isDialogOpen]);
  
  // Carregar vendedores ao iniciar - usando a mesma fonte do ranking de vendas
  useEffect(() => {
    const carregarVendedores = async () => {
      try {
        console.log("🔍 Carregando vendedores para metas...");
        
        // Usar as mesmas datas do mês atual que são usadas no dashboard de vendas
        const hoje = new Date();
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        
        // Buscar vendedores da mesma API que o ranking usa
        const params = new URLSearchParams({
          dataInicio: primeiroDiaMes.toISOString(),
          dataFim: ultimoDiaMes.toISOString()
        });
        
        const response = await fetch(`/api/dashboard/vendedores?${params}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log("📊 Dados dos vendedores recebidos:", data);
          
          if (data.vendedores && Array.isArray(data.vendedores)) {
            // Mapear vendedores para o formato esperado pelo modal de metas
            const vendedoresMapeados = data.vendedores
              .filter((v: any) => v.nome && v.nome.trim() !== '') // Filtrar vendedores sem nome
              .map((vendedor: any) => ({
                id: vendedor.nome.toLowerCase().replace(/\s+/g, '-'), // Gerar ID baseado no nome
                nome: vendedor.nome.trim()
              }))
              .sort((a: any, b: any) => a.nome.localeCompare(b.nome)); // Ordenar alfabeticamente
            
            console.log("👥 Vendedores mapeados:", vendedoresMapeados);
            setVendedores(vendedoresMapeados);
          } else {
            console.warn("⚠️ Nenhum vendedor encontrado na resposta da API");
            setVendedores([]);
          }
        } else {
          console.error("❌ Erro ao buscar vendedores:", response.status, response.statusText);
          setVendedores([]);
        }
      } catch (error) {
        console.error("❌ Erro ao carregar vendedores:", error);
        setVendedores([]);
      }
    };
    
    carregarVendedores();
  }, []);
  
  // Função para carregar metas do servidor com melhor tratamento de erros
  async function loadMetas() {
    if (isLoading) return; // Evita múltiplas chamadas simultâneas
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const response = await fetch("/api/dashboard/metas", {
        // Adiciona cache: no-store para evitar cache do navegador
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar metas: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("📥 Dados brutos recebidos do servidor:", data);
      
      if (!Array.isArray(data)) {
        throw new Error("Formato de dados inválido");
      }
      
      // Converter datas para objetos Date e parsear metasVendedores
      const metasFormatadas = data.map((meta: any) => {
        try {
          return {
            ...meta,
            mesReferencia: new Date(meta.mesReferencia),
            createdAt: new Date(meta.createdAt),
            updatedAt: new Date(meta.updatedAt),
            metasVendedores: Array.isArray(meta.metasVendedores) 
              ? meta.metasVendedores 
              : typeof meta.metasVendedores === 'string'
                ? JSON.parse(meta.metasVendedores)
                : []
          };
        } catch (error) {
          console.error("Erro ao processar meta:", meta, error);
          return null;
        }
      }).filter(Boolean); // Remove itens inválidos
      
      console.log("✅ Metas formatadas finais:", metasFormatadas);
      setMetas(metasFormatadas);
    } catch (error) {
      console.error("Erro ao carregar metas:", error);
      setLoadError(error instanceof Error ? error.message : "Erro ao carregar metas");
      toast.error("Erro ao carregar metas. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  // Efeito para carregar metas inicialmente e recarregar quando necessário
  useEffect(() => {
    loadMetas();
  }, []);

  // Efeito para recarregar metas quando o diálogo é fechado
  useEffect(() => {
    if (!isDialogOpen) {
      loadMetas();
    }
  }, [isDialogOpen]);

  // Adicionar um vendedor à lista de metas por vendedor
  const adicionarVendedor = () => {
    const metasVendedores = form.getValues('metasVendedores') || [];
    
    // Verificar se ainda há vendedores disponíveis para selecionar
    const vendedoresJaSelecionados = metasVendedores.map(mv => mv.vendedorId).filter(Boolean);
    const vendedoresDisponiveis = vendedores.filter(v => !vendedoresJaSelecionados.includes(v.id));
    
    if (vendedoresDisponiveis.length === 0) {
      toast.error("Todos os vendedores disponíveis já foram selecionados.");
      console.log("⚠️ Tentativa de adicionar vendedor bloqueada - todos já selecionados");
      return;
    }
    
    form.setValue('metasVendedores', [
      ...metasVendedores,
      { vendedorId: '', nome: '', meta: '' }
    ]);
    
    console.log(`📝 Vendedor adicionado. Disponíveis: ${vendedoresDisponiveis.length}, Já selecionados: ${vendedoresJaSelecionados.length}`);
  };

  // Remover um vendedor da lista de metas por vendedor
  const removerVendedor = (index: number) => {
    const metasVendedores = form.getValues('metasVendedores') || [];
    metasVendedores.splice(index, 1);
    form.setValue('metasVendedores', [...metasVendedores]);
  };

  // Atualizar nome do vendedor ao selecionar ID
  const atualizarNomeVendedor = (index: number, id: string) => {
    console.log("🔄 Atualizando nome do vendedor. ID:", id, "Vendedores disponíveis:", vendedores);
    
    const vendedor = vendedores.find(v => v.id === id);
    if (vendedor) {
      const metasVendedores = form.getValues('metasVendedores') || [];
      metasVendedores[index].nome = vendedor.nome;
      form.setValue('metasVendedores', [...metasVendedores]);
      
      console.log("✅ Nome do vendedor atualizado:", vendedor.nome);
    } else {
      console.warn("⚠️ Vendedor não encontrado para ID:", id);
    }
  };

  // Funções de navegação entre etapas
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      // Evitar que o modal seja fechado durante a transição
      setTimeout(() => {
      setCurrentStep(current => current + 1);
      }, 0);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      // Evitar que o modal seja fechado durante a transição
      setTimeout(() => {
      setCurrentStep(current => current - 1);
      }, 0);
    }
  };
  
  // Função modificada para verificar a validação final apenas na submissão
  const isFormValid = () => {
    const formValues = form.getValues();
    console.log("=== VALIDAÇÃO CUSTOMIZADA ===");
    console.log("Form values:", formValues);
    
    // Verificar etapa 1
    if (!(formValues.mesReferencia instanceof Date)) {
      console.log("FALHA: mesReferencia não é Date:", typeof formValues.mesReferencia, formValues.mesReferencia);
      return false;
    }
    console.log("✓ mesReferencia válida");
    
    // Verificar etapa 2
    if (!formValues.metaMensal || formValues.metaMensal.trim() === '') {
      console.log("FALHA: metaMensal inválida:", formValues.metaMensal);
      return false;
    }
    if (!formValues.metaSalvio || formValues.metaSalvio.trim() === '') {
      console.log("FALHA: metaSalvio inválida:", formValues.metaSalvio);
      return false;
    }
    if (!formValues.metaCoordenador || formValues.metaCoordenador.trim() === '') {
      console.log("FALHA: metaCoordenador inválida:", formValues.metaCoordenador);
      return false;
    }
    console.log("✓ Valores monetários válidos");
    
    // Verificar etapa 3 (opcional)
    if (formValues.metasVendedores && formValues.metasVendedores.length > 0) {
      console.log("Verificando vendedores:", formValues.metasVendedores);
      
      // Verificar apenas vendedores que tenham algum campo preenchido
      const vendedoresPreenchidos = formValues.metasVendedores.filter(
        v => (v.vendedorId && v.vendedorId !== '') || (v.meta && v.meta !== '')
      );
      
      console.log("Vendedores preenchidos:", vendedoresPreenchidos);
      
      // Se houver vendedores com dados, todos precisam estar completos
      for (const vendedor of vendedoresPreenchidos) {
        if (!vendedor.vendedorId || vendedor.vendedorId === '' || !vendedor.meta || vendedor.meta === '') {
          console.log("FALHA: Vendedor incompleto:", vendedor);
          return false;
        }
      }
    }
    console.log("✓ Vendedores válidos");
    
    console.log("✓ Formulário totalmente válido!");
    return true;
  };
  
  // Resetar formulário e estado
  const resetForm = () => {
    setCurrentStep(0);
    form.reset(defaultValues);
    setEditingMeta(null);
  };

  // Lidar com envio do formulário
  const onSubmit = async (data: MetaFormValues) => {
    console.log("=== INÍCIO DO SUBMIT ===");
    console.log("Step atual:", currentStep);
    console.log("Dados recebidos:", data);
    console.log("Form errors:", form.formState.errors);
    
    // Verificar validação do Zod
    const validationResult = metaSchema.safeParse(data);
    if (!validationResult.success) {
      console.log("Erro de validação Zod:", validationResult.error);
      toast.error("Erro de validação: " + validationResult.error.issues.map(i => i.message).join(", "));
      return;
    }
    
    console.log("Validação Zod passou!");
    
    // Verificar se o formulário está válido antes de enviar
    if (!isFormValid()) {
      console.log("Formulário falhou na validação customizada");
      toast.error("Por favor, verifique se todos os campos obrigatórios estão preenchidos corretamente.");
      
      // Identificar qual step tem problemas e navegar para ele
      const formValues = form.getValues();
      console.log("Valores atuais do form:", formValues);
      
      if (!(formValues.mesReferencia instanceof Date)) {
        console.log("Erro no step 0 - mesReferencia");
        setCurrentStep(0);
        return;
      }
      
      if (!formValues.metaMensal || !formValues.metaSalvio || !formValues.metaCoordenador) {
        console.log("Erro no step 1 - valores monetários");
        setCurrentStep(1);
        return;
      }
      
      // Se chegou até aqui, o problema está no step 3
      console.log("Erro no step 2 - vendedores");
      setCurrentStep(2);
      return;
    }
    
    console.log("Formulário válido, prosseguindo com o envio...");

    setIsLoading(true);
    
    try {
      // Função auxiliar para converter valores de forma correta
      const converterParaNumero = (valor: string | number): number => {
        if (typeof valor === 'number') return valor;
        
        // Se o valor for vazio, retornar 0
        if (!valor || valor === '') return 0;
        
        // Valor já pode estar em formato numérico com ponto decimal (do NumericFormat.value)
        if (!isNaN(Number(valor))) {
          return Number(valor);
        }
        
        // Se ainda houver máscara, remover
        // Remover prefixo R$ e separadores de milhar
        const valorLimpo = valor.replace(/[^\d,]/g, '');
        
        // Converter vírgula para ponto
        return Number(valorLimpo.replace(',', '.'));
      };
      
      // Converter valores usando a função auxiliar
      const metaData = {
        ...data,
        metaMensal: converterParaNumero(data.metaMensal),
        metaSalvio: converterParaNumero(data.metaSalvio),
        metaCoordenador: converterParaNumero(data.metaCoordenador),
        metasVendedores: data.metasVendedores?.map(v => ({
          vendedorId: v.vendedorId,
          nome: v.nome,
          meta: converterParaNumero(v.meta)
        }))
      };
      
      // Log para debug após conversão
      console.log("Valores convertidos:", metaData);
      
      const url = editingMeta 
        ? `/api/dashboard/metas/${editingMeta.id}` 
        : "/api/dashboard/metas";
      
      const method = editingMeta ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metaData),
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao ${editingMeta ? 'atualizar' : 'cadastrar'} meta`);
      }
      
      const savedMeta = await response.json();
      
      // Atualizar lista de metas
      if (editingMeta) {
        setMetas(metas.map(m => m.id === editingMeta.id ? {
          ...savedMeta,
          mesReferencia: new Date(savedMeta.mesReferencia),
          createdAt: new Date(savedMeta.createdAt),
          updatedAt: new Date(savedMeta.updatedAt),
        } : m));
      } else {
        setMetas([...metas, {
          ...savedMeta,
          mesReferencia: new Date(savedMeta.mesReferencia),
          createdAt: new Date(savedMeta.createdAt),
          updatedAt: new Date(savedMeta.updatedAt),
        }]);
      }
      
      toast.success(`Meta ${editingMeta ? 'atualizada' : 'cadastrada'} com sucesso!`);
      
      // Após salvar com sucesso, fechar o diálogo
      setIsDialogOpen(false);
      resetForm();
      
      // Recarregar as metas para garantir dados atualizados
      await loadMetas();
      
    } catch (error) {
      console.error("Erro:", error);
      toast.error(`Erro ao ${editingMeta ? 'atualizar' : 'cadastrar'} meta`);
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir formulário para edição
  const handleEdit = (meta: Meta) => {
    console.log("🔧 Iniciando edição da meta:", meta);
    console.log("📋 metasVendedores originais:", meta.metasVendedores);
    
    setEditingMeta(meta);
    setCurrentStep(0);
    
    // Garantir que metasVendedores seja um array válido
    const metasVendedores = Array.isArray(meta.metasVendedores) 
      ? meta.metasVendedores 
      : [];
    
    console.log("✅ metasVendedores processadas:", metasVendedores);
    
    // Mapear vendedores para o formato do formulário
    const metasVendedoresParaFormulario = metasVendedores.map(v => ({
      vendedorId: v.vendedorId,
      nome: v.nome,
      meta: v.meta.toString()
    }));
    
    console.log("📝 Dados para o formulário:", {
      mesReferencia: meta.mesReferencia,
      metaMensal: meta.metaMensal.toString(),
      metaSalvio: meta.metaSalvio.toString(),
      metaCoordenador: meta.metaCoordenador.toString(),
      metasVendedores: metasVendedoresParaFormulario
    });
    
    // Reset com valores numéricos convertidos para string sem formatação
    form.reset({
      mesReferencia: meta.mesReferencia,
      metaMensal: meta.metaMensal.toString(),
      metaSalvio: meta.metaSalvio.toString(),
      metaCoordenador: meta.metaCoordenador.toString(),
      metasVendedores: metasVendedoresParaFormulario
    });
    
    setIsDialogOpen(true);
  };

  // Remover meta
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta meta?")) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/dashboard/metas/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Erro ao excluir meta");
      }
      
      setMetas(metas.filter(meta => meta.id !== id));
      toast.success("Meta excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir meta:", error);
      toast.error("Não foi possível excluir a meta");
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar interface
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Metas</h1>
          <p className="text-muted-foreground">
            Gerencie as metas comerciais da sua equipe
          </p>
        </div>
        
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            // Cancelar fechamento do modal durante carregamento ou quando o usuário tenta fechar
            if (!open && isLoading) {
              return; // Não permite fechar quando está carregando
            }
            
            // Permitir fechamento apenas quando explicitamente requisitado
          if (!open) {
            resetForm();
          }
            setIsDialogOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          
          <DialogContent 
            className="sm:max-w-[500px]"
            onInteractOutside={(e) => {
              // Prevenir fechamento por clique externo em qualquer situação
              e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
              // Prevenir fechamento por pressionar ESC em qualquer situação 
              // (não apenas durante carregamento)
              e.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {editingMeta ? "Editar Meta" : "Cadastrar Nova Meta"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da meta comercial
              </DialogDescription>
            </DialogHeader>
            
            {/* Indicador de etapas */}
            <div className="mb-4">
              <div className="flex justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 
                      ${currentStep === index 
                        ? 'bg-primary text-white border-primary' 
                        : currentStep > index 
                          ? 'bg-primary/20 border-primary/50 text-primary' 
                          : 'bg-muted border-muted-foreground text-muted-foreground'}`}
                    >
                      {currentStep > index ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className="text-xs mt-1 text-center">{step.label}</span>
                  </div>
                ))}
              </div>
              <div className="relative mt-2">
                <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-full"></div>
                <div 
                  className="absolute top-0 left-0 h-1 bg-primary rounded-full transition-all"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Etapa 1: Informações Básicas */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="mesReferencia"
                      render={({ field }) => (
                        <FormItem className="flex flex-col mb-4">
                          <FormLabel>Mês de Referência</FormLabel>
                          <Select
                            value={field.value instanceof Date ? field.value.toISOString() : undefined}
                            onValueChange={(value) => {
                              // Converter string ISO para objeto Date
                              field.onChange(new Date(value));
                              
                              // Manter foco na página para evitar problemas com o modal
                              // Isso evita que o dialog feche ao selecionar o mês
                              setTimeout(() => {
                                // Reforçar que o dialog deve continuar aberto
                                if (isDialogOpen) {
                                  setIsDialogOpen(true);
                                }
                              }, 0);
                            }}
                          >
                            <SelectTrigger className="w-full h-10">
                              <SelectValue placeholder="Selecione o mês">
                                {field.value instanceof Date 
                                  ? format(field.value, "MMMM 'de' yyyy", { locale: ptBR })
                                  : "Selecione o mês"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent 
                              className="max-h-[300px] overflow-y-auto min-w-[240px]"
                              position="popper"
                              sideOffset={4}
                              side="bottom"
                              align="start"
                            >
                              {monthOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="py-2.5">
                                  {format(new Date(option.value), "MMMM 'de' yyyy", { locale: ptBR })}
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
                  </div>
                )}
                
                {/* Etapa 2: Metas Gerais */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                                            <FormField
                      control={form.control}
                      name="metaMensal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Mensal (R$)</FormLabel>
                          <FormControl>
                            <MoneyInput
                              placeholder="0,00"
                              value={field.value}
                              onValueChange={(values: NumberFormatValues) => {
                                // Usar apenas o value sem formatação - contém apenas dígitos e ponto decimal
                                field.onChange(values.value);
                              }}
                              className="w-full"
                            />
                          </FormControl>
                          <FormDescription>
                            Meta geral da equipe para o mês
                          </FormDescription>
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
                            <MoneyInput
                              placeholder="0,00"
                              value={field.value}
                              onValueChange={(values: NumberFormatValues) => {
                                // Usar apenas o value sem formatação
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
                          <FormLabel>Meta do Coordenador (R$)</FormLabel>
                          <FormControl>
                            <MoneyInput
                              placeholder="0,00"
                              value={field.value}
                              onValueChange={(values: NumberFormatValues) => {
                                // Usar apenas o value sem formatação
                                field.onChange(values.value);
                              }}
                              className="w-full"
                            />
                          </FormControl>
                          <FormDescription>
                            Meta específica para o coordenador
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {/* Etapa 3: Metas por Vendedor */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <FormLabel>Metas por Vendedor</FormLabel>
                        <FormDescription className="text-xs mt-1">
                          Lista baseada nos vendedores do ranking atual (mês corrente)
                        </FormDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={adicionarVendedor}
                        disabled={(() => {
                          if (vendedores.length === 0) return true;
                          
                          // Verificar se ainda há vendedores disponíveis
                          const metasVendedores = form.watch('metasVendedores') || [];
                          const vendedoresJaSelecionados = metasVendedores.map(mv => mv.vendedorId).filter(Boolean);
                          const vendedoresDisponiveis = vendedores.filter(v => !vendedoresJaSelecionados.includes(v.id));
                          
                          return vendedoresDisponiveis.length === 0;
                        })()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Vendedor
                      </Button>
                    </div>
                    
                    {vendedores.length === 0 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          <strong>Atenção:</strong> Nenhum vendedor encontrado no ranking atual. 
                          Verifique se existem vendas no mês corrente ou aguarde o carregamento dos dados.
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {(form.watch('metasVendedores') || []).map((vendedor, index) => (
                        <div key={index} className="flex items-center space-x-2 border p-3 rounded-md bg-muted/30">
                          <div className="grid grid-cols-12 gap-2 w-full">
                            <div className="col-span-7">
                              <Select
                                value={vendedor.vendedorId}
                                onValueChange={(value) => {
                                  const metasVendedores = [...(form.getValues('metasVendedores') || [])];
                                  metasVendedores[index].vendedorId = value;
                                  form.setValue('metasVendedores', metasVendedores);
                                  atualizarNomeVendedor(index, value);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um vendedor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(() => {
                                    if (vendedores.length === 0) {
                                      return (
                                        <SelectItem value="no-vendedores" disabled>
                                          Nenhum vendedor encontrado
                                        </SelectItem>
                                      );
                                    }
                                    
                                    // Obter IDs dos vendedores já selecionados (exceto o atual)
                                    const metasVendedores = form.getValues('metasVendedores') || [];
                                    const vendedoresJaSelecionados = metasVendedores
                                      .map((mv, idx) => idx !== index ? mv.vendedorId : null)
                                      .filter(Boolean);
                                    
                                    // Filtrar vendedores disponíveis
                                    const vendedoresDisponiveis = vendedores.filter(v => 
                                      !vendedoresJaSelecionados.includes(v.id)
                                    );
                                    
                                    if (vendedoresDisponiveis.length === 0) {
                                      return (
                                        <SelectItem value="no-disponivel" disabled>
                                          Todos os vendedores já foram selecionados
                                        </SelectItem>
                                      );
                                    }
                                    
                                    return vendedoresDisponiveis.map((v) => (
                                      <SelectItem key={v.id} value={v.id}>
                                        {v.nome}
                                      </SelectItem>
                                    ));
                                  })()}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="col-span-4">
                              <MoneyInput
                                placeholder="0,00"
                                value={vendedor.meta}
                                onValueChange={(values: NumberFormatValues) => {
                                  const metasVendedores = [...(form.getValues('metasVendedores') || [])];
                                  metasVendedores[index].meta = values.value;
                                  form.setValue('metasVendedores', metasVendedores);
                                }}
                                className="w-full"
                              />
                            </div>
                            
                            <div className="col-span-1 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removerVendedor(index)}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {(form.watch('metasVendedores')?.length || 0) === 0 && (
                        <div className="flex items-center justify-center h-20 border border-dashed rounded-md">
                          <p className="text-sm text-muted-foreground">
                            Nenhum vendedor com meta específica definida
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <FormDescription className="mt-2">
                      Defina metas individuais para cada vendedor da equipe
                    </FormDescription>
                  </div>
                )}
                
                {/* Navegação entre etapas */}
                <div className="flex justify-between pt-4 mt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep}
                    disabled={isLoading || currentStep === 0}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>
                  
                  {currentStep < steps.length - 1 ? (
                    // Botão Próximo
                    <Button 
                      type="button" 
                      onClick={(e) => {
                        // Prevenir qualquer comportamento padrão
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Garantir que o botão não cause fechamento
                        const handleNext = () => {
                          setCurrentStep(current => {
                            // Verificar se pode avançar
                            if (current < steps.length - 1) {
                              return current + 1;
                            }
                            return current;
                          });
                        };
                        
                        // Usar setTimeout para executar após o fim do evento atual
                        setTimeout(handleNext, 0);
                      }}
                      disabled={isLoading}
                    >
                      Próximo
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      {/* Botão de debug temporário */}
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => {
                          console.log("=== DEBUG BUTTON ===");
                          const values = form.getValues();
                          console.log("Current form values:", values);
                          console.log("Form state:", form.formState);
                          console.log("Form errors:", form.formState.errors);
                          console.log("Is valid:", isFormValid());
                          console.log("Zod validation:", metaSchema.safeParse(values));
                        }}
                        disabled={isLoading}
                      >
                        Debug
                      </Button>
                      
                      {/* Botão de submissão no último passo */}
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingMeta ? "Atualizar Meta" : "Cadastrar Meta"}
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Separator />
      
      {loadError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10">
            <div className="text-destructive mb-4">
              <AlertCircle className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium">Erro ao carregar metas</h3>
            <p className="text-muted-foreground text-center mt-2">
              {loadError}
            </p>
            <Button 
              onClick={() => loadMetas()} 
              className="mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                'Tentar Novamente'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : isLoading && metas.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando metas...</span>
        </div>
      ) : metas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma meta cadastrada</h3>
            <p className="text-muted-foreground text-center mt-2">
              Comece cadastrando sua primeira meta comercial usando o botão "Nova Meta".
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Metas Cadastradas</CardTitle>
            <CardDescription>
              Visualize e gerencie todas as metas comerciais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês de Referência</TableHead>
                  <TableHead className="text-right">Meta Mensal</TableHead>
                  <TableHead className="text-right">Meta Salvio</TableHead>
                  <TableHead className="text-right">Meta Coordenador</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metas.map((meta) => (
                  <TableRow key={meta.id}>
                    <TableCell className="font-medium">
                      {format(meta.mesReferencia, "MMMM 'de' yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      {meta.metaMensal.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {meta.metaSalvio.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {meta.metaCoordenador.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleEdit(meta)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="icon"
                          onClick={() => handleDelete(meta.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 