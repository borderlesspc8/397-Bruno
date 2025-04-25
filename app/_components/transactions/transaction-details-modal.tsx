"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription, DialogFooter } from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/app/_components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { 
  Calendar, 
  CreditCard, 
  Wallet, 
  Tags, 
  FileText, 
  PenLine, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft,
  Link as LinkIcon,
  Paperclip,
  X,
  CheckCircle,
  Clock,
  RefreshCw,
  Save,
  XCircle,
  AlertTriangle,
  ArrowRight,
  CalendarIcon,
  TagIcon,
  UnlinkIcon,
  Loader2,
  Brain,
  FileSpreadsheet,
  Plus
} from "lucide-react";
import { TransactionType } from "@prisma/client";
import { TransactionAttachments, Attachment } from "@/app/_components/transactions";
import { cn } from "@/app/_lib/utils";
import Link from "next/link";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { Separator } from "@/app/_components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/_components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { useToast } from "@/app/_components/ui/use-toast";
import VendaDetailModal from "@/app/_components/gestao-click/VendaDetailModal";

// Definir TransactionStatus, já que não está disponível em @prisma/client
type TransactionStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "FAILED";

// Interface para a transação exibida no modal
export interface TransactionDetailsProps {
  id: string;
  name: string;
  description: string;
  amount: number;
  date: Date;
  type: TransactionType;
  category: string;
  paymentMethod?: string;
  isReconciled?: boolean;
  metadata?: any;
  tags?: string[];
  attachments?: Attachment[];
  wallet?: {
    id: string;
    name: string;
    type?: string;
    color?: string | null;
  } | null;
  walletId?: string;
  onEdit?: (id: string, updatedData: Partial<TransactionDetailsProps>) => Promise<void>;
  onDelete?: (id: string) => void;
  status?: string;
  linkedSales?: any[]; // Vendas do Gestão Click vinculadas
  isFromTransaction?: boolean; // Se é uma transação real ou uma venda virtual
  saleData?: any; // Dados da venda (se for uma venda virtual)
}

export interface TransactionDetailsModalProps {
  transaction: TransactionDetailsProps;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: string[];
  wallets?: { id: string; name: string }[];
}

// Mapeamento de métodos de pagamento para exibição em português
const PAYMENT_METHODS = [
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "DEBIT_CARD", label: "Cartão de Débito" },
  { value: "CASH", label: "Dinheiro" },
  { value: "BANK_TRANSFER", label: "Transferência Bancária" },
  { value: "PIX", label: "PIX" },
  { value: "BOLETO", label: "Boleto" },
  { value: "DIGITAL_WALLET", label: "Carteira Digital" },
  { value: "CRYPTO", label: "Criptomoeda" },
  { value: "CHECK", label: "Cheque" },
  { value: "OTHER", label: "Outro" }
];

// Mapeamento de tipos de transação para exibição em português
const TRANSACTION_TYPES = [
  { value: "INCOME", label: "Receita", icon: ArrowDownLeft, color: "text-green-600", bgColor: "bg-green-100" },
  { value: "EXPENSE", label: "Despesa", icon: ArrowUpRight, color: "text-red-600", bgColor: "bg-red-100" }
];

const statusVariantMap: Record<string, "default" | "destructive" | "outline" | "secondary" | "premium"> = {
  PENDING: "outline",
  CLEARED: "default",
  RECONCILED: "secondary",
  REJECTED: "destructive",
  CANCELED: "destructive",
  FAILED: "destructive",
  WARNING: "secondary",
  SUCCESS: "default",
  COMPLETED: "default",
};

