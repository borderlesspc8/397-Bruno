"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { Label } from "@/app/_components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Badge } from "@/app/_components/ui/badge";
import { Loader2, ArrowRight, UnlinkIcon } from "lucide-react";
import { Card, CardContent } from "@/app/_components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface SaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: {
    id: string;
    code?: string;
    customerName?: string;
    date: Date | string;
    totalAmount: number;
    status?: string;
    storeName?: string;
  };
  onUnlink?: () => Promise<void>;
}

export default function SaleDetailModal({
  isOpen,
  onClose,
  sale,
  onUnlink
}: SaleDetailModalProps) {
  const [activeTab, setActiveTab] = useState<string>("details");
  const [isLoading, setIsLoading] = useState(false);

  function formatDateLong(date: Date): string {
    try {
      return format(
        typeof date === "string" ? new Date(date) : date,
        "EEEE, dd 'de' MMMM 'de' yyyy",
        { locale: ptBR }
      );
    } catch (e) {
      return String(date);
    }
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  const handleUnlink = async () => {
    if (!onUnlink) return;
    
    setIsLoading(true);
    try {
      await onUnlink();
      onClose();
    } catch (error) {
      console.error("Erro ao desvincular venda:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Transação</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="attachments">Anexos</TabsTrigger>
            <TabsTrigger value="sales">Vendas ({sale ? "1" : "0"})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {/* Conteúdo da aba Detalhes */}
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            {/* Conteúdo da aba Anexos */}
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <h3 className="text-lg font-medium">Vendas Vinculadas</h3>
            
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Venda #{sale.code || sale.id}</h4>
                  <Badge variant="outline">{sale.status || "Concretizada"}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground mr-1">Cliente:</span>
                    <span className="font-medium">{sale.customerName || "Cliente não informado"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground mr-1">Data:</span>
                    <span className="font-medium">{formatDateLong(
                      typeof sale.date === "string" ? new Date(sale.date) : sale.date
                    )}</span>
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
                  {onUnlink && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1 text-destructive"
                      onClick={handleUnlink}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UnlinkIcon className="h-3 w-3" />
                      )}
                      Desvincular
                    </Button>
                  )}
                  <Link href={`/gestao-click/vendas?codigo=${sale.code || sale.id}`}>
                    <Button variant="secondary" size="sm">
                      <ArrowRight className="mr-1 h-3 w-3" />
                      Ver Detalhes
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
