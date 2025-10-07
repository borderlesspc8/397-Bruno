import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Badge } from '@/app/_components/ui/badge';
// Progress removido - usando ios26-progress-bar
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/app/_components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/_components/ui/dialog';
import { Button } from "@/app/_components/ui/button";
import { VendasService } from "@/app/_services/vendas";
import { Vendedor as BaseVendedor } from "@/app/_services/betelTecnologia";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";
import { 
  BarChart2, 
  Calendar, 
  DollarSign, 
  Mail, 
  MapPin, 
  Phone, 
  Store, 
  Trophy, 
  User,
  ArrowUpDown,
  ArrowDown,
  ArrowUp
} from "lucide-react";
// Imports removidos - não utilizados no componente

// Função utilitária para formatar datas considerando o fuso horário brasileiro
const formatarDataBrasileira = (dataString: string): string => {
  if (!dataString) return "Data não disponível";
  
  try {
    // Se a data já está no formato YYYY-MM-DD, criar a data diretamente
    // para evitar problemas de conversão de timezone
    let data: Date;
    
    if (dataString.includes('T') || dataString.includes('Z')) {
      // Formato ISO - usar diretamente
      data = new Date(dataString);
    } else if (dataString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Formato YYYY-MM-DD - criar data local para evitar problemas de UTC
      const [ano, mes, dia] = dataString.split('-').map(Number);
      data = new Date(ano, mes - 1, dia); // mes - 1 porque Date usa 0-11
    } else {
      // Outros formatos - tentar conversão normal
      data = new Date(dataString);
    }
    
    // Verificar se a data é válida
    if (isNaN(data.getTime())) {
      return "Data inválida";
    }
    
    // Formatar usando o fuso horário brasileiro
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error, { dataString });
    return "Data inválida";
  }
};

// Interface estendida com propriedades adicionais
interface Vendedor extends BaseVendedor {
  posicao?: number;
  percentual?: number;
}

interface VendedorDetalhesModalProps {
  vendedor: Vendedor | null;
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  onClose?: () => void;
  dataInicio: Date;
  dataFim: Date;
  totalFaturamento: number;
  onVendaClick: (venda: any) => void;
}

