"use client";

import { useState, useEffect } from "react";
import { format, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/app/_components/ui/button";
import { Separator } from "@/app/_components/ui/separator";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { DatePicker } from "@/app/_components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { Badge } from "@/app/_components/ui/badge";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { toast } from "sonner";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Checkbox } from "@/app/_components/ui/checkbox";
import { CashFlowPredictionSource, InstallmentStatus, SaleData, SaleInstallment } from "@/app/_types/transaction";
import { ArrowDownToLine, BarChart4, CalendarIcon, CheckCircle, ChevronRight, ClockIcon, Download, Search } from "lucide-react";

interface SalesPreviewModalProps {
  wallets: { id: string; name: string }[];
  defaultWalletId?: string;
  onSuccess?: () => void;
}

export function SalesPreviewModal({
  wallets,
  defaultWalletId,
  onSuccess
}: SalesPreviewModalProps) {
  // Estados
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPredictionLoading, setIsPredictionLoading] = useState(false);
  const [sales, setSales] = useState<SaleData[]>([]);
  const [selectedSale, setSelectedSale] = useState<SaleData | null>(null);
  const [filteredSales, setFilteredSales] = useState<SaleData[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(
    addDays(new Date(), -30)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [walletId, setWalletId] = useState(defaultWalletId || "");
  const [selectedInstallments, setSelectedInstallments] = useState<Record<string, boolean>>({});

  // Carregar vendas
  const loadSales = async () => {
    if (!startDate || !endDate) {
      toast.error("Selecione as datas para buscar as vendas");
      return;
    }

    setIsLoading(true);
    setSales([]);
    setFilteredSales([]);
    setSelectedSale(null);
    setSelectedInstallments({});

    try {
      const response = await fetch(
        `/api/gestao-click/sales?startDate=${format(startDate, "yyyy-MM-dd")}&endDate=${format(
          endDate,
          "yyyy-MM-dd"
        )}&includeInstallments=true`
      );

      if (!response.ok) {
        throw new Error("Falha ao buscar vendas");
      }

      const data = await response.json();
      setSales(data.sales);
      setFilteredSales(data.sales);
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);
      toast.error(
        "Não foi possível carregar as vendas. Verifique sua conexão com o Gestão Click."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar vendas quando o termo de busca mudar
  useEffect(() => {
    if (sales.length === 0) return;

    const filtered = sales.filter((sale) => {
      return (
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.id?.toString() || "").includes(searchTerm) ||
        sale.storeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    setFilteredSales(filtered);
  }, [searchTerm, sales]);

  // Quando o modal abrir, carregar as vendas
  useEffect(() => {
    if (isOpen && walletId) {
      loadSales();
    }
  }, [isOpen, walletId]);

  // Formatar valor em reais
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Mapear status da parcela para um texto mais amigável
  const getInstallmentStatusText = (status: InstallmentStatus) => {
    switch (status) {
      case InstallmentStatus.PENDING:
        return "Pendente";
      case InstallmentStatus.PAID:
        return "Pago";
      case InstallmentStatus.OVERDUE:
        return "Atrasado";
      case InstallmentStatus.CANCELED:
        return "Cancelado";
      default:
        return status;
    }
  };

  // Mapear status da parcela para uma cor
  const getInstallmentStatusColor = (status: InstallmentStatus) => {
    switch (status) {
      case InstallmentStatus.PENDING:
        return "bg-blue-100 text-blue-800";
      case InstallmentStatus.PAID:
        return "bg-green-100 text-green-800";
      case InstallmentStatus.OVERDUE:
        return "bg-red-100 text-red-800";
      case InstallmentStatus.CANCELED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Criar previsões de fluxo de caixa a partir das parcelas selecionadas
  const createPredictionsFromInstallments = async () => {
    if (!selectedSale || !selectedSale.installments || !walletId) {
      toast.error("Selecione uma venda com parcelas e uma carteira");
      return;
    }

    // Verificar se há parcelas selecionadas
    const selectedIds = Object.entries(selectedInstallments)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos uma parcela para criar previsões");
      return;
    }

    setIsPredictionLoading(true);

    try {
      // Filtrar apenas as parcelas selecionadas
      const installmentsToCreate = selectedSale.installments.filter((installment) =>
        selectedIds.includes(installment.id)
      );

      // Criar as previsões no servidor
      const response = await fetch("/api/cash-flow/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          predictions: installmentsToCreate.map((installment) => ({
            description: `Parcela ${installment.installmentNumber}/${installment.totalInstallments} - ${selectedSale.customerName}`,
            amount: installment.amount,
            date: installment.dueDate,
            type: "INCOME",
            walletId,
            source: CashFlowPredictionSource.SALES_INSTALLMENT,
            installmentInfo: {
              saleId: selectedSale.id,
              installmentNumber: installment.installmentNumber,
              totalInstallments: installment.totalInstallments,
              status: installment.status,
              originalDueDate: installment.dueDate,
            },
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Falha ao criar previsões");
      }

      toast.success(`${selectedIds.length} previsões criadas com sucesso!`);
      setIsOpen(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao criar previsões:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível criar as previsões"
      );
    } finally {
      setIsPredictionLoading(false);
    }
  };

  // Selecionar/deselecionar todas as parcelas
  const toggleAllInstallments = (select: boolean) => {
    if (!selectedSale?.installments) return;

    const newSelection: Record<string, boolean> = {};
    selectedSale.installments.forEach((installment) => {
      if (installment.status === InstallmentStatus.PENDING || installment.status === InstallmentStatus.OVERDUE) {
        newSelection[installment.id] = select;
      }
    });
    
    setSelectedInstallments(newSelection);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BarChart4 className="mr-2 h-4 w-4" />
          Previsões de Vendas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Previsões de Fluxo de Caixa - Vendas Parceladas</DialogTitle>
          <DialogDescription>
            Visualize vendas do Gestão Click e adicione previsões de receitas baseadas em parcelas pendentes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 h-full overflow-hidden">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet">Carteira</Label>
              <Select 
                value={walletId} 
                onValueChange={setWalletId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma carteira" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={loadSales} 
              disabled={isLoading || !walletId}
            >
              <Search className="mr-2 h-4 w-4" />
              Buscar Vendas
            </Button>
            <div className="flex-1">
              <Input
                placeholder="Buscar por cliente ou número da venda"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full overflow-hidden">
            {/* Lista de Vendas */}
            <div className="col-span-1 md:col-span-1 overflow-hidden">
              <Card className="h-full flex flex-col">
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-sm font-medium">Vendas</CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 px-4">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                    </div>
                  ) : filteredSales.length === 0 ? (
                    <div className="py-4 text-center text-muted-foreground">
                      Nenhuma venda encontrada
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredSales.map((sale) => (
                        <div
                          key={sale.id}
                          className={`border rounded-md p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${
                            selectedSale?.id === sale.id
                              ? "bg-accent text-accent-foreground"
                              : ""
                          }`}
                          onClick={() => {
                            setSelectedSale(sale);
                            setSelectedInstallments({});
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="font-medium truncate">
                              {sale.customerName}
                            </div>
                            <Badge variant="outline" className="ml-2 shrink-0">
                              {sale.status}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {format(
                              typeof sale.date === "string"
                                ? parseISO(sale.date as any)
                                : sale.date,
                              "dd/MM/yyyy"
                            )}
                            <span className="mx-1">•</span>
                            {formatCurrency(sale.totalAmount)}
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <div className="text-muted-foreground">
                              Loja: {sale.storeName}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>

            {/* Detalhes da Venda */}
            <div className="col-span-1 md:col-span-2 overflow-hidden">
              <Card className="h-full flex flex-col">
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-sm font-medium">
                    {selectedSale
                      ? `Parcelas da Venda - ${selectedSale.customerName}`
                      : "Selecione uma venda para ver as parcelas"}
                  </CardTitle>
                  {selectedSale && selectedSale.installments && selectedSale.installments.length > 0 && (
                    <div className="flex justify-end gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleAllInstallments(true)}
                      >
                        Selecionar Todas
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleAllInstallments(false)}
                      >
                        Limpar Seleção
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <ScrollArea className="flex-1">
                  {!selectedSale ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Selecione uma venda para ver detalhes
                    </div>
                  ) : !selectedSale.installments || selectedSale.installments.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Esta venda não possui parcelas registradas
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <span className="sr-only">Selecionar</span>
                          </TableHead>
                          <TableHead>Parcela</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSale.installments.map((installment) => (
                          <TableRow key={installment.id}>
                            <TableCell>
                              <Checkbox
                                checked={Boolean(selectedInstallments[installment.id])}
                                onCheckedChange={(checked) => {
                                  setSelectedInstallments({
                                    ...selectedInstallments,
                                    [installment.id]: Boolean(checked),
                                  });
                                }}
                                disabled={installment.status === InstallmentStatus.PAID || installment.status === InstallmentStatus.CANCELED}
                              />
                            </TableCell>
                            <TableCell>
                              {installment.installmentNumber}/{installment.totalInstallments}
                            </TableCell>
                            <TableCell>
                              {format(
                                typeof installment.dueDate === "string"
                                  ? parseISO(installment.dueDate as any)
                                  : installment.dueDate,
                                "dd/MM/yyyy"
                              )}
                            </TableCell>
                            <TableCell>{formatCurrency(installment.amount)}</TableCell>
                            <TableCell>
                              <Badge className={getInstallmentStatusColor(installment.status)}>
                                {getInstallmentStatusText(installment.status)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex flex-col sm:flex-row gap-2 w-full justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {Object.values(selectedInstallments).filter(Boolean).length} parcelas selecionadas
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={createPredictionsFromInstallments}
                disabled={
                  isPredictionLoading ||
                  !selectedSale ||
                  !walletId ||
                  Object.values(selectedInstallments).filter(Boolean).length === 0
                }
              >
                {isPredictionLoading ? (
                  "Criando previsões..."
                ) : (
                  <>
                    <ArrowDownToLine className="mr-2 h-4 w-4" />
                    Criar Previsões
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 