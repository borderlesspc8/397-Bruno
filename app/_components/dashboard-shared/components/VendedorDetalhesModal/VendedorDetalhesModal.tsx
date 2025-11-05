import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/_components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/_components/ui/tabs';
import { User, CreditCard, Users, TrendingUp } from "lucide-react";
import { VendedorDetalhesModalProps } from "./types";
import { useVendedorVendas } from "./hooks/useVendedorVendas";
import { useProcessarDadosAnaliticos } from "./hooks/useProcessarDadosAnaliticos";
import { VendedorDetalhesHeader } from "./components/VendedorDetalhesHeader";
import { ResumoTab } from "./components/ResumoTab";
import { FormasPagamentoTab } from "./components/FormasPagamentoTab";
import { OrigensTab } from "./components/OrigensTab";
import { CanaisTab } from "./components/CanaisTab";

export function VendedorDetalhesModal({
  vendedor,
  aberto,
  onOpenChange,
  onClose,
  dataInicio,
  dataFim,
  totalFaturamento,
  onVendaClick,
  vendasExternas = [],
  lastSync
}: VendedorDetalhesModalProps) {
  const [tabAtiva, setTabAtiva] = useState('resumo');

  const {
    vendasParaProcessar,
    loadingVendas,
    erro
  } = useVendedorVendas({
    vendedor,
    aberto,
    dataInicio,
    dataFim,
    vendasExternas,
    lastSync
  });

  const {
    origensData,
    canaisData
  } = useProcessarDadosAnaliticos({
    vendasParaProcessar
  });

  if (!vendedor) return null;

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto ios26-card rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--orange-primary))] to-[hsl(var(--yellow-primary))] bg-clip-text text-transparent">
            Detalhes do Vendedor
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <VendedorDetalhesHeader 
            vendedor={vendedor}
            dataInicio={dataInicio}
            dataFim={dataFim}
          />

          <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-muted/50 rounded-2xl p-1 gap-1">
              <TabsTrigger 
                value="resumo" 
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--orange-primary))] data-[state=active]:to-[hsl(var(--yellow-primary))] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
              >
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Resumo</span>
              </TabsTrigger>
              <TabsTrigger 
                value="formas-pagamento" 
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--orange-primary))] data-[state=active]:to-[hsl(var(--yellow-primary))] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
              >
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Pagamentos</span>
                <span className="xs:hidden">Pag.</span>
              </TabsTrigger>
              <TabsTrigger 
                value="origens" 
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--orange-primary))] data-[state=active]:to-[hsl(var(--yellow-primary))] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Origens</span>
                <span className="xs:hidden">Orig.</span>
              </TabsTrigger>
              <TabsTrigger 
                value="canais" 
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--orange-primary))] data-[state=active]:to-[hsl(var(--yellow-primary))] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
              >
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Canais</span>
                <span className="xs:hidden">Canal</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumo">
              <ResumoTab
                vendedor={vendedor}
                totalFaturamento={totalFaturamento}
                vendas={vendasParaProcessar}
                loadingVendas={loadingVendas}
                erro={erro}
                onVendaClick={onVendaClick}
              />
            </TabsContent>

            <TabsContent value="formas-pagamento">
              <FormasPagamentoTab vendas={vendasParaProcessar} />
            </TabsContent>

            <TabsContent value="origens">
              <OrigensTab origensData={origensData} />
            </TabsContent>

            <TabsContent value="canais">
              <CanaisTab canaisData={canaisData} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