export function VendedorDetalhesModal({
  vendedor,
  aberto,
  onOpenChange,
  onClose,
  dataInicio,
  dataFim,
  totalFaturamento,
  onVendaClick
}: VendedorDetalhesModalProps) {
  const [vendasVendedor, setVendasVendedor] = useState<any[]>([]);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ordenacaoValor, setOrdenacaoValor] = useState<'maior-menor' | 'menor-maior'>('maior-menor');
  const itensPorPagina = 10;
  
  // Função para ordenar vendas por valor
  const ordenarVendasPorValor = (vendas: any[]) => {
    return [...vendas].sort((a, b) => {
      const valorA = parseFloat(a.valor_total) || 0;
      const valorB = parseFloat(b.valor_total) || 0;
      
      if (ordenacaoValor === 'maior-menor') {
        return valorB - valorA; // Maior para menor
      } else {
        return valorA - valorB; // Menor para maior
      }
    });
  };
  
  // Função para alternar ordenação
  const alternarOrdenacao = () => {
    const novaOrdenacao = ordenacaoValor === 'maior-menor' ? 'menor-maior' : 'maior-menor';
    setOrdenacaoValor(novaOrdenacao);
    setPaginaAtual(1); // Voltar para primeira página ao mudar ordenação
    
    // Log para debug
    console.log('🔄 [VendedorDetalhesModal] Ordenação alterada:', {
      ordenacaoAnterior: ordenacaoValor,
      novaOrdenacao,
      totalVendas: vendasVendedor.length
    });
  };
  
  useEffect(() => {
    if (aberto && vendedor) {
      buscarVendasVendedor(vendedor.id);
    } else {
      // Limpar dados ao fechar o modal
      setVendasVendedor([]);
      setPaginaAtual(1);
      setErro(null);
    }
  }, [aberto, vendedor, dataInicio, dataFim]); // Adicionar dataInicio e dataFim como dependências
  
  // Log para debug da ordenação
  useEffect(() => {
    if (vendasVendedor.length > 0) {
      const vendasOrdenadas = ordenarVendasPorValor(vendasVendedor);
      console.log('🔍 [VendedorDetalhesModal] Debug ordenação:', {
        ordenacaoAtual: ordenacaoValor,
        totalVendas: vendasVendedor.length,
        primeirosValores: vendasOrdenadas.slice(0, 3).map(v => ({
          cliente: v.nome_cliente,
          valor: parseFloat(v.valor_total) || 0,
          valorFormatado: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(v.valor_total) || 0)
        })),
        ultimosValores: vendasOrdenadas.slice(-3).map(v => ({
          cliente: v.nome_cliente,
          valor: parseFloat(v.valor_total) || 0,
          valorFormatado: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(v.valor_total) || 0)
        }))
      });
    }
  }, [ordenacaoValor, vendasVendedor]);
  
  const buscarVendasVendedor = async (vendedorId: string) => {
    if (!vendedorId) return;
    
    try {
      setLoadingVendas(true);
      setErro(null);
      
      // Log para debug
      console.log('🔍 [VendedorDetalhesModal] Buscando vendas para vendedor:', {
        vendedorId,
        vendedorNome: vendedor?.nome,
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        dataInicioFormatted: dataInicio.toLocaleDateString('pt-BR'),
        dataFimFormatted: dataFim.toLocaleDateString('pt-BR')
      });
      
      const response = await VendasService.buscarVendasPorVendedor({
        dataInicio,
        dataFim,
        vendedorId
      });
      
      if (response.erro) {
        throw new Error(response.erro);
      }
      
      console.log('✅ [VendedorDetalhesModal] Vendas encontradas:', {
        totalVendas: response.vendas?.length || 0,
        totalValor: response.totalValor,
        primeirasVendas: response.vendas?.slice(0, 3).map(v => ({
          id: v.id,
          cliente: v.cliente,
          valor_total: v.valor_total,
          vendedor_id: v.vendedor_id,
          nome_vendedor: (v as any).nome_vendedor
        }))
      });
      
      setVendasVendedor(response.vendas || []);
    } catch (error) {
      console.error('❌ [VendedorDetalhesModal] Erro ao buscar vendas do vendedor:', error);
      setErro(error instanceof Error ? error.message : 'Erro ao buscar vendas');
    } finally {
      setLoadingVendas(false);
    }
  };
  
  // Aplicar ordenação e calcular índices para paginação
  const vendasOrdenadas = ordenarVendasPorValor(vendasVendedor);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = indiceInicial + itensPorPagina;
  const totalPaginas = Math.ceil((vendasOrdenadas?.length || 0) / itensPorPagina);
  const vendasPaginadas = vendasOrdenadas.slice(indiceInicial, indiceFinal);
  
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
  
  // Função para lidar com o fechamento do modal
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open && onClose) {
      onClose();
    }
  };
  
  if (!vendedor) return null;
  
  return (
    <Dialog open={aberto} onOpenChange={handleOpenChange}>
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
              {vendedor.posicao || 1}º Lugar
            </Badge>
          </div>
          
          {/* Exibir período de datas */}
          <div className="bg-muted/30 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Período: {dataInicio.toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  timeZone: 'America/Sao_Paulo'
                })} até {dataFim.toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  timeZone: 'America/Sao_Paulo'
                })}
              </span>
            </div>
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
              <div className="ios26-progress">
                <div 
                  className="ios26-progress-bar" 
                  style={{ 
                    width: `${Math.min(vendedor.percentual || ((vendedor.faturamento / totalFaturamento) * 100), 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Lista de Vendas do Vendedor */}
          <div className="pt-6 border-t mt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-semibold">Vendas Realizadas</h4>
              
              {/* Filtro de Ordenação por Valor */}
              <Button
                variant="outline"
                size="sm"
                onClick={alternarOrdenacao}
                className="flex items-center gap-2 hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm">Valor</span>
                {ordenacaoValor === 'maior-menor' ? (
                  <ArrowDown className="h-3 w-3" />
                ) : (
                  <ArrowUp className="h-3 w-3" />
                )}
              </Button>
            </div>
            
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
                            {formatarDataBrasileira(venda.data)}
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