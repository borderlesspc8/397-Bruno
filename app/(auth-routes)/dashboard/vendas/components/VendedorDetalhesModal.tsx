import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Badge } from '@/app/_components/ui/badge';
import { Progress } from '@/app/_components/ui/progress';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/app/_components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/_components/ui/dialog';
import { VendasService } from "@/app/_services/vendas";
import { Vendedor as BaseVendedor } from "@/app/_services/betelTecnologia";

// Interface estendida com propriedades adicionais
interface Vendedor extends BaseVendedor {
  posicao?: number;
  percentual?: number;
}

interface VendedorDetalhesModalProps {
  vendedor: Vendedor | null;
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  dataInicio: Date;
  dataFim: Date;
  totalFaturamento: number;
  onVendaClick: (venda: any) => void;
}

export function VendedorDetalhesModal({
  vendedor,
  aberto,
  onOpenChange,
  dataInicio,
  dataFim,
  totalFaturamento,
  onVendaClick
}: VendedorDetalhesModalProps) {
  const [vendasVendedor, setVendasVendedor] = useState<any[]>([]);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;
  
  useEffect(() => {
    if (aberto && vendedor) {
      buscarVendasVendedor(vendedor.id);
    } else {
      // Limpar dados ao fechar o modal
      setVendasVendedor([]);
      setPaginaAtual(1);
      setErro(null);
    }
  }, [aberto, vendedor]);
  
  const buscarVendasVendedor = async (vendedorId: string) => {
    if (!vendedorId) return;
    
    try {
      setLoadingVendas(true);
      setErro(null);
      
      const response = await VendasService.buscarVendasPorVendedor({
        dataInicio,
        dataFim,
        vendedorId
      });
      
      if (response.erro) {
        throw new Error(response.erro);
      }
      
      setVendasVendedor(response.vendas || []);
    } catch (error) {
      console.error('Erro ao buscar vendas do vendedor:', error);
      setErro(error instanceof Error ? error.message : 'Erro ao buscar vendas');
    } finally {
      setLoadingVendas(false);
    }
  };
  
  // Calcular índices para paginação
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = indiceInicial + itensPorPagina;
  const totalPaginas = Math.ceil((vendasVendedor?.length || 0) / itensPorPagina);
  const vendasPaginadas = vendasVendedor.slice(indiceInicial, indiceFinal);
  
  // Funções para navegação de página
  const irParaPaginaAnterior = () => {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1);
    }
  };
  
  const irParaProximaPagina = () => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(paginaAtual + 1);
    }
  };
  
  if (!vendedor) return null;
  
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Detalhes do Vendedor
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-lg font-medium">{vendedor.nome}</h3>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              {vendedor.posicao}º Lugar
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total de Vendas</p>
              <p className="text-2xl font-semibold">{vendedor.vendas}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Faturamento</p>
              <p className="text-2xl font-semibold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vendedor.faturamento)}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
              <p className="text-2xl font-semibold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vendedor.ticketMedio)}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">% do Faturamento Total</p>
              <p className="text-2xl font-semibold">
                {((vendedor.faturamento / totalFaturamento) * 100).toFixed(2)}%
              </p>
            </div>
          </div>
          
          <div className="pt-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Performance</span>
                <span>{vendedor.percentual ? vendedor.percentual.toFixed(2) : ((vendedor.faturamento / totalFaturamento) * 100).toFixed(2)}%</span>
              </div>
              <Progress value={vendedor.percentual || ((vendedor.faturamento / totalFaturamento) * 100)} className="h-2 bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
          
          {/* Lista de Vendas do Vendedor */}
          <div className="pt-6 border-t mt-4">
            <h4 className="text-md font-semibold mb-3">Vendas Realizadas</h4>
            
            {loadingVendas ? (
              <div className="flex items-center justify-center h-[150px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#faba33] mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Carregando vendas...</p>
                </div>
              </div>
            ) : erro ? (
              <div className="flex items-center justify-center h-[100px] text-red-500">
                <p className="text-sm">{erro}</p>
              </div>
            ) : vendasVendedor.length === 0 ? (
              <div className="flex items-center justify-center h-[100px]">
                <p className="text-sm text-muted-foreground">Nenhuma venda encontrada no período</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-auto max-h-[200px]">
                  <table className="w-full text-sm">
                    <thead className="text-xs bg-muted/30">
                      <tr>
                        <th className="px-2 py-2 text-left">Data</th>
                        <th className="px-2 py-2 text-left">Cliente</th>
                        <th className="px-2 py-2 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {vendasPaginadas.map((venda, index) => (
                        <tr key={index} className="hover:bg-muted/20 cursor-pointer" onClick={() => onVendaClick(venda)}>
                          <td className="px-2 py-2">
                            {venda.data 
                              ? new Date(venda.data).toLocaleDateString('pt-BR')
                              : "Data não disponível"}
                          </td>
                          <td className="px-2 py-2">{venda.nome_cliente || "Cliente não identificado"}</td>
                          <td className="px-2 py-2 text-right">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(venda.valor_total) || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Paginação */}
                {totalPaginas > 1 && (
                  <Pagination className="mt-2">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={irParaPaginaAnterior} 
                          className={paginaAtual === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="text-sm">{paginaAtual} de {totalPaginas}</span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={irParaProximaPagina}
                          className={paginaAtual === totalPaginas ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 