export function TransactionDetailsModal({ 
  transaction, 
  open, 
  onOpenChange,
  categories = [],
  wallets = []
}: TransactionDetailsModalProps) {
  // Estado para controle da aba ativa
  const [activeTab, setActiveTab] = useState<string>("details");
  
  // Estado para controle do modo de edição
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado para os dados em edição
  const [editedData, setEditedData] = useState<Partial<TransactionDetailsProps>>({});
  
  // Estado para indicar operação em andamento (salvamento)
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado para controle de erros
  const [error, setError] = useState<string | null>(null);

  const [availableSales, setAvailableSales] = useState<any[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConciliating, setIsConciliating] = useState(false);
  const { toast } = useToast();
  const [showSaleDetailModal, setShowSaleDetailModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  // Resetar formulário quando o modal abrir/fechar ou transação mudar
  useEffect(() => {
    setEditedData({});
    setIsEditing(false);
    setError(null);
  }, [open, transaction]);

  // Buscar vendas disponíveis para conciliação
  useEffect(() => {
    if (open && transaction.isFromTransaction && transaction.id && transaction.type === "INCOME") {
      // Apenas buscar vendas para reconciliação se for uma transação de receita
      const fetchAvailableSales = async () => {
        setIsLoading(true);
        try {
          // Construir filtros com base na data da transação
          const transactionDate = new Date(transaction.date);
          const startDate = new Date(transactionDate);
          const endDate = new Date(transactionDate);
          
          // Buscar vendas 5 dias antes e depois da data da transação
          startDate.setDate(startDate.getDate() - 5);
          endDate.setDate(endDate.getDate() + 5);
          
          // Formatar datas para a API
          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];
          
          // Buscar vendas não conciliadas no período
          const response = await fetch(`/api/gestao-click/sales?data_inicio=${startDateStr}&data_fim=${endDateStr}`);
          
          if (!response.ok) {
            throw new Error("Erro ao buscar vendas para conciliação");
          }
          
          const salesData = await response.json();
          
          // Filtrar vendas com valor similar (tolerância de 5%)
          const similarAmountSales = salesData.data.filter((sale: any) => {
            const saleAmount = parseFloat(sale.valor_total);
            return (
              saleAmount >= transaction.amount * 0.95 && 
              saleAmount <= transaction.amount * 1.05
            );
          });
          
          setAvailableSales(similarAmountSales);
        } catch (error) {
          console.error("Erro ao buscar vendas:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchAvailableSales();
    }
  }, [open, transaction]);

  // Formatação de valores monetários
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  // Formatação de data
  const formatarData = (data: Date) => {
    if (isToday(new Date(data))) {
      return "Hoje, " + format(new Date(data), "d 'de' MMMM", { locale: ptBR });
    } else if (isYesterday(new Date(data))) {
      return "Ontem, " + format(new Date(data), "d 'de' MMMM", { locale: ptBR });
    }
    return format(new Date(data), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // Encontrar tipo da transação
  const transactionTypeInfo = TRANSACTION_TYPES.find(t => t.value === transaction.type) || TRANSACTION_TYPES[0];
  
  // Definir formatCurrency e formatDateLong como aliases para as funções existentes
  const formatCurrency = formatarMoeda;
  const formatDateLong = formatarData;
  
  // Manipuladores de eventos para alterações nos campos
  const handleInputChange = (field: string, value: any) => {
    setEditedData({
      ...editedData,
      [field]: value
    });
    
    // Limpar mensagens de erro quando o usuário faz alterações
    if (error) setError(null);
  };
  
  // Converter string para número
  const parseAmount = (value: string): number => {
    // Remove tudo exceto dígitos, vírgula e ponto
    const cleanValue = value.replace(/[^\d,.]/g, '').replace('.', '').replace(',', '.');
    return parseFloat(cleanValue);
  };
  
  // Iniciar modo de edição
  const startEditing = () => {
    setIsEditing(true);
    
    // Extrair payment method do metadata
    let paymentMethod = "OTHER";
    if (transaction.metadata && typeof transaction.metadata === 'object' && 'paymentMethod' in transaction.metadata) {
      paymentMethod = transaction.metadata.paymentMethod as string;
    }
    
    // Inicializar os dados editáveis com os valores atuais
    setEditedData({
      description: transaction.description || transaction.name,
      amount: transaction.amount,
      date: transaction.date,
      category: transaction.category,
      paymentMethod,
      walletId: transaction.wallet?.id,
      type: transaction.type
    });
  };
  
  // Cancelar edição
  const cancelEditing = () => {
    setIsEditing(false);
    setEditedData({});
    setError(null);
  };
  
  // Validar campos antes de salvar
  const validateForm = (): boolean => {
    if (!editedData.description?.trim()) {
      setError("A descrição da transação é obrigatória");
      return false;
    }
    
    if (editedData.amount === undefined || isNaN(editedData.amount) || editedData.amount === 0) {
      setError("O valor da transação deve ser um número válido e diferente de zero");
      return false;
    }
    
    if (!editedData.date) {
      setError("A data da transação é obrigatória");
      return false;
    }
    
    if (editedData.type !== "INCOME" && editedData.type !== "EXPENSE") {
      setError("O tipo da transação deve ser Receita ou Despesa");
      return false;
    }
    
    return true;
  };
  
  // Salvar alterações
  const saveChanges = async () => {
    if (!transaction.onEdit) return;
    
    // Validar campos antes de salvar
    if (!validateForm()) return;
    
    try {
      setIsSaving(true);
      setError(null);
      await transaction.onEdit(transaction.id, editedData);
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      setError("Ocorreu um erro ao salvar as alterações. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Obter valor atual (original ou editado)
  const getCurrentValue = (field: keyof TransactionDetailsProps) => {
    if (field in editedData) {
      return editedData[field];
    }
    return transaction[field];
  };

  // Conciliar transação com venda
  const handleConciliateTransaction = async () => {
    if (!selectedSaleId || !transaction.id) return;
    
    setIsConciliating(true);
    try {
      const response = await fetch("/api/sales/reconciliation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: transaction.id,
          saleId: selectedSaleId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erro ao conciliar transação com venda");
      }
      
      toast({
        title: "Transação conciliada com sucesso",
        description: "A transação foi vinculada à venda do Gestão Click",
        variant: "success",
      });
      
      // Recarregar a página para exibir a conciliação
      window.location.reload();
    } catch (error) {
      console.error("Erro ao conciliar:", error);
      toast({
        title: "Erro ao conciliar",
        description: "Ocorreu um erro ao conciliar a transação com a venda",
        variant: "destructive",
      });
    } finally {
      setIsConciliating(false);
    }
  };

  // Remover conciliação entre transação e venda
  const handleRemoveConciliation = async (saleId: string) => {
    if (!transaction.id) return;
    
    setIsConciliating(true);
    try {
      const response = await fetch(`/api/sales/reconciliation`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: transaction.id,
          saleId: saleId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erro ao remover conciliação");
      }
      
      toast({
        title: "Conciliação removida com sucesso",
        description: "A transação foi desvinculada da venda do Gestão Click",
        variant: "success",
      });
      
      // Recarregar a página para atualizar
      window.location.reload();
    } catch (error) {
      console.error("Erro ao remover conciliação:", error);
      toast({
        title: "Erro ao remover conciliação",
        description: "Ocorreu um erro ao desvincular a transação da venda",
        variant: "destructive",
      });
    } finally {
      setIsConciliating(false);
    }
  };

  // Formatar dados de transação virtual (venda não vinculada)
  const handleCreateTransactionFromSale = async () => {
    if (!transaction.saleData) return;
    
    // Redirecionar para a página de criação de transação com dados pré-preenchidos
    const encodedData = encodeURIComponent(JSON.stringify({
      amount: transaction.amount,
      date: transaction.date,
      description: transaction.name,
      type: "INCOME",
      saleData: transaction.saleData
    }));
    
    window.location.href = `/transactions/new?prefill=${encodedData}`;
  };

  // Função para abrir o modal de detalhes da venda
  const handleOpenSaleDetail = (sale: any) => {
    setSelectedSale(sale);
    setShowSaleDetailModal(true);
  };

  /**
   * Processa a conciliação usando Machine Learning
   */
  const handleMlReconciliation = async () => {
    try {
      setIsConciliating(true);
      setError(null);
      
      // Obter data da transação
      const transactionDate = new Date(transaction.date);
      
      // Configurar período para reconciliação (7 dias antes e depois)
      const startDate = new Date(transactionDate);
      startDate.setDate(startDate.getDate() - 7);
      
      const endDate = new Date(transactionDate);
      endDate.setDate(endDate.getDate() + 7);
      
      // Chamar API de reconciliação ML focada em uma transação específica
      const response = await fetch("/api/reconciliation/ml/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          transactionId: transaction.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          walletId: transaction.walletId,
          checkForInstallments: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha na conciliação automática");
      }
      
      const data = await response.json();
      
      if (data.success) {
        const result = data.data;
        
        if (result.matched > 0) {
          // Fechamos o modal para a página poder atualizar corretamente
          onOpenChange(false);
          
          // Mensagem específica para grupos de parcelas
          if (result.isInstallmentGroup) {
            toast({
              title: "Conciliação de parcelas concluída",
              description: `Foram vinculadas ${result.matched} transações em ${result.groupsMatched} grupo(s) de parcelas.`,
              variant: "default"
            });
          } else {
            toast({
              title: "Conciliação automática concluída",
              description: `A transação foi vinculada com ${Math.round(result.confidence * 100)}% de confiança.`,
              variant: "default"
            });
          }
          
          // Recarregar a página para mostrar as novas conciliações
          window.location.reload();
        } else if (result.alreadyLinked) {
          toast({
            title: "Transação já vinculada",
            description: "Esta transação já está vinculada a uma venda.",
            variant: "default"
          });
        } else {
          toast({
            title: "Nenhuma correspondência encontrada",
            description: result.message || "O sistema de ML não encontrou correspondências confiáveis para esta transação.",
            variant: "default"
          });
        }
      } else {
        throw new Error(data.error || "Falha na conciliação automática");
      }
    } catch (error: any) {
      console.error("Erro na conciliação ML:", error);
      setError(error.message || "Erro ao realizar conciliação automática");
      
      toast({
        title: "Erro na conciliação automática",
        description: error.message || "Não foi possível realizar a conciliação automática",
        variant: "destructive"
      });
    } finally {
      setIsConciliating(false);
    }
  };

  // Renderizar conteúdo com base no tipo (transação real ou venda virtual)
  if (!transaction.isFromTransaction && transaction.saleData) {
    // Renderizar detalhes de venda não vinculada (virtual)
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div>Venda do Gestão Click (Não Vinculada)</div>
              {transaction.saleData.status && (
                <Badge 
                  variant={
                    transaction.saleData.status.toLowerCase().includes("concluí") || 
                    transaction.saleData.status.toLowerCase().includes("pag") 
                      ? "default" 
                      : transaction.saleData.status.toLowerCase().includes("cancel") 
                        ? "destructive" 
                        : "outline"
                  }
                >
                  {transaction.saleData.status}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Esta venda do Gestão Click não está vinculada a nenhuma transação
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente</Label>
                <p className="text-sm">{transaction.saleData.customerName || "Cliente não informado"}</p>
              </div>
              <div>
                <Label>Código</Label>
                <p className="text-sm">{transaction.saleData.code || transaction.saleData.id}</p>
              </div>
              <div>
                <Label>Data</Label>
                <p className="text-sm">{formatDateLong(new Date(transaction.saleData.date))}</p>
              </div>
              <div>
                <Label>Valor</Label>
                <p className="text-sm font-semibold">{formatCurrency(transaction.saleData.totalAmount)}</p>
              </div>
              <div>
                <Label>Origem</Label>
                <p className="text-sm">{transaction.saleData.source || "Gestão Click"}</p>
              </div>
              <div>
                <Label>Loja</Label>
                <p className="text-sm">{transaction.saleData.storeName || "Loja não informada"}</p>
              </div>
            </div>
            
            {transaction.saleData.installments && transaction.saleData.installments.length > 0 && (
              <div>
                <Label>Parcelas</Label>
                <div className="mt-2 border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left">Nº</th>
                        <th className="px-3 py-2 text-left">Vencimento</th>
                        <th className="px-3 py-2 text-left">Valor</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transaction.saleData.installments.map((installment: any) => (
                        <tr key={installment.id} className="border-t">
                          <td className="px-3 py-2">{installment.number}</td>
                          <td className="px-3 py-2">{formatDateLong(new Date(installment.dueDate))}</td>
                          <td className="px-3 py-2">{formatCurrency(installment.amount)}</td>
                          <td className="px-3 py-2">
                            <Badge 
                              variant={
                                installment.status.toLowerCase().includes("pag")
                                  ? "default" 
                                  : installment.status.toLowerCase().includes("cancel")
                                    ? "destructive" 
                                    : "outline"
                              }
                            >
                              {installment.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Esta venda não está vinculada a nenhuma transação</AlertTitle>
              <AlertDescription>
                Você pode criar uma nova transação a partir desta venda ou vinculá-la a uma transação existente.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button 
              variant="default" 
              className="flex items-center gap-2"
              onClick={handleCreateTransactionFromSale}
            >
              <PlusIcon className="h-4 w-4" />
              Criar Transação
            </Button>
            <Link href={`/gestao-click/vendas?codigo=${transaction.saleData.code || transaction.saleData.id}`}>
              <Button variant="secondary">
                <ArrowRight className="mr-2 h-4 w-4" />
                Ver no Gestão Click
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
        
        {showSaleDetailModal && selectedSale && (
          <VendaDetailModal 
            vendaId={selectedSale}
            isOpen={showSaleDetailModal}
            onClose={() => setShowSaleDetailModal(false)}
          />
        )}
      </Dialog>
    );
  }

  // Renderizar detalhes da transação normal
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Transação</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="attachments">
              Anexos {transaction.attachments?.length ? `(${transaction.attachments.length})` : ""}
              </TabsTrigger>
            <TabsTrigger value="sales">
              Vendas {transaction.linkedSales?.length ? `(${transaction.linkedSales.length})` : ""}
              </TabsTrigger>
            </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">{transaction.name || transaction.description}</h2>
              <Badge variant={transaction.type === "INCOME" ? "default" : "destructive"}>
                {transaction.type === "INCOME" ? "Receita" : "Despesa"}
              </Badge>
          </div>

            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className={`font-semibold ${transaction.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(transaction.amount)}
                  </span>
                        </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Data:</span>
                  <span className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {formatDateLong(transaction.date)}
                  </span>
                    </div>
                    
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Carteira:</span>
                  <span className="flex items-center">
                    <Wallet className="h-4 w-4 mr-1" />
                    {transaction.wallet?.name || "Não especificada"}
                  </span>
                  </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Categoria:</span>
                  <span>{transaction.category || "Não categorizada"}</span>
                    </div>
                    
                {transaction.paymentMethod && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Forma de pagamento:</span>
                    <span>{transaction.paymentMethod}</span>
                        </div>
                      )}

                {transaction.status && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={statusVariantMap[transaction.status.toUpperCase() as string] || "outline"}>
                      {transaction.status}
                    </Badge>
                    </div>
                  )}
              </CardContent>
            </Card>

                {transaction.tags && transaction.tags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1">
                  {transaction.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="flex items-center">
                      <TagIcon className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

            <div className="flex justify-end space-x-2">
              <Link href={`/transactions/edit/${transaction.id}`}>
                <Button variant="outline" className="flex items-center">
                  <PenLine className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
              </div>
            </TabsContent>

          <TabsContent value="attachments">
              {transaction.attachments && transaction.attachments.length > 0 ? (
              <TransactionAttachments attachments={transaction.attachments} />
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Paperclip className="mx-auto h-8 w-8 mb-2" />
                <p>Nenhum anexo para esta transação</p>
                </div>
              )}
            </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            {transaction.type === "INCOME" || transaction.type === "DEPOSIT" || transaction.type === "INVESTMENT" ? (
              <div className="space-y-4">
                {transaction.linkedSales && transaction.linkedSales.length > 0 ? (
                  <div className="space-y-4">
                    {transaction.linkedSales.map((sale) => (
                      <Card key={sale.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">Venda #{sale.code || sale.id}</h4>
                            <Badge variant="outline">{sale.status}</Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div>
                              <span className="text-muted-foreground mr-1">Cliente:</span>
                              <span className="font-medium">{sale.customerName || "Cliente não informado"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground mr-1">Data:</span>
                              <span className="font-medium">{formatDateLong(new Date(sale.date))}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground mr-1">Valor:</span>
                              <span className="font-medium">{formatCurrency(sale.totalAmount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground mr-1">Loja:</span>
                              <span className="font-medium">{sale.storeName || "Não especificada"}</span>
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center gap-1 text-destructive"
                              onClick={() => handleRemoveConciliation(sale.id)}
                              disabled={isConciliating}
                            >
                              {isConciliating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <UnlinkIcon className="h-3 w-3" />
                              )}
                              Desvincular
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => handleOpenSaleDetail(sale)}
                            >
                              <ArrowRight className="mr-1 h-3 w-3" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Transação não conciliada</AlertTitle>
                      <AlertDescription>
                        Esta transação ainda não está vinculada a nenhuma venda do Gestão Click.
                      </AlertDescription>
                    </Alert>

                    <Card>
                      <CardHeader>
                        <CardTitle>Conciliação Manual</CardTitle>
                        <CardDescription>
                          Vincule esta transação a uma venda do Gestão Click
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <Label>Código da Venda</Label>
                              <Input 
                                placeholder="Digite o código da venda"
                                value={selectedSaleId}
                                onChange={(e) => setSelectedSaleId(e.target.value)}
                              />
                            </div>
                            <Button
                              className="mt-6"
                              onClick={handleConciliateTransaction}
                              disabled={!selectedSaleId || isConciliating}
                            >
                              {isConciliating ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <LinkIcon className="h-4 w-4 mr-2" />
                              )}
                              Vincular
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Conciliação Inteligente</CardTitle>
                        <CardDescription>
                          Use inteligência artificial para encontrar a venda correspondente
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={handleMlReconciliation}
                          disabled={isConciliating}
                        >
                          {isConciliating ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Brain className="h-4 w-4 mr-2" />
                          )}
                          Conciliar Automaticamente
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Tipo de transação não suportado</AlertTitle>
                  <AlertDescription>
                    Apenas transações de receita podem ser vinculadas a vendas do Gestão Click.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
      
      {showSaleDetailModal && selectedSale && (
        <VendaDetailModal 
          vendaId={selectedSale}
          isOpen={showSaleDetailModal}
          onClose={() => setShowSaleDetailModal(false)}
        />
      )}
    </Dialog>
  );
}

// Componente de ícone Plus
function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
} 