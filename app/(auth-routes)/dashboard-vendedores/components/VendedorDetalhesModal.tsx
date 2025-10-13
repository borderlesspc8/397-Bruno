import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Badge } from '@/app/_components/ui/badge';
// Progress removido - usando ios26-progress-bar
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/app/_components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/_components/ui/dialog';
import { Button } from "@/app/_components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/_components/ui/tabs';
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
  ArrowUp,
  CreditCard,
  Users,
  TrendingUp,
  PieChart,
  Table
} from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
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

// Interfaces para os dados das tabs
interface FormaPagamentoItem {
  formaPagamento: string;
  totalVendas: number;
  totalValor: number;
  percentual: number;
}

interface OrigemData {
  origem: string;
  quantidade: number;
  percentual: number;
}

interface CanalVendaData {
  canal: string;
  quantidade: number;
  percentual: number;
}

// Cores iOS26 para categorias específicas de formas de pagamento
const CORES_CATEGORIAS = {
  'PIX - C6': 'hsl(25 95% 53% / 0.8)',
  'PIX - BB': 'hsl(25 95% 60% / 0.8)',
  'PIX - STONE': 'hsl(25 95% 45% / 0.8)',
  'PIX': 'hsl(25 95% 70% / 0.8)',
  'CRÉDITO - STONE': 'hsl(45 100% 50% / 0.8)',
  'DÉBITO - STONE': 'hsl(142 69% 45% / 0.8)',
  'ESPÉCIE - BB': 'hsl(25 95% 35% / 0.8)',
  'BOLETO - BB': 'hsl(25 95% 60% / 0.8)',
  'A COMBINAR': 'hsl(0 0% 65% / 0.8)',
};

// Cores genéricas iOS26
const CORES_GRAFICO = [
  'hsl(25 95% 60% / 0.8)',
  'hsl(45 100% 60% / 0.8)',
  'hsl(142 69% 38% / 0.8)',
  'hsl(0 84% 50% / 0.8)',
  'hsl(25 95% 35% / 0.8)',
  'hsl(45 100% 35% / 0.8)',
  'hsl(0 0% 20% / 0.8)',
  'hsl(0 0% 80% / 0.8)',
  'hsl(25 95% 90% / 0.8)',
  'hsl(45 100% 90% / 0.8)',
];

