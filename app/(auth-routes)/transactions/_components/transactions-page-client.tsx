"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/_components/ui/card";
import { AddTransactionButton } from "@/app/_components";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { Calendar } from "@/app/_components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover";
import { DatePickerWithRange } from "@/app/_components/ui/date-range-picker";
import { PeriodFilter, PredefinedPeriod } from "@/app/_components/ui/period-filter";
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  CalendarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  SearchIcon,
  FileTextIcon,
  FilterIcon,
  XIcon,
  BarChart2,
  TagIcon,
  PaperclipIcon,
  CreditCard,
  Wallet,
  Tags,
  FileText,
  PenLine,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Link as LinkIcon,
  X,
  Loader2,
  Search,
  CircleDollarSign,
  RotateCcw
} from "lucide-react";
import { Checkbox } from "@/app/_components/ui/checkbox";
import { Label } from "@/app/_components/ui/label";
import { format, parseISO, startOfDay, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TransactionType } from "@prisma/client";
import { useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { DateRange } from "react-day-picker";
import { cn } from "@/app/_lib/utils";
import { Badge } from "@/app/_components/ui/badge";
import { CashFlowPrediction } from "@/app/_types/transaction";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/_components/ui/tooltip";
import { useToast } from "@/app/_components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/_components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { TransactionAttachments, Attachment } from "@/app/_components/transactions";
import { TransactionDetailsModal } from "@/app/_components/transactions/transaction-details-modal";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from "@/app/_components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/app/_components/ui/pagination";

// Tipo para as transações mostradas na interface
interface Transaction {
  id: string;
  name: string;
  description: string;
  amount: number;
  date: Date;
  type: TransactionType;
  category: string;
  paymentMethod: any;
  metadata?: any;
  tags?: string[];
  attachments?: {
    id: string;
    fileName: string;
    fileUrl: string;
  }[];
  wallet: {
    id: string;
    name: string;
    type: string;
    color?: string | null;
  } | null;
  status: string;
  isReconciled: boolean;
  fromGestaoClick: boolean;
  linkedSales: any[];
  isFromTransaction: boolean;
  saleData: any;
}

// Tipo para paginação
interface Paginacao {
  paginaAtual: number;
  totalPaginas: number;
  totalItems: number;
  itensPorPagina: number;
  total: number;
}

// Tipo para filtros
interface Filtros {
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  receitas?: boolean;
  despesas?: boolean;
  carteira_id?: string;
  periodo?: string;
  categoria_id?: string;
  busca?: string;
  incluir_vendas?: boolean;
  tipo?: string;
  ordem?: string;
  tags?: string[];
  status_conciliacao?: string;
}

// Props do componente
interface TransactionsPageClientProps {
  transactions: Transaction[];
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  wallets: { id: string; name: string }[];
  paginacao: Paginacao;
  filtros: Filtros;
  categorias: string[];
  predictions?: CashFlowPrediction[];
}

export function TransactionsPageClient({
  transactions,
  totalReceitas,
  totalDespesas,
  saldo,
  wallets,
  paginacao,
  filtros,
  categorias,
  predictions = []
}: TransactionsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  // Estados para filtros locais
  const [busca, setBusca] = useState(filtros.busca || "");
  const [carteiraFiltro, setCarteiraFiltro] = useState(filtros.carteira_id || "todas");
  const [categoriaFiltro, setCategoriaFiltro] = useState(filtros.categoria_id || "todas");
  const [ordenacao, setOrdenacao] = useState(filtros.ordem || "asc");
  const [tagsFiltro, setTagsFiltro] = useState<string[]>(filtros.tags || []);
  
  // Estado para o range de datas
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    filtros.dataInicio || filtros.dataFim
      ? {
          from: filtros.dataInicio ? parseISO(filtros.dataInicio) : undefined,
          to: filtros.dataFim ? parseISO(filtros.dataFim) : undefined
        }
      : undefined
  );
  
  // Estado para o modal de detalhes
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PredefinedPeriod>(
    (filtros.periodo as PredefinedPeriod) || "30dias"
  );

  // Formatar valores monetários
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  // Formatar período de datas
  const formatarPeriodo = (dataInicio?: string, dataFim?: string) => {
    if (!dataInicio && !dataFim) return "";
    
    const formatarData = (data?: string) => {
      if (!data) return "";
      return format(parseISO(data), "dd/MM/yyyy");
    };
    
    if (dataInicio && dataFim) {
      return `${formatarData(dataInicio)} a ${formatarData(dataFim)}`;
    } else if (dataInicio) {
      return `A partir de ${formatarData(dataInicio)}`;
    } else if (dataFim) {
      return `Até ${formatarData(dataFim)}`;
    }
    
    return "";
  };

  // Atualizar URL com filtros e paginação
  const atualizarURL = (filtros: Filtros, novaPagina?: number) => {
    // Constrói a URL com os filtros ativos
    let url = `/transactions?page=${novaPagina || paginacao.paginaAtual}`;

    if (filtros.carteira_id) {
      url += `&carteira_id=${filtros.carteira_id}`;
    }

    if (filtros.categoria_id) {
      url += `&categoria_id=${filtros.categoria_id}`;
    }

    if (filtros.busca) {
      url += `&busca=${filtros.busca}`;
    }

    if (filtros.dataInicio && filtros.dataFim) {
      url += `&dataInicio=${filtros.dataInicio}&dataFim=${filtros.dataFim}`;
    }

    if (filtros.periodo && filtros.periodo !== "personalizado") {
      url += `&periodo=${filtros.periodo}`;
    }

    if (!filtros.receitas && filtros.despesas) {
      url += `&tipo=despesa`;
    } else if (filtros.receitas && !filtros.despesas) {
      url += `&tipo=receita`;
    }

    if (filtros.status) {
      url += `&status=${filtros.status}`;
    }
    
    if (filtros.incluir_vendas) {
      url += `&incluir_vendas=true`;
    }

    if (filtros.status_conciliacao) {
      url += `&status_conciliacao=${filtros.status_conciliacao}`;
    }

    if (filtros.ordem) {
      url += `&ordem=${filtros.ordem}`;
    }

    if (filtros.tags && filtros.tags.length > 0) {
      url += `&tags=${filtros.tags.join(',')}`;
    }

    // Atualiza a URL e navega para a nova página
    router.push(url);
  };

  // Lidar com busca
  const handleBuscaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    atualizarURL({...filtros, busca});
  };

  // Lidar com filtro de tipo
  const handleTipoChange = (tipo: string) => {
    atualizarURL({...filtros, tipo});
  };

  // Alternar ordenação
  const alternarOrdenacao = () => {
    const novaOrdem = ordenacao === "asc" ? "desc" : "asc";
    setOrdenacao(novaOrdem);
    atualizarURL({...filtros, ordem: novaOrdem});
  };

  // Adicionar/remover tag do filtro
  const toggleTagFilter = (tag: string) => {
    const novasTags = tagsFiltro.includes(tag)
      ? tagsFiltro.filter(t => t !== tag)
      : [...tagsFiltro, tag];
    
    setTagsFiltro(novasTags);
    atualizarURL({...filtros, tags: novasTags});
  };
  
  // Limpar todos os filtros
  const limparFiltros = () => {
    setBusca("");
    setCarteiraFiltro("todas");
    setCategoriaFiltro("todas");
    setDateRange(undefined);
    setOrdenacao("asc");
    setTagsFiltro([]);
    atualizarURL({
      tipo: "todos",
      busca: "",
      dataInicio: undefined,
      dataFim: undefined,
      carteira_id: undefined,
      categoria_id: undefined,
      ordem: "asc",
      tags: [],
      periodo: "30dias",
      incluir_vendas: false,
      status_conciliacao: undefined
    });
  };

  // Aplicar filtros avançados
  const aplicarFiltrosAvancados = () => {
    atualizarURL({
      ...filtros,
      carteira_id: carteiraFiltro === "todas" ? undefined : carteiraFiltro,
      categoria_id: categoriaFiltro === "todas" ? undefined : categoriaFiltro,
      dataInicio: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      dataFim: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      tags: tagsFiltro.length > 0 ? tagsFiltro : undefined
    });
    setShowFilters(false);
  };
  
  // Função para aplicar um período predefinido
  const aplicarPeriodoPredefinido = (period: string) => {
    setPeriodoSelecionado(period as PredefinedPeriod);
    setIsLoading(true);
    
    const today = startOfDay(new Date());
    let dateRange: DateRange | undefined;

    switch (period) {
      case "15dias":
        dateRange = {
          from: subDays(today, 14),
          to: today
        };
        break;
      case "30dias":
        dateRange = {
          from: subDays(today, 29),
          to: today
        };
        break;
      case "45dias":
        dateRange = {
          from: subDays(today, 44),
          to: today
        };
        break;
      case "trimestre":
        dateRange = {
          from: subMonths(today, 3),
          to: today
        };
        break;
      case "semestre":
        dateRange = {
          from: subMonths(today, 6),
          to: today
        };
        break;
      case "ano":
        dateRange = {
          from: subMonths(today, 12),
          to: today
        };
        break;
      case "todos":
        // Para "todos", deixamos dateRange como undefined para não aplicar filtro de data
        dateRange = undefined;
        break;
      default:
        // Se "custom", mantém o range atual
        if (period === "custom") {
          return;
        }
        // Padrão é 30 dias
        dateRange = {
          from: subDays(today, 29),
          to: today
        };
    }
    
    // Atualizar o estado de date range
    setDateRange(dateRange);
    
    // Atualizar URL com os filtros apropriados
    if (period === "todos") {
      console.log('[TRANSACTIONS_CLIENT] Aplicando filtro "Todo o período" - removendo todos os filtros de data');
      atualizarURL({
        ...filtros,
        dataInicio: undefined,
        dataFim: undefined,
        periodo: period
      }, paginacao.paginaAtual);
    } else {
      atualizarURL({
        ...filtros,
        dataInicio: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        dataFim: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        periodo: period
      }, paginacao.paginaAtual);
    }
  };

  // Atualizar o aplicarFiltroPeriodo para marcar como customizado
  const aplicarFiltroPeriodo = (range: DateRange | undefined) => {
    setDateRange(range);
    setIsLoading(true);
    
    if (range) {
      // Marcar como período personalizado
      setPeriodoSelecionado("custom");
      
      atualizarURL({
        ...filtros,
        dataInicio: range.from ? format(range.from, "yyyy-MM-dd") : undefined,
        dataFim: range.to ? format(range.to, "yyyy-MM-dd") : undefined,
        periodo: "custom"
      }, paginacao.paginaAtual);
    } else {
      // Se o range for undefined, limpar os filtros de data
      atualizarURL({
        ...filtros,
        dataInicio: undefined,
        dataFim: undefined,
        periodo: "30dias"
      }, paginacao.paginaAtual);
    }
  };

  // Exportar transações em CSV
  const exportarCSV = () => {
    if (transactions.length === 0) return;
    
    // Cabeçalhos do CSV
    const headers = ["Nome", "Valor", "Data", "Tipo", "Categoria", "Carteira"];
    
    // Linhas de dados
    const rows = transactions.map(t => [
      t.name,
      t.amount.toString(),
      format(new Date(t.date), "dd/MM/yyyy"),
      t.type === "EXPENSE" ? "Despesa" : "Receita",
      t.category,
      t.wallet?.name || ""
    ]);
    
    // Montar o conteúdo do CSV
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Criar um blob e link para download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `transacoes_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Resetar loading state depois de uma navegação
  useEffect(() => {
    setIsLoading(false);
  }, [transactions]);

  // Verificar se há filtros ativos
  const temFiltrosAtivos = 
    filtros.tipo !== "todos" || 
    filtros.busca || 
    filtros.dataInicio || 
    filtros.dataFim || 
    filtros.carteira_id || 
    filtros.categoria_id ||
    filtros.ordem !== "asc";

  // Função para abrir o modal de detalhes da transação
  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsModalOpen(true);
  };
  
  // Função para editar uma transação
  const handleEditTransaction = (id: string) => {
    setDetailsModalOpen(false);
    toast({
      title: "Editar transação",
      description: "Funcionalidade de edição será implementada em breve.",
    });
  };
  
  // Função para excluir uma transação
  const handleDeleteTransaction = (id: string) => {
    setDetailsModalOpen(false);
    toast({
      variant: "destructive",
      title: "Excluir transação",
      description: "Funcionalidade de exclusão será implementada em breve.",
    });
  };

  // Renderizar a tabela de transações
  const renderTransactionTable = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[160px]" />
              </div>
              <Skeleton className="ml-auto h-8 w-24" />
            </div>
          ))}
        </div>
      );
    }

    if (!transactions.length) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <FileTextIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">Nenhuma transação encontrada</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Não encontramos transações com os filtros selecionados. Tente outros filtros ou adicione uma nova transação.
          </p>
          <AddTransactionButton className="mt-6" />
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Carteira</TableHead>
            <TableHead>
              <div className="flex items-center justify-end">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={alternarOrdenacao}
                  className="ml-2"
                >
                  Valor
                  {ordenacao === "asc" ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow 
              key={transaction.id} 
              onClick={() => handleTransactionClick(transaction)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell>
                <div className="flex flex-col">
                  <div className="font-medium flex items-center gap-1">
                    {transaction.isReconciled || (transaction.linkedSales && transaction.linkedSales.length > 0) ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <LinkIcon className="h-3 w-3 text-green-600 mr-1" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Transação conciliada com venda(s)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                    <span className="truncate max-w-xs" title={transaction.description || transaction.name}>
                      {transaction.description || transaction.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {transaction.tags && transaction.tags.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <TagIcon className="h-3 w-3 mr-1" />
                              {transaction.tags.length} {transaction.tags.length === 1 ? 'tag' : 'tags'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {transaction.tags.map(tag => (
                                <Badge 
                                  key={tag} 
                                  variant="outline" 
                                  className="cursor-pointer text-xs py-0"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Impedir que o clique propague
                                    toggleTagFilter(tag);
                                  }}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    {transaction.attachments && transaction.attachments.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center text-xs text-muted-foreground ml-2">
                              <PaperclipIcon className="h-3 w-3 mr-1" />
                              {transaction.attachments.length} {transaction.attachments.length === 1 ? 'anexo' : 'anexos'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="flex flex-col gap-1">
                              {transaction.attachments.map(attachment => (
                                <Link 
                                  key={attachment.id} 
                                  href={attachment.fileUrl}
                                  target="_blank"
                                  className="text-xs hover:underline"
                                  onClick={(e) => e.stopPropagation()} // Impedir que o clique propague
                                >
                                  {attachment.fileName}
                                </Link>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(transaction.date), "dd/MM/yyyy")}
              </TableCell>
              <TableCell>{transaction.category}</TableCell>
              <TableCell>
                {transaction.wallet?.name || "—"}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "font-medium",
                    transaction.type === "EXPENSE" ? "text-destructive" : "text-green-600"
                  )}
                >
                  {transaction.type === "EXPENSE" ? "-" : "+"}{formatarMoeda(Math.abs(transaction.amount))}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderFiltrosAvancados = () => {
    return (
      <div className={`bg-muted/40 border rounded-md p-4 space-y-4 transition-all ${showFilters ? "block" : "hidden"} mt-4`}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-base">Filtros avançados</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Carteira</label>
            <Select
              value={carteiraFiltro}
              onValueChange={(value) => {
                setCarteiraFiltro(value);
                atualizarURL(filtros);
              }}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as carteiras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as carteiras</SelectItem>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Categoria</label>
            <Select
              value={categoriaFiltro}
              onValueChange={(value) => {
                setCategoriaFiltro(value);
                atualizarURL(filtros);
              }}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Status de Conciliação</label>
            <Select
              value={filtros.status_conciliacao || "todas"}
              onValueChange={(value) => {
                atualizarURL({...filtros, status_conciliacao: value === "todas" ? undefined : value});
              }}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos os status</SelectItem>
                <SelectItem value="conciliadas">Somente conciliadas</SelectItem>
                <SelectItem value="nao_conciliadas">Somente não conciliadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tagsFiltro.map(tag => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="cursor-pointer flex items-center gap-1 py-1"
                onClick={() => toggleTagFilter(tag)}
              >
                {tag}
                <XIcon className="h-3 w-3" />
              </Badge>
            ))}
            
            <Input 
              placeholder="Adicionar tag e pressionar Enter"
              className="mt-2 w-full"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  toggleTagFilter(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </div>
        
        <div className="pt-2 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowFilters(false)} disabled={isLoading}>
            Cancelar
          </Button>
          
          <Button onClick={aplicarFiltrosAvancados} disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center">
                <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Aplicando...
              </span>
            ) : (
              <span>Aplicar filtros</span>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transações</h1>
          <p className="text-muted-foreground">
            Gerenciamento de transações financeiras
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportarCSV()}>
            <FileTextIcon className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Link href="/cash-flow" passHref>
            <Button variant="outline" className="flex items-center">
              <BarChart2 className="h-4 w-4 mr-2" />
              Fluxo de Caixa
            </Button>
          </Link>
          <AddTransactionButton />
        </div>
      </div>

      {/* Resumo Financeiro do Dia/Período */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="bg-white dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-600 dark:text-green-400">Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(totalReceitas)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {filtros.dataInicio === filtros.dataFim 
                ? `Hoje, ${filtros.dataInicio ? format(new Date(filtros.dataInicio), "dd/MM/yyyy") : ""}`
                : `Período selecionado`}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-red-600 dark:text-red-400">Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(totalDespesas)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {filtros.dataInicio === filtros.dataFim 
                ? `Hoje, ${filtros.dataInicio ? format(new Date(filtros.dataInicio), "dd/MM/yyyy") : ""}`
                : `Período selecionado`}
            </p>
          </CardContent>
        </Card>
        
        <Card className={cn(
          "bg-white dark:bg-gray-900",
          saldo >= 0 ? "border-green-200 dark:border-green-800" : "border-red-200 dark:border-red-800"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className={cn(
              "text-lg",
              saldo >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              saldo >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>{formatarMoeda(saldo)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {filtros.dataInicio === filtros.dataFim 
                ? `Hoje, ${filtros.dataInicio ? format(new Date(filtros.dataInicio), "dd/MM/yyyy") : ""}`
                : `Período selecionado`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="lg:col-span-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Filtros e Pesquisa</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros principais */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {/* Filtro de tipo */}
              <div className="flex border rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                <Button
                  variant={filtros.tipo === "todos" ? "default" : "ghost"}
                  className="rounded-none flex-1 px-3 font-medium h-10"
                  onClick={() => handleTipoChange("todos")}
                >
                  Todas
                </Button>
                <Button
                  variant={filtros.tipo === "receitas" ? "default" : "ghost"}
                  className="rounded-none flex-1 px-3 font-medium h-10"
                  onClick={() => handleTipoChange("receitas")}
                >
                  Receitas
                </Button>
                <Button
                  variant={filtros.tipo === "despesas" ? "default" : "ghost"}
                  className="rounded-none flex-1 px-3 font-medium h-10"
                  onClick={() => handleTipoChange("despesas")}
                >
                  Despesas
                </Button>
              </div>

              {/* Incluir vendas não conciliadas */}
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="incluirVendas" 
                  checked={filtros.incluir_vendas === true}
                  onCheckedChange={(checked) => {
                    const novosFiltros = { 
                      ...filtros, 
                      incluir_vendas: checked === true 
                    };
                    atualizarURL(novosFiltros);
                  }}
                />
                <Label 
                  htmlFor="incluirVendas" 
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Incluir vendas não conciliadas
                </Label>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4"
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      
                      // Obter datas do filtro atual ou usar últimos 30 dias
                      const periodoInicio = filtros.dataInicio || 
                        format(subDays(new Date(), 30), "yyyy-MM-dd");
                      const periodoFim = filtros.dataFim || 
                        format(new Date(), "yyyy-MM-dd");
                      
                      const response = await fetch("/api/transactions/conciliate/import", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          startDate: periodoInicio,
                          endDate: periodoFim,
                          autoReconcile: true
                        }),
                      });
                      
                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || "Erro ao importar vendas");
                      }
                      
                      const result = await response.json();
                      
                      toast({
                        title: "Importação concluída",
                        description: `${result.result.imported} vendas importadas. ${result.reconciliation?.matched || 0} vendas conciliadas automaticamente.`,
                      });
                      
                      // Recarregar a página para mostrar as novas vendas
                      router.refresh();
                    } catch (error) {
                      console.error("Erro ao importar vendas:", error);
                      toast({
                        variant: "destructive",
                        title: "Erro na importação",
                        description: error instanceof Error ? error.message : "Erro ao importar vendas",
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 mr-2" />
                  )}
                  Importar vendas
                </Button>
              </div>

              {/* Campo de busca */}
              <form onSubmit={handleBuscaSubmit} className="flex flex-1">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar transações..."
                    className="pl-8"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
                <Button type="submit" className="ml-2" disabled={isLoading}>
                  Buscar
                </Button>
              </form>

              {/* Filtro de carteira */}
              <div className="flex-shrink-0 w-full sm:w-auto sm:min-w-[200px]">
                <Select
                  value={carteiraFiltro}
                  onValueChange={(value) => {
                    setCarteiraFiltro(value);
                    atualizarURL(filtros);
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas as carteiras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as carteiras</SelectItem>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botões de filtros extras e exportação */}
              <div className="flex sm:flex-shrink-0 gap-2 w-full sm:w-auto justify-center sm:justify-start">
                <Button
                  variant="outline"
                  className="gap-1.5 w-full sm:w-auto"
                  onClick={() => setShowFilters(!showFilters)}
                  disabled={isLoading}
                >
                  <FilterIcon className="h-4 w-4" />
                  <span className="sm:inline">Mais filtros</span>
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5 w-full sm:w-auto"
                  onClick={exportarCSV}
                  disabled={transactions.length === 0 || isLoading}
                >
                  <FileTextIcon className="h-4 w-4" />
                  <span className="sm:inline">Exportar</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Indicadores de filtros ativos */}
          {temFiltrosAtivos && (
            <div className="flex flex-wrap gap-2 my-4">
              {filtros.busca && (
                <Badge variant="outline" className="flex items-center gap-1 bg-muted/50 hover:bg-muted transition-colors">
                  <span className="text-sm">Termo: {filtros.busca}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 rounded-full"
                    onClick={() => {
                      setBusca("");
                      atualizarURL({...filtros, busca: ""});
                    }}
                    disabled={isLoading}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filtros.tipo !== "todos" && (
                <Badge variant="outline" className="flex items-center gap-1 bg-muted/50 hover:bg-muted transition-colors">
                  <span className="text-sm">Tipo: {filtros.tipo === "receitas" ? "Receitas" : "Despesas"}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 rounded-full"
                    onClick={() => {
                      atualizarURL({...filtros, tipo: "todos"});
                    }}
                    disabled={isLoading}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filtros.carteira_id && (
                <Badge variant="outline" className="flex items-center gap-1 bg-muted/50 hover:bg-muted transition-colors">
                  <span className="text-sm">Carteira: {wallets.find(w => w.id === filtros.carteira_id)?.name || filtros.carteira_id}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 rounded-full"
                    onClick={() => {
                      setCarteiraFiltro("todas");
                      atualizarURL({...filtros, carteira_id: undefined});
                    }}
                    disabled={isLoading}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filtros.status_conciliacao && (
                <Badge variant="outline" className="flex items-center gap-1 bg-muted/50 hover:bg-muted transition-colors">
                  <span className="text-sm">
                    Conciliação: {filtros.status_conciliacao === "conciliadas" ? "Conciliadas" : "Não conciliadas"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 rounded-full"
                    onClick={() => atualizarURL({...filtros, status_conciliacao: undefined})}
                    disabled={isLoading}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {(filtros.dataInicio || filtros.dataFim) && (
                <Badge variant="outline" className="flex items-center gap-1 bg-muted/50 hover:bg-muted transition-colors">
                  <span className="text-sm">Período: {formatarPeriodo(filtros.dataInicio, filtros.dataFim)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 rounded-full"
                    onClick={() => {
                      setDateRange(undefined);
                      atualizarURL({...filtros, dataInicio: undefined, dataFim: undefined});
                    }}
                    disabled={isLoading}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filtros.tags && filtros.tags.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1 bg-muted/50 hover:bg-muted transition-colors">
                  <span className="text-sm">Tags: {filtros.tags.length} selecionada(s)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 rounded-full"
                    onClick={() => {
                      setTagsFiltro([]);
                      atualizarURL({...filtros, tags: undefined});
                    }}
                    disabled={isLoading}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {temFiltrosAtivos && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6"
                  onClick={limparFiltros}
                  disabled={isLoading}
                >
                  Limpar todos
                </Button>
              )}
            </div>
          )}

          {/* Filtro de Período */}
          <div className="mt-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="w-full">
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <div className="w-full sm:w-auto">
                    <PeriodFilter 
                      onChange={(range) => {
                        // Ignoramos esse callback, pois estamos usando o evento onValueChange
                      }}
                      value={periodoSelecionado}
                      onValueChange={aplicarPeriodoPredefinido}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground hidden sm:inline">ou</span>
                  <div className="w-full sm:w-[300px]">
                    <DatePickerWithRange
                      className="w-full"
                      dateRange={dateRange}
                      onChange={aplicarFiltroPeriodo}
                      placeholder="Período personalizado"
                    />
                  </div>
                </div>
              </div>
              {/* Botão para limpar período */}
              {dateRange && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setDateRange(undefined);
                    setPeriodoSelecionado("30dias");
                    atualizarURL({
                      ...filtros,
                      dataInicio: undefined,
                      dataFim: undefined,
                      periodo: "30dias"
                    });
                  }}
                  disabled={isLoading}
                  className="sm:h-9 self-end"
                >
                  <XIcon className="w-4 h-4 mr-2" />
                  Limpar período
                </Button>
              )}
            </div>
          </div>

          {/* Advanced filters section */}
          {renderFiltrosAvancados()}
        </CardContent>
      </Card>

      {/* Lista de Transações */}
      <Card className="lg:col-span-full">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Transações</CardTitle>
          <Button variant="ghost" onClick={alternarOrdenacao} disabled={isLoading}>
            {ordenacao === "asc" 
              ? <span className="flex items-center"><ArrowUpIcon className="h-4 w-4 mr-1.5" />Mais antigas primeiro</span> 
              : <span className="flex items-center"><ArrowDownIcon className="h-4 w-4 mr-1.5" />Mais recentes primeiro</span>
            }
          </Button>
        </CardHeader>
        <CardContent>
          {renderTransactionTable()}

          {/* Paginação */}
          {paginacao.totalPaginas > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => atualizarURL({...filtros}, paginacao.paginaAtual - 1)}
                  disabled={paginacao.paginaAtual <= 1 || isLoading}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Página {paginacao.paginaAtual} de {paginacao.totalPaginas}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => atualizarURL({...filtros}, paginacao.paginaAtual + 1)}
                  disabled={
                    paginacao.paginaAtual >= paginacao.totalPaginas || isLoading
                  }
                  className="h-8 w-8 p-0"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Total de Transações */}
          <div className="text-center text-sm text-muted-foreground mt-4">
            Total de {paginacao.totalItems} transações encontradas.
          </div>
        </CardContent>
      </Card>

      {/* Nova seção de previsões de fluxo de caixa */}
      {predictions.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Previsões de Fluxo de Caixa</CardTitle>
                <CardDescription>
                  Previsões para os próximos 30 dias baseadas em parcelas e recorrências
                </CardDescription>
              </div>
              <Link href="/cash-flow" passHref>
                <Button variant="outline">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Ver Fluxo de Caixa Completo
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.slice(0, 5).map((prediction) => (
                    <TableRow key={prediction.id}>
                      <TableCell>
                        {format(new Date(prediction.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{prediction.description}</TableCell>
                      <TableCell>
                        <Badge variant={prediction.type === "INCOME" ? "secondary" : "destructive"}>
                          {prediction.type === "INCOME" ? "Receita" : "Despesa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {prediction.source === "MANUAL" && "Manual"}
                          {prediction.source === "INSTALLMENT" && "Parcela"}
                          {prediction.source === "RECURRING" && "Recorrente"}
                          {prediction.source === "SALES_INSTALLMENT" && "Venda Parcelada"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right ${
                        prediction.type === "INCOME" ? "text-green-600" : "text-red-600"
                      }`}>
                        {formatarMoeda(prediction.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {predictions.length > 5 && (
                <div className="flex justify-center p-2 border-t">
                  <Link href="/cash-flow" passHref>
                    <Button variant="ghost" size="sm">
                      Ver mais {predictions.length - 5} previsões
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalhes da Transação */}
      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={{
            ...selectedTransaction,
            onEdit: async (id, updatedData) => {
              try {
                toast({
                  title: "Transação atualizada",
                  description: "As alterações foram salvas com sucesso.",
                });
                // Aqui futuramente será implementada a chamada à API para atualizar a transação
                setDetailsModalOpen(false);
                // Poderíamos recarregar os dados aqui após a atualização
              } catch (error) {
                toast({
                  variant: "destructive",
                  title: "Erro ao atualizar",
                  description: "Não foi possível salvar as alterações na transação.",
                });
              }
            },
            onDelete: (id) => handleDeleteTransaction(id),
          }}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          categories={categorias}
          wallets={wallets}
        />
      )}
    </div>
  );
} 