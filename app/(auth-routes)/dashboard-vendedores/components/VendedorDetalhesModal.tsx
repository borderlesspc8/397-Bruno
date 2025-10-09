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
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
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

    const CATEGORIAS_PAGAMENTO: Record<string, string> = {
      'PIX - C6': 'PIX - C6',
      'PIX C6': 'PIX - C6',
      'PIX - BB': 'PIX - BB',
      'PIX - STONE': 'PIX - STONE',
      'PIX': 'PIX',
      'ELO CRÉDITO STONE': 'CRÉDITO - STONE',
      'MASTERCARD CRÉDITO STONE': 'CRÉDITO - STONE',
      'MASTER CRÉDITO': 'CRÉDITO - STONE',
      'VISA CRÉDITO STONE': 'CRÉDITO - STONE',
      'Cartão de Crédito Stone': 'CRÉDITO - STONE',
      'CRÉDITO - Stone': 'CRÉDITO - STONE',
      'CRÉDITO - STONE': 'CRÉDITO - STONE',
      'CRÉDITO - Itaú': 'CRÉDITO - STONE',
      'CRÉDITO - ITAÚ': 'CRÉDITO - STONE',
      'CRÉDITO - Slipay': 'CRÉDITO - STONE',
      'CRÉDITO - SLIPAY': 'CRÉDITO - STONE',
      'Cartão de Crédito': 'CRÉDITO - STONE',
      'Crédito': 'CRÉDITO - STONE',
      'DÉBITO - Slipay': 'DÉBITO - STONE',
      'DÉBITO - SLIPAY': 'DÉBITO - STONE',
      'DEBITO - Slipay': 'DÉBITO - STONE',
      'DEBITO - SLIPAY': 'DÉBITO - STONE',
      'DÉBITO - Stone': 'DÉBITO - STONE',
      'DÉBITO - STONE': 'DÉBITO - STONE',
      'DÉBITO - Itaú': 'DÉBITO - STONE',
      'DÉBITO - ITAÚ': 'DÉBITO - STONE',
      'DÉBITO - C6': 'DÉBITO - STONE',
      'Cartão de Débito': 'DÉBITO - STONE',
      'Débito': 'DÉBITO - STONE',
      'Dinheiro à Vista': 'ESPÉCIE - BB',
      'Dinheiro': 'ESPÉCIE - BB',
      'Especie': 'ESPÉCIE - BB',
      'ESPÉCIE - BB': 'ESPÉCIE - BB',
      'Moeda': 'ESPÉCIE - BB',
      'BOLETO': 'BOLETO - BB',
      'Boleto Bancário': 'BOLETO - BB',
      'Boleto': 'BOLETO - BB',
      'BOLETO - BB': 'BOLETO - BB',
      'A COMBINAR': 'A COMBINAR',
      'A Combinar': 'A COMBINAR',
      'A combinar': 'A COMBINAR'
    };

    const normalizarFormaPagamento = (forma: string): string => {
      if (!forma) return 'A COMBINAR';
      
      if (CATEGORIAS_PAGAMENTO[forma]) {
        return CATEGORIAS_PAGAMENTO[forma];
      }
      
      const formaNormalizada = forma.trim();
      
      if (formaNormalizada.includes('PIX')) {
        if (formaNormalizada.includes('C6')) return 'PIX - C6';
        if (formaNormalizada.includes('BB')) return 'PIX - BB';
        if (formaNormalizada.includes('STONE')) return 'PIX - STONE';
        return 'PIX';
      }
      if (formaNormalizada.includes('BOLETO') || formaNormalizada.includes('Boleto')) return 'BOLETO - BB';
      if (formaNormalizada.toLowerCase().includes('dinheiro') || formaNormalizada.toLowerCase().includes('à vista') || 
          formaNormalizada.toLowerCase().includes('especie') || formaNormalizada.toLowerCase().includes('moeda')) return 'ESPÉCIE - BB';
      
      if (formaNormalizada.includes('CRÉDIT') || formaNormalizada.includes('Crédit') || 
          formaNormalizada.includes('CREDIT') || formaNormalizada.includes('Credit')) {
        return 'CRÉDITO - STONE';
      }
      
      if (formaNormalizada.includes('DÉBIT') || formaNormalizada.includes('Débit') ||
          formaNormalizada.includes('DEBIT') || formaNormalizada.includes('Debit')) {
        return 'DÉBITO - STONE';
      }
      
      return 'A COMBINAR';
    };

    const formasPagamentoMap = new Map<string, { totalVendas: number; totalValor: number }>();
    let valorTotal = 0;
    
    vendasVendedor.forEach((venda: any) => {
      const valorVenda = parseFloat(venda.valor_total) || 0;
      valorTotal += valorVenda;
      
      let formaPagamento = 'A COMBINAR';
      
      if (venda.forma_pagamento || venda.metodo_pagamento) {
        const formaOriginal = venda.forma_pagamento || venda.metodo_pagamento || 'A COMBINAR';
        formaPagamento = normalizarFormaPagamento(formaOriginal);
      } else if (venda.pagamentos && Array.isArray(venda.pagamentos) && venda.pagamentos.length > 0) {
        const primeiroPagamento = venda.pagamentos[0]?.pagamento;
        if (primeiroPagamento?.nome_forma_pagamento) {
          const formaOriginal = primeiroPagamento.nome_forma_pagamento;
          formaPagamento = normalizarFormaPagamento(formaOriginal);
        }
      }
      
      if (formasPagamentoMap.has(formaPagamento)) {
        const dadosExistentes = formasPagamentoMap.get(formaPagamento)!;
        formasPagamentoMap.set(formaPagamento, {
          totalVendas: dadosExistentes.totalVendas + 1,
          totalValor: dadosExistentes.totalValor + valorVenda
        });
      } else {
        formasPagamentoMap.set(formaPagamento, {
          totalVendas: 1,
          totalValor: valorVenda
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

    const extrairComoNosConheceu = (venda: any): string | null => {
      if (!venda.metadata?.atributos || !Array.isArray(venda.metadata.atributos)) {
        return null;
      }

      const atributoComoConheceu = venda.metadata.atributos.find((attr: any) => 
        attr.atributo && 
        attr.atributo.descricao && 
        attr.atributo.descricao.toLowerCase().includes('como nos conheceu')
      );

      return atributoComoConheceu?.atributo?.conteudo || null;
    };

    const origensMap = new Map<string, { quantidade: number; valor: number }>();

    vendasVendedor.forEach((venda: any) => {
      let origem = venda.como_nos_conheceu || 
                   extrairComoNosConheceu(venda) ||
                   venda.origem || 
                   venda.canal_venda || 
                   venda.metadata?.como_nos_conheceu ||
                   venda.metadata?.origem ||
                   venda.metadata?.origem_lead ||
                   venda.metadata?.como_conheceu ||
                   venda.metadata?.fonte_origem ||
                   venda.metadata?.origem_cliente ||
                   'Não informado';
      
      if (origem && typeof origem === 'string') {
        origem = origem.trim();
        if (origem === '' || origem.toLowerCase() === 'null') {
          origem = 'Não informado';
        }
      } else {
        origem = 'Não informado';
      }

      const valor = parseFloat(venda.valor_total || venda.valor || '0');

      if (origensMap.has(origem)) {
        const existente = origensMap.get(origem)!;
        existente.quantidade += 1;
        existente.valor += valor;
      } else {
        origensMap.set(origem, { quantidade: 1, valor });
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

    const canaisMap = new Map<string, { quantidade: number; valor: number }>();

    vendasVendedor.forEach((venda: any) => {
      let canal = venda.canal_venda || 
                  venda.metadata?.nome_canal_venda ||
                  venda.metadata?.canal_venda ||
                  venda.origem || 
                  venda.canal || 
                  venda.metadata?.canal ||
                  venda.metadata?.origem_venda ||
                  venda.metadata?.fonte ||
                  venda.metadata?.meio ||
                  'Não informado';
      
      if (canal && typeof canal === 'string') {
        canal = canal.trim();
        if (canal === '' || canal.toLowerCase() === 'null') {
          canal = 'Não informado';
        }
      } else {
        canal = 'Não informado';
      }

      const valor = parseFloat(venda.valor_total || venda.valor || '0');

      if (canaisMap.has(canal)) {
        const existente = canaisMap.get(canal)!;
        existente.quantidade += 1;
        existente.valor += valor;
      } else {
        canaisMap.set(canal, { quantidade: 1, valor });
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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="resumo" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Resumo</span>
              </TabsTrigger>
              <TabsTrigger value="formas-pagamento" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Pagamentos</span>
              </TabsTrigger>
              <TabsTrigger value="origens" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Origens</span>
              </TabsTrigger>
              <TabsTrigger value="canais" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Canais</span>
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
            </TabsContent>

            <TabsContent value="formas-pagamento" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  Formas de Pagamento
                </h4>
                <div className="flex gap-2">
                  <Button
                    variant={visualizacaoFormasPagamento === 'pizza' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacaoFormasPagamento('pizza')}
                  >
                    <PieChart className="h-4 w-4 mr-1" />
                    Gráfico
                  </Button>
                  <Button
                    variant={visualizacaoFormasPagamento === 'tabela' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacaoFormasPagamento('tabela')}
                  >
                    <Table className="h-4 w-4 mr-1" />
                    Tabela
                  </Button>
                </div>
              </div>
              
              {formasPagamento.length === 0 ? (
                <div className="flex items-center justify-center h-[200px]">
                  <p className="text-muted-foreground">Nenhuma forma de pagamento encontrada</p>
                </div>
              ) : visualizacaoFormasPagamento === 'pizza' ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
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
                        label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                      >
                        {formasPagamento.slice(0, 8).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CORES_CATEGORIAS[entry.formaPagamento as keyof typeof CORES_CATEGORIAS] || CORES_GRAFICO[index % CORES_GRAFICO.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name, props) => [
                          `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                          props.payload.formaPagamento
                        ]}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                    <div>Forma de Pagamento</div>
                    <div className="text-right">Vendas</div>
                    <div className="text-right">Valor Total</div>
                    <div className="text-right">%</div>
                  </div>
                  {formasPagamento.map((item, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 py-2 border-b border-muted/20">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CORES_CATEGORIAS[item.formaPagamento as keyof typeof CORES_CATEGORIAS] || CORES_GRAFICO[index % CORES_GRAFICO.length] }}
                        />
                        <span className="text-sm">{item.formaPagamento}</span>
                      </div>
                      <div className="text-right text-sm">{item.totalVendas}</div>
                      <div className="text-right text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalValor)}
                      </div>
                      <div className="text-right text-sm">{item.percentual.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="origens" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  Como nos Conheceu
                </h4>
                <div className="flex gap-2">
                  <Button
                    variant={visualizacaoOrigens === 'pizza' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacaoOrigens('pizza')}
                  >
                    <PieChart className="h-4 w-4 mr-1" />
                    Gráfico
                  </Button>
                  <Button
                    variant={visualizacaoOrigens === 'tabela' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacaoOrigens('tabela')}
                  >
                    <Table className="h-4 w-4 mr-1" />
                    Tabela
                  </Button>
                </div>
              </div>
              
              {origensData.length === 0 ? (
                <div className="flex items-center justify-center h-[200px]">
                  <p className="text-muted-foreground">Nenhuma origem encontrada</p>
                </div>
              ) : visualizacaoOrigens === 'pizza' ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
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
                        label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                      >
                        {origensData.slice(0, 8).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CORES_ORIGENS[index % CORES_ORIGENS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name, props) => [
                          `${value} leads`,
                          props.payload.origem
                        ]}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                    <div>Origem</div>
                    <div className="text-right">Leads</div>
                    <div className="text-right">%</div>
                  </div>
                  {origensData.map((item, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 py-2 border-b border-muted/20">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CORES_ORIGENS[index % CORES_ORIGENS.length] }}
                        />
                        <span className="text-sm">{item.origem}</span>
                      </div>
                      <div className="text-right text-sm">{item.quantidade}</div>
                      <div className="text-right text-sm">{(item.percentual * 100).toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="canais" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Canal de Vendas
                </h4>
                <div className="flex gap-2">
                  <Button
                    variant={visualizacaoCanais === 'pizza' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacaoCanais('pizza')}
                  >
                    <PieChart className="h-4 w-4 mr-1" />
                    Gráfico
                  </Button>
                  <Button
                    variant={visualizacaoCanais === 'tabela' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacaoCanais('tabela')}
                  >
                    <Table className="h-4 w-4 mr-1" />
                    Tabela
                  </Button>
                </div>
              </div>
              
              {canaisData.length === 0 ? (
                <div className="flex items-center justify-center h-[200px]">
                  <p className="text-muted-foreground">Nenhum canal encontrado</p>
                </div>
              ) : visualizacaoCanais === 'pizza' ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
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
                        label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                      >
                        {canaisData.slice(0, 8).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CORES_ORIGENS[index % CORES_ORIGENS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name, props) => [
                          `${value} vendas`,
                          props.payload.canal
                        ]}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                    <div>Canal</div>
                    <div className="text-right">Vendas</div>
                    <div className="text-right">%</div>
                  </div>
                  {canaisData.map((item, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 py-2 border-b border-muted/20">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CORES_ORIGENS[index % CORES_ORIGENS.length] }}
                        />
                        <span className="text-sm">{item.canal}</span>
                      </div>
                      <div className="text-right text-sm">{item.quantidade}</div>
                      <div className="text-right text-sm">{(item.percentual * 100).toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}