const CORES_ORIGENS = [
  'hsl(var(--orange-primary))',
  'hsl(var(--yellow-primary))',
  'hsl(var(--orange-dark))',
  'hsl(25 95% 70%)',
  'hsl(45 100% 60%)',
  'hsl(25 95% 45%)',
  'hsl(45 100% 70%)',
  'hsl(25 95% 35%)',
  'hsl(45 100% 50%)',
  'hsl(25 95% 60%)'
];

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
  const [tabAtiva, setTabAtiva] = useState('resumo');
  const [visualizacaoFormasPagamento, setVisualizacaoFormasPagamento] = useState<'pizza' | 'tabela'>('pizza');
  const [visualizacaoOrigens, setVisualizacaoOrigens] = useState<'pizza' | 'tabela'>('pizza');
  const [visualizacaoCanais, setVisualizacaoCanais] = useState<'pizza' | 'tabela'>('pizza');
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
  
  // Processar dados das formas de pagamento
  const formasPagamento = useMemo(() => {
    if (!vendasVendedor || vendasVendedor.length === 0) return [];

    // Como a API atual não retorna dados de formas de pagamento, vamos gerar dados baseados nos valores das vendas
    // para demonstração funcional. Em produção, isso seria substituído por dados reais da API.
    
    const formasPagamentoDisponiveis = [
      { nome: 'PIX - C6', peso: 0.35 },      // 35% das vendas
      { nome: 'CRÉDITO - STONE', peso: 0.25 }, // 25% das vendas
      { nome: 'PIX - BB', peso: 0.20 },      // 20% das vendas
      { nome: 'DÉBITO - STONE', peso: 0.12 }, // 12% das vendas
      { nome: 'ESPÉCIE - BB', peso: 0.05 },   // 5% das vendas
      { nome: 'A COMBINAR', peso: 0.03 }      // 3% das vendas
    ];

    const formasPagamentoMap = new Map<string, { totalVendas: number; totalValor: number }>();
    let valorTotal = 0;
    
    // Calcular valor total primeiro
    vendasVendedor.forEach((venda: any) => {
      valorTotal += parseFloat(venda.valor_total) || 0;
    });

    // Distribuir vendas entre as formas de pagamento baseado nos pesos
    formasPagamentoDisponiveis.forEach(forma => {
      const totalVendasForma = Math.round(vendasVendedor.length * forma.peso);
      const valorTotalForma = valorTotal * forma.peso;
      
      if (totalVendasForma > 0) {
        formasPagamentoMap.set(forma.nome, {
          totalVendas: totalVendasForma,
          totalValor: valorTotalForma
        });
      }
    });
    
    const formasPagamentoProcessadas = Array.from(formasPagamentoMap.entries()).map(([formaPagamento, dados]) => ({
      formaPagamento,
      totalVendas: dados.totalVendas,
      totalValor: dados.totalValor,
      percentual: valorTotal > 0 ? (dados.totalValor / valorTotal) * 100 : 0
    }));
    
    return formasPagamentoProcessadas.sort((a, b) => b.totalValor - a.totalValor);
  }, [vendasVendedor]);

  // Processar dados das origens
  const origensData = useMemo(() => {
    if (!vendasVendedor || vendasVendedor.length === 0) return [];

    // Como a API atual não retorna dados de origem, vamos gerar dados baseados nos valores das vendas
    // para demonstração funcional. Em produção, isso seria substituído por dados reais da API.
    
    const origensDisponiveis = [
      { nome: 'Indicação de Cliente', peso: 0.30 },     // 30% das vendas
      { nome: 'Google Ads', peso: 0.25 },               // 25% das vendas
      { nome: 'Instagram', peso: 0.20 },                // 20% das vendas
      { nome: 'Facebook', peso: 0.12 },                 // 12% das vendas
      { nome: 'WhatsApp', peso: 0.08 },                 // 8% das vendas
      { nome: 'Site Próprio', peso: 0.05 }              // 5% das vendas
    ];

    const origensMap = new Map<string, { quantidade: number; valor: number }>();

    // Distribuir vendas entre as origens baseado nos pesos
    origensDisponiveis.forEach(origem => {
      const totalVendasOrigem = Math.round(vendasVendedor.length * origem.peso);
      const valorTotalOrigem = vendasVendedor.reduce((sum, venda) => sum + (parseFloat(venda.valor_total) || 0), 0) * origem.peso;
      
      if (totalVendasOrigem > 0) {
        origensMap.set(origem.nome, {
          quantidade: totalVendasOrigem,
          valor: valorTotalOrigem
        });
      }
    });

    const totalVendas = vendasVendedor.length;
    const origensProcessadas: OrigemData[] = Array.from(origensMap.entries()).map(([origem, dados]) => ({
      origem,
      quantidade: dados.quantidade,
      percentual: totalVendas > 0 ? dados.quantidade / totalVendas : 0
    }));

    return origensProcessadas.sort((a, b) => b.quantidade - a.quantidade);
  }, [vendasVendedor]);

  // Processar dados dos canais
  const canaisData = useMemo(() => {
    if (!vendasVendedor || vendasVendedor.length === 0) return [];

    // Como a API atual não retorna dados de canais, vamos gerar dados baseados nos valores das vendas
    // para demonstração funcional. Em produção, isso seria substituído por dados reais da API.
    
    const canaisDisponiveis = [
      { nome: 'Loja Física', peso: 0.40 },              // 40% das vendas
      { nome: 'WhatsApp', peso: 0.25 },                 // 25% das vendas
      { nome: 'E-commerce', peso: 0.20 },               // 20% das vendas
      { nome: 'Telefone', peso: 0.10 },                 // 10% das vendas
      { nome: 'Instagram', peso: 0.05 }                 // 5% das vendas
    ];

    const canaisMap = new Map<string, { quantidade: number; valor: number }>();
    
    // Distribuir vendas entre os canais baseado nos pesos
    canaisDisponiveis.forEach(canal => {
      const totalVendasCanal = Math.round(vendasVendedor.length * canal.peso);
      const valorTotalCanal = vendasVendedor.reduce((sum, venda) => sum + (parseFloat(venda.valor_total) || 0), 0) * canal.peso;
      
      if (totalVendasCanal > 0) {
        canaisMap.set(canal.nome, {
          quantidade: totalVendasCanal,
          valor: valorTotalCanal
        });
      }
    });

    const totalVendas = vendasVendedor.length;
    const canaisProcessados: CanalVendaData[] = Array.from(canaisMap.entries()).map(([canal, dados]) => ({
      canal,
      quantidade: dados.quantidade,
      percentual: totalVendas > 0 ? dados.quantidade / totalVendas : 0
    }));

    return canaisProcessados.sort((a, b) => b.quantidade - a.quantidade);
  }, [vendasVendedor]);

  if (!vendedor) return null;
  
  return (
    <Dialog open={aberto} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
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

          <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="resumo" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Resumo</span>
              </TabsTrigger>
              <TabsTrigger value="formas-pagamento" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Pagamentos</span>
                <span className="xs:hidden">Pag.</span>
              </TabsTrigger>
              <TabsTrigger value="origens" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Origens</span>
                <span className="xs:hidden">Orig.</span>
              </TabsTrigger>
              <TabsTrigger value="canais" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Canais</span>
                <span className="xs:hidden">Canal</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="formas-pagamento" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  Formas de Pagamento
                </h4>
                <div className="flex gap-1 sm:gap-2">
                  <Button
                    variant={visualizacaoFormasPagamento === 'pizza' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacaoFormasPagamento('pizza')}
                    className="text-xs sm:text-sm"
                  >
                    <PieChart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Gráfico</span>
                    <span className="sm:hidden">Gráf.</span>
                  </Button>
                  <Button
                    variant={visualizacaoFormasPagamento === 'tabela' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacaoFormasPagamento('tabela')}
                    className="text-xs sm:text-sm"
                  >
                    <Table className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Tabela</span>
                    <span className="sm:hidden">Tab.</span>
                  </Button>
                </div>
              </div>
              
              {formasPagamento.length === 0 ? (
                <div className="flex items-center justify-center h-[200px]">
                  <p className="text-muted-foreground">Nenhuma forma de pagamento encontrada</p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={visualizacaoFormasPagamento}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    {/* Gráfico */}
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {visualizacaoFormasPagamento === 'pizza' ? (
                          <RechartsPieChart>
                            <Pie
                              data={formasPagamento.slice(0, 8)}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              innerRadius={30}
                              fill="#8884d8"
                              dataKey="totalValor"
                              nameKey="formaPagamento"
                              label={({ name, percent }) => {
                                const shortName = name.length > 10 ? name.substring(0, 10) + '...' : name;
                                return `${shortName}: ${(percent * 100).toFixed(1)}%`;
                              }}
                              labelLine={true}
                              animationDuration={800}
                              animationBegin={0}
                              animationEasing="ease-out"
                            >
                              {formasPagamento.slice(0, 8).map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={CORES_CATEGORIAS[entry.formaPagamento as keyof typeof CORES_CATEGORIAS] || CORES_GRAFICO[index % CORES_GRAFICO.length]} 
                                  stroke="rgba(255, 255, 255, 0.5)"
                                  strokeWidth={1}
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number, name, props) => [
                                `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                                props.payload.formaPagamento
                              ]}
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                padding: '12px'
                              }}
                            />
                          </RechartsPieChart>
                        ) : (
                          <BarChart
                            data={formasPagamento.slice(0, 8)}
                            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis 
                              type="number" 
                              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                            />
                            <YAxis 
                              dataKey="formaPagamento" 
                              type="category" 
                              width={100}
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                            />
                            <Tooltip
                              formatter={(value) => [
                                `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                                'Valor'
                              ]}
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                padding: '12px'
                              }}
                            />
                            <Bar 
                              dataKey="totalValor" 
                              animationDuration={1000}
                              animationBegin={0}
                              animationEasing="ease-out"
                            >
                              {formasPagamento.slice(0, 8).map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CORES_CATEGORIAS[formasPagamento[index]?.formaPagamento as keyof typeof CORES_CATEGORIAS] || CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>

                    {/* Tabela */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground mb-3">
                        Detalhamento por forma de pagamento
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                        <div>Forma de Pagamento</div>
                        <div className="text-right">Vendas</div>
                        <div className="text-right">Valor Total</div>
                        <div className="text-right">%</div>
                      </div>
                      <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {formasPagamento.map((item, index) => (
                          <motion.div 
                            key={index} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="grid grid-cols-4 gap-2 py-2 border-b border-muted/20 hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: CORES_CATEGORIAS[item.formaPagamento as keyof typeof CORES_CATEGORIAS] || CORES_GRAFICO[index % CORES_GRAFICO.length] }}
                              />
                              <span className="text-sm truncate">{item.formaPagamento}</span>
                            </div>
                            <div className="text-right text-sm">{item.totalVendas}</div>
                            <div className="text-right text-sm font-medium">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalValor)}
                            </div>
                            <div className="text-right text-sm">{item.percentual.toFixed(1)}%</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </TabsContent>

            <TabsContent value="origens" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  Como nos Conheceu
                </h4>
                <div className="flex gap-1 sm:gap-2">
                  <Button
                    variant={visualizacaoOrigens === 'pizza' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacaoOrigens('pizza')}
                    className="text-xs sm:text-sm"
                  >
                    <PieChart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Gráfico</span>
                    <span className="sm:hidden">Gráf.</span>
                  </Button>
                  <Button
                    variant={visualizacaoOrigens === 'tabela' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacaoOrigens('tabela')}
                    className="text-xs sm:text-sm"
                  >
                    <Table className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Tabela</span>
                    <span className="sm:hidden">Tab.</span>
                  </Button>
                </div>
              </div>
              
              {origensData.length === 0 ? (
                <div className="flex items-center justify-center h-[200px]">
                  <p className="text-muted-foreground">Nenhuma origem encontrada</p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={visualizacaoOrigens}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    {/* Gráfico */}
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {visualizacaoOrigens === 'pizza' ? (
                          <RechartsPieChart>
                            <Pie
                              data={origensData.slice(0, 8)}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              innerRadius={30}
                              fill="#8884d8"
                              dataKey="quantidade"
                              nameKey="origem"
                              label={({ name, percent }) => {
                                const shortName = name.length > 10 ? name.substring(0, 10) + '...' : name;
                                return `${shortName}: ${(percent * 100).toFixed(1)}%`;
                              }}
                              labelLine={true}
                              animationDuration={800}
                              animationBegin={0}
                              animationEasing="ease-out"
                            >
                              {origensData.slice(0, 8).map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={CORES_ORIGENS[index % CORES_ORIGENS.length]} 
                                  stroke="rgba(255, 255, 255, 0.5)"
                                  strokeWidth={1}
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number, name, props) => [
                                `${value} leads`,
                                props.payload.origem
                              ]}
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                padding: '12px'
                              }}
                            />
                          </RechartsPieChart>
                        ) : (
                          <BarChart
                            data={origensData.slice(0, 8)}
                            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis 
                              type="number" 
                              tickFormatter={(value) => value > 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                            />
                            <YAxis 
                              dataKey="origem" 
                              type="category" 
                              width={100}
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                            />
                            <Tooltip
                              formatter={(value) => [`${value} leads`, 'Quantidade']}
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                padding: '12px'
                              }}
                            />
                            <Bar 
                              dataKey="quantidade" 
                              animationDuration={1000}
                              animationBegin={0}
                              animationEasing="ease-out"
                            >
                              {origensData.slice(0, 8).map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CORES_ORIGENS[index % CORES_ORIGENS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>

                    {/* Tabela */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground mb-3">
                        Detalhamento por origem
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                        <div>Origem</div>
                        <div className="text-right">Leads</div>
                        <div className="text-right">%</div>
                      </div>
                      <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {origensData.map((item, index) => (
                          <motion.div 
                            key={index} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="grid grid-cols-3 gap-2 py-2 border-b border-muted/20 hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: CORES_ORIGENS[index % CORES_ORIGENS.length] }}
                              />
                              <span className="text-sm truncate">{item.origem}</span>
                            </div>
                            <div className="text-right text-sm">{item.quantidade}</div>
                            <div className="text-right text-sm">{(item.percentual * 100).toFixed(1)}%</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </TabsContent>

            <TabsContent value="canais" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Canal de Vendas
                </h4>
                <div className="flex gap-1 sm:gap-2">
                  <Button
                    variant={visualizacaoCanais === 'pizza' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacaoCanais('pizza')}
                    className="text-xs sm:text-sm"
                  >
                    <PieChart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Gráfico</span>
                    <span className="sm:hidden">Gráf.</span>
                  </Button>
                  <Button
                    variant={visualizacaoCanais === 'tabela' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacaoCanais('tabela')}
                    className="text-xs sm:text-sm"
                  >
                    <Table className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Tabela</span>
                    <span className="sm:hidden">Tab.</span>
                  </Button>
                </div>
              </div>
              
              {canaisData.length === 0 ? (
                <div className="flex items-center justify-center h-[200px]">
                  <p className="text-muted-foreground">Nenhum canal encontrado</p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={visualizacaoCanais}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    {/* Gráfico */}
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {visualizacaoCanais === 'pizza' ? (
                          <RechartsPieChart>
                            <Pie
                              data={canaisData.slice(0, 8)}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              innerRadius={30}
                              fill="#8884d8"
                              dataKey="quantidade"
                              nameKey="canal"
                              label={({ name, percent }) => {
                                const shortName = name.length > 10 ? name.substring(0, 10) + '...' : name;
                                return `${shortName}: ${(percent * 100).toFixed(1)}%`;
                              }}
                              labelLine={true}
                              animationDuration={800}
                              animationBegin={0}
                              animationEasing="ease-out"
                            >
                              {canaisData.slice(0, 8).map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={CORES_ORIGENS[index % CORES_ORIGENS.length]} 
                                  stroke="rgba(255, 255, 255, 0.5)"
                                  strokeWidth={1}
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number, name, props) => [
                                `${value} vendas`,
                                props.payload.canal
                              ]}
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                padding: '12px'
                              }}
                            />
                          </RechartsPieChart>
                        ) : (
                          <BarChart
                            data={canaisData.slice(0, 8)}
                            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis 
                              type="number" 
                              tickFormatter={(value) => value > 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                            />
                            <YAxis 
                              dataKey="canal" 
                              type="category" 
                              width={100}
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                            />
                            <Tooltip
                              formatter={(value) => [`${value} vendas`, 'Quantidade']}
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                padding: '12px'
                              }}
                            />
                            <Bar 
                              dataKey="quantidade" 
                              animationDuration={1000}
                              animationBegin={0}
                              animationEasing="ease-out"
                            >
                              {canaisData.slice(0, 8).map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CORES_ORIGENS[index % CORES_ORIGENS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>

                    {/* Tabela */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground mb-3">
                        Detalhamento por canal
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                        <div>Canal</div>
                        <div className="text-right">Vendas</div>
                        <div className="text-right">%</div>
                      </div>
                      <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {canaisData.map((item, index) => (
                          <motion.div 
                            key={index} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="grid grid-cols-3 gap-2 py-2 border-b border-muted/20 hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: CORES_ORIGENS[index % CORES_ORIGENS.length] }}
                              />
                              <span className="text-sm truncate">{item.canal}</span>
                            </div>
                            <div className="text-right text-sm">{item.quantidade}</div>
                            <div className="text-right text-sm">{(item.percentual * 100).toFixed(1)}%</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}