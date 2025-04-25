"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/app/_components/ui/card';
import { Avatar } from '@/app/_components/ui/avatar';
import { Button } from '@/app/_components/ui/button';
import { 
  MoreHorizontal, 
  ArrowDownRight, 
  ArrowUpRight, 
  RefreshCw, 
  Calendar, 
  Tag, 
  Wallet,
  PencilLine,
  Trash2,
  Copy,
  CircleAlert,
  MoreVertical,
  ReceiptIcon,
  LinkIcon,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  PenLine,
  Check
} from 'lucide-react';
import { cn } from '@/app/_lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/app/_components/ui/dropdown-menu';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/app/_components/ui/tooltip';
import { Badge } from '@/app/_components/ui/badge';
import { useRouter } from 'next/navigation';
import { TransactionDetailsModal } from "./transaction-details-modal";
import { Checkbox } from "@/app/_components/ui/checkbox";
import { useToast } from "@/app/_components/ui/use-toast";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/app/_components/ui/alert-dialog";
import Link from "next/link";
import { TransactionType, TransactionStatus } from "@prisma/client";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { format } from 'date-fns';

export interface TransactionCardProps {
  id: string;
  description?: string;
  amount: number;
  date: Date;
  category?: string;
  paymentMethod?: string;
  type: TransactionType;
  wallet?: {
    id: string;
    name: string;
  };
  status?: TransactionStatus;
  isReconciled?: boolean;
  metadata?: any;
  attachments?: any[];
  tags?: string[];
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
  fromGestaoClick?: boolean;
  linkedSales?: any[];
  isFromTransaction?: boolean;
  saleData?: any;
}

/**
 * Componente TransactionCard - Exibe uma transação com detalhes relevantes
 */
export const TransactionCard: React.FC<TransactionCardProps> = ({
  id,
  description,
  amount,
  date,
  category,
  type,
  wallet,
  status,
  isReconciled,
  metadata,
  attachments,
  tags,
  isSelected,
  onSelect,
  onDelete,
  className,
  fromGestaoClick = false,
  linkedSales = [],
  isFromTransaction = true,
  saleData,
  ...props
}) => {
  const router = useRouter();
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verificar se é uma transação de receita vinculada a uma venda
  const hasLinkedSale = linkedSales && linkedSales.length > 0;
  
  // Verificar se é uma venda não conciliada
  const isUnlinkedSale = !isFromTransaction && saleData;

  // Determinar a cor baseada no tipo e status da transação
  const getTypeColor = () => {
    if (isUnlinkedSale) {
      // Vendas não conciliadas do Gestão Click
      return "text-blue-600";
    }
    
    if (type === "INCOME") {
      return "text-green-600";
    }
    
    return "text-red-600";
  };

  // Simplifica o nome da categoria para exibição
  const categoryName = category ? category.split(">").pop()?.trim() : "";

  // Formatar o valor da transação para exibição
  const formatAmount = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(value));
  };

  // Formatar a data para exibição
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  // Gerar iniciais da categoria ou transação para o avatar
  const getInitials = (): string => {
    if (category) {
      const words = category.split(' ');
      if (words.length >= 2) {
        return `${words[0][0]}${words[1][0]}`.toUpperCase();
      }
      return category.substring(0, 2).toUpperCase();
    }
    
    const words = description?.split(' ') || [];
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return description?.substring(0, 2).toUpperCase() || '';
  };

  // Determinar a cor do avatar baseado na categoria ou tipo de transação
  const getAvatarColor = (): string => {
    if (category) {
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
    
    if (type === 'income') {
      return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    } else if (type === 'expense') {
      return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    } else if (type === 'transfer') {
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    }
    
    return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  };

  // Gerar o badge de status da transação
  const getStatusBadge = () => {
    if (!status || status === 'completed') {
      return null;
    }
    
    const statusConfig: Record<string, { className: string, label: string }> = {
      pending: {
        className: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
        label: 'Pendente'
      },
      cancelled: {
        className: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
        label: 'Cancelada'
      },
      failed: {
        className: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        label: 'Falhou'
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Badge variant="outline" className={cn('text-xs font-normal', config.className)}>
        {status === 'failed' && <CircleAlert className="h-3 w-3 mr-1" />}
        {config.label}
      </Badge>
    );
  };

  // Gerenciar o clique no cartão
  const handleCardClick = () => {
    router.push(`/transactions/${id}`);
  };

  // Determinar se o card deve ser clicável
  const isClickable = !!onSelect || !!onDelete;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete?.(id);
      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso",
      });
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir transação",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
    <Card
      className={cn(
          'relative hover:shadow-md transition-shadow duration-200',
          isUnlinkedSale ? 'border-blue-200 bg-blue-50/30 dark:bg-blue-950/10' : '',
        className
      )}
        ref={cardRef}
        {...props}
    >
        <CardContent className="p-4 flex items-center">
          {/* Checkbox de seleção (quando aplicável) */}
          {onSelect && (
            <div className="mr-3 flex-shrink-0">
              <Checkbox 
                checked={isSelected}
                onCheckedChange={() => onSelect(id)}
                aria-label="Selecionar transação"
                className="mt-0.5"
              />
            </div>
          )}
          
          {/* Ícone de tipo de transação */}
          <div className="mr-4 flex items-center justify-center flex-shrink-0">
            <div 
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                isUnlinkedSale 
                  ? "bg-blue-100 dark:bg-blue-950/40" 
                  : type === "INCOME" 
                    ? "bg-green-100 dark:bg-green-950/40" 
                    : "bg-red-100 dark:bg-red-950/40"
              )}
            >
              {isUnlinkedSale ? (
                <ReceiptIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : type === "INCOME" ? (
                <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
                <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-400" />
          )}
            </div>
          </div>
        
          {/* Informações da transação */}
          <div className="flex-grow min-w-0" onClick={() => setDetailsModalOpen(true)}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
              <div className="mb-1 sm:mb-0 flex items-center">
                <h3 className="text-sm font-medium truncate mr-2">
                  {isUnlinkedSale ? (
                    <>
                      <span className="text-blue-600">
                        Venda #{saleData?.code || saleData?.id} 
                      </span>
                      {saleData?.customerName && (
                        <span className="text-muted-foreground"> - {saleData.customerName}</span>
                      )}
                    </>
                  ) : (
                    description || "Sem descrição"
                  )}
                </h3>
              
                {/* Indicadores de status */}
                <div className="flex items-center gap-1">
                  {/* Ícone de venda do Gestão Click */}
                  {(hasLinkedSale || fromGestaoClick) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="inline-flex text-blue-600">
                            <LinkIcon className="h-3.5 w-3.5" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Vinculado a venda do Gestão Click</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {/* Ícone de reconciliação */}
                  {isReconciled !== undefined && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="inline-flex">
                            {isReconciled ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-amber-500" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isReconciled ? "Reconciliado" : "Pendente de reconciliação"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {/* Quantidade de anexos */}
                  {attachments && attachments.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="inline-flex items-center">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground ml-0.5">{attachments.length}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{attachments.length} {attachments.length === 1 ? "anexo" : "anexos"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                <span className={cn("font-semibold whitespace-nowrap", getTypeColor())}>
                  {formatAmount(amount)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1">
              <div className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                <span className="truncate">
                  {formatDate(date.toISOString())}
                </span>
                
                {wallet && (
                  <span className="truncate">
                    {wallet.name}
                    </span>
                )}
                
                {isUnlinkedSale && saleData?.storeName && (
                  <span className="truncate">
                    {saleData.storeName}
                    </span>
                )}
                
                {categoryName && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {categoryName}
                  </Badge>
                )}
                
                {status && (
                  <Badge 
                    variant={
                      status === "COMPLETED" ? "success" :
                      status === "PENDING" ? "warning" :
                      status === "CANCELLED" ? "destructive" : "outline"
                    }
                    className="text-xs"
                  >
                    {status === "COMPLETED" ? "Concluída" : 
                     status === "PENDING" ? "Pendente" : 
                     status === "CANCELLED" ? "Cancelada" : status}
                  </Badge>
                )}
                
                {isUnlinkedSale && saleData?.status && (
                  <Badge 
                    variant={
                      saleData.status.toLowerCase().includes("concluí") || saleData.status.toLowerCase().includes("pag") 
                        ? "success" :
                      saleData.status.toLowerCase().includes("cancel") 
                        ? "destructive" : "outline"
                    }
                    className="text-xs"
                  >
                    {saleData.status}
                        </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Menu de ações */}
          <div className="ml-4 flex-shrink-0">
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDetailsModalOpen(true)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Ver detalhes
                </DropdownMenuItem>
                
                {isFromTransaction ? (
                  // Opções para transações normais
                  <>
                    <Link href={`/transactions/edit/${id}`} className="w-full">
                      <DropdownMenuItem>
                        <PenLine className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                    </Link>
                    
                    {hasLinkedSale && linkedSales[0] && (
                      <Link href={`/gestao-click/vendas?codigo=${linkedSales[0].code || linkedSales[0].id}`} className="w-full">
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Ver venda no Gestão Click
                </DropdownMenuItem>
                      </Link>
              )}
              
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600" 
                          onClick={() => setDeleteDialogOpen(true)}
                  >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                  </DropdownMenuItem>
                      </>
                    )}
                  </>
                ) : (
                  // Opções para vendas não conciliadas
                  <>
                    <Link href={`/gestao-click/vendas?codigo=${saleData?.code || saleData?.id}`} className="w-full">
                      <DropdownMenuItem>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ver no Gestão Click
                      </DropdownMenuItem>
                    </Link>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </CardContent>
      </Card>
      
      {/* Modal de detalhes */}
      <TransactionDetailsModal
        transaction={{
          id,
          description,
          amount,
          date,
          type,
          category,
          wallet,
          attachments,
          tags,
          metadata,
          linkedSales,
          isFromTransaction,
          saleData,
          status: status as string
        }}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export function TransactionCardSkeleton() {
  return (
    <Card className="hover:shadow-md">
      <CardContent className="p-4 flex items-center">
        <div className="mr-4">
          <div className="w-10 h-10 rounded-full bg-muted"></div>
        </div>
        <div className="flex-grow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
            <div className="mb-1 sm:mb-0">
              <Skeleton className="h-5 w-36" />
            </div>
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1">
            <div className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
        <div className="ml-4">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default TransactionCard; 