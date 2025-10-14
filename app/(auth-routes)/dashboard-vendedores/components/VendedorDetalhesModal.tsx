import { useState, useEffect, useMemo, useRef } from "react";
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
import { useProcessarFormasPagamento } from '@/app/_hooks/useProcessarFormasPagamento';
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

// Função para extrair dados de venda com fallbacks robustos
const extrairDadosVenda = (venda: any) => {
  // Log detalhado da estrutura da venda para debug
  console.log('🔍 [VendedorDetalhesModal] Estrutura completa da venda:', {
    id: venda.id,
    todasAsPropriedades: Object.keys(venda),
    valoresPrincipais: {
      data: venda.data,
      data_venda: venda.data_venda,
      data_criacao: venda.data_criacao,
      data_atualizacao: venda.data_atualizacao,
      data_inclusao: venda.data_inclusao,
      cliente: venda.cliente,
      nome_cliente: venda.nome_cliente,
      cliente_nome: venda.cliente_nome,
      valor_total: venda.valor_total,
      forma_pagamento: venda.forma_pagamento,
      meio_pagamento: venda.meio_pagamento,
      vendedor_id: venda.vendedor_id,
      nome_vendedor: venda.nome_vendedor,
      vendedor_nome: venda.vendedor_nome
    }
  });

  // Extrair data com múltiplos fallbacks
  const dataVenda = venda.data_venda || 
                   venda.data_criacao || 
                   venda.data_atualizacao || 
                   venda.data_inclusao || 
                   venda.data || 
                   null;

  // Extrair nome do cliente com múltiplos fallbacks
  const nomeCliente = venda.nome_cliente || 
                     venda.cliente_nome || 
                     venda.cliente || 
                     'Cliente não identificado';

  // Extrair valor total
  const valorTotal = venda.valor_total || '0';

  console.log('🔍 [VendedorDetalhesModal] Dados extraídos:', {
    id: venda.id,
    dataVenda,
    nomeCliente,
    valorTotal
  });

  return {
    dataVenda,
    nomeCliente,
    valorTotal
  };
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
  // Props para auto-atualização das tabs
  vendasExternas?: any[]; // Vendas do dashboard principal para sincronização
  lastSync?: string; // Timestamp da última sincronização
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
  onVendaClick,
  vendasExternas = [],
  lastSync
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
  
  // Refs para controle de auto-atualização
  const lastSyncRef = useRef<string>('');
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Função para ordenar vendas por valor
  const ordenarVendasPorValor = (vendas: any[]) => {
    return [...vendas].sort((a, b) => {
      const { valorTotal: valorAStr } = extrairDadosVenda(a);
      const { valorTotal: valorBStr } = extrairDadosVenda(b);
      const valorA = parseFloat(valorAStr) || 0;
      const valorB = parseFloat(valorBStr) || 0;
      
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
      // Se temos vendas externas, não fazer busca própria
      if (vendasExternas && vendasExternas.length > 0) {
        console.log('🔄 [VendedorDetalhesModal] Modal aberto - usando vendas externas');
        return;
      }
      
      // Fallback: buscar vendas próprias se não temos vendas externas
      buscarVendasVendedor(vendedor.id);
    } else {
      // Limpar dados ao fechar o modal
      setVendasVendedor([]);
      setPaginaAtual(1);
      setErro(null);
    }
  }, [aberto, vendedor, dataInicio, dataFim, vendasExternas]); // Adicionar vendasExternas como dependência
  
  // AUTO-ATUALIZAÇÃO DAS TABS - Monitora mudanças nas vendas externas
  useEffect(() => {
    if (!aberto || !vendedor) {
      return;
    }

    // Se temos vendas externas, usar elas como fonte principal
    if (vendasExternas && vendasExternas.length > 0) {
      console.log('🔄 [VendedorDetalhesModal] Usando vendas externas como fonte principal para tabs...', {
        vendedorId: vendedor.id,
        vendedorNome: vendedor.nome,
        totalVendasExternas: vendasExternas.length,
        lastSync
      });
      
      // As vendas externas filtradas serão processadas automaticamente pelos useMemo
      // Não precisamos mais fazer busca própria se temos vendas externas
      return;
    }

    // Fallback: se não temos vendas externas, fazer busca própria
    if (!vendasVendedor.length && vendedor.id) {
      console.log('🔄 [VendedorDetalhesModal] Fallback: buscando vendas próprias...', {
        vendedorId: vendedor.id,
        vendedorNome: vendedor.nome
      });
      
      buscarVendasVendedor(vendedor.id);
    }
  }, [aberto, vendedor, vendasExternas, lastSync]);
  
  // Filtrar vendas externas pelo vendedor específico
  const vendasVendedorExternas = useMemo(() => {
    if (!vendedor || !vendasExternas || vendasExternas.length === 0) {
      return [];
    }

    const vendasFiltradas = vendasExternas.filter(venda => {
      const vendaVendedorId = String(venda.vendedor_id || '').replace('gc-', '');
      const vendaNomeVendedor = String(venda.nome_vendedor || '').toLowerCase().trim();
      const vendaVendedorNome = String(venda.vendedor_nome || '').toLowerCase().trim();
      const vendedorNome = vendedor.nome.toLowerCase().trim();
      const vendedorIdNormalizado = vendedor.id.replace('gc-', '');
      
      // Lógica de filtragem mais robusta para capturar todas as variações
      const matchById = vendaVendedorId === vendedorIdNormalizado;
      const matchByNomeExato = vendaNomeVendedor === vendedorNome || vendaVendedorNome === vendedorNome;
      const matchByInclusao = vendaNomeVendedor.includes(vendedorNome) || vendaVendedorNome.includes(vendedorNome);
      
      // Adicionar suporte a nomes sem acentos
      const vendedorNomeSemAcentos = vendedorNome.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const vendaNomeSemAcentos = vendaNomeVendedor.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const vendaVendedorNomeSemAcentos = vendaVendedorNome.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      const matchSemAcentos = vendaNomeSemAcentos.includes(vendedorNomeSemAcentos) || 
                             vendaVendedorNomeSemAcentos.includes(vendedorNomeSemAcentos);
      
      return matchById || matchByNomeExato || matchByInclusao || matchSemAcentos;
    });

    console.log('🔍 [VendedorDetalhesModal] Vendas filtradas pelo vendedor:', {
      vendedorId: vendedor.id,
      vendedorNome: vendedor.nome,
      totalVendasExternas: vendasExternas.length,
      vendasFiltradas: vendasFiltradas.length,
      primeirasVendasFiltradas: vendasFiltradas.slice(0, 3).map(v => ({
        id: v.id,
        vendedor_id: v.vendedor_id,
        nome_vendedor: v.nome_vendedor,
        forma_pagamento: v.forma_pagamento,
        canal_venda: v.canal_venda,
        origem: v.origem,
        como_nos_conheceu: v.como_nos_conheceu
      }))
    });

    return vendasFiltradas;
  }, [vendedor, vendasExternas]);

  // Usar vendas externas filtradas como fonte principal, com fallback para vendas da busca própria
  const vendasParaProcessar = useMemo(() => {
    return vendasVendedorExternas.length > 0 ? vendasVendedorExternas : vendasVendedor;
  }, [vendasVendedorExternas, vendasVendedor]);
  
  // Log para debug da ordenação
  useEffect(() => {
    if (vendasParaProcessar.length > 0) {
      const vendasOrdenadas = ordenarVendasPorValor(vendasParaProcessar);
      console.log('🔍 [VendedorDetalhesModal] Debug ordenação:', {
        ordenacaoAtual: ordenacaoValor,
        totalVendas: vendasParaProcessar.length,
        fonteDados: vendasVendedorExternas.length > 0 ? 'vendasExternas' : 'buscaPropria',
        primeirosValores: vendasOrdenadas.slice(0, 3).map(v => {
          const { nomeCliente, valorTotal } = extrairDadosVenda(v);
          return {
            cliente: nomeCliente,
            valor: parseFloat(valorTotal) || 0,
            valorFormatado: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(valorTotal) || 0)
          };
        }),
        ultimosValores: vendasOrdenadas.slice(-3).map(v => {
          const { nomeCliente, valorTotal } = extrairDadosVenda(v);
          return {
            cliente: nomeCliente,
            valor: parseFloat(valorTotal) || 0,
            valorFormatado: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(valorTotal) || 0)
          };
        })
      });
    }
  }, [ordenacaoValor, vendasParaProcessar]);
  
  // AUTO-REFRESH PERIÓDICO - Polling a cada 1 minuto quando modal estiver aberto
  useEffect(() => {
    if (!aberto || !vendedor) {
      // Limpar interval se modal fechado
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      return;
    }

    console.log('🔄 [VendedorDetalhesModal] Configurando auto-refresh para tabs...', {
      vendedorId: vendedor.id,
      refreshInterval: 60000 // 1 minuto
    });

    // Configurar polling a cada 1 minuto apenas como fallback
    updateIntervalRef.current = setInterval(async () => {
      if (aberto && vendedor) {
        console.log('🔄 [VendedorDetalhesModal] Auto-refresh das tabs executado (fallback)');
        
        try {
          await buscarVendasVendedor(vendedor.id);
        } catch (error) {
          console.error('❌ [VendedorDetalhesModal] Erro no auto-refresh:', error);
        }
      }
    }, 60000); // 1 minuto

    // Cleanup
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [aberto, vendedor, dataInicio, dataFim]);
  
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
  
  // Aplicar ordenação e calcular índices para paginação - USAR vendasParaProcessar
  const vendasOrdenadas = ordenarVendasPorValor(vendasParaProcessar);
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
  
  // Processar dados das formas de pagamento usando o hook especializado
  const formasPagamento = useProcessarFormasPagamento(vendasParaProcessar);

  // Função para extrair "Como nos conheceu" dos atributos
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

  // Processar dados das origens
  const origensData = useMemo(() => {
    if (!vendasParaProcessar || vendasParaProcessar.length === 0) return [];

    console.log('📊 [VendedorDetalhesModal] Processando origens com dados reais:', {
      totalVendas: vendasParaProcessar.length,
      fonteDados: vendasVendedorExternas.length > 0 ? 'vendasExternas' : 'buscaPropria',
      primeirasVendas: vendasParaProcessar.slice(0, 3).map(v => {
        const { valorTotal } = extrairDadosVenda(v);
        return {
          id: v.id,
          origem: v.origem,
          como_nos_conheceu: v.como_nos_conheceu,
          valor_total: valorTotal
        };
      })
    });

    const origensMap = new Map<string, { quantidade: number; valor: number }>();

    // Processar vendas reais - usando exatamente os mesmos campos que ComoNosConheceuUnidade.tsx
    vendasParaProcessar.forEach((venda: any) => {
      // Usar exatamente a mesma lógica do componente funcionando (linhas 116-126)
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
      
      // Normalizar nome da origem (mesmo tratamento dos componentes funcionais)
      if (origem && typeof origem === 'string') {
        origem = origem.trim();
        if (origem === '' || origem.toLowerCase() === 'null') {
          origem = 'Não informado';
        }
      } else {
        origem = 'Não informado';
      }

      const { valorTotal: valorVendaStr } = extrairDadosVenda(venda);
      const valor = parseFloat(valorVendaStr || '0');

      if (origensMap.has(origem)) {
        const existente = origensMap.get(origem)!;
        existente.quantidade += 1;
        existente.valor += valor;
      } else {
        origensMap.set(origem, { quantidade: 1, valor });
      }
    });

    const totalVendas = vendasParaProcessar.length;
    const origensProcessadas: OrigemData[] = Array.from(origensMap.entries()).map(([origem, dados]) => ({
      origem,
      quantidade: dados.quantidade,
      percentual: totalVendas > 0 ? dados.quantidade / totalVendas : 0
    }));

    console.log('✅ [VendedorDetalhesModal] Origens processadas:', {
      totalOrigens: origensProcessadas.length,
      totalVendas,
      fonteDados: vendasVendedorExternas.length > 0 ? 'vendasExternas' : 'buscaPropria',
      origens: origensProcessadas.map(o => ({ origem: o.origem, quantidade: o.quantidade, percentual: o.percentual }))
    });

    return origensProcessadas.sort((a, b) => b.quantidade - a.quantidade);
  }, [vendasParaProcessar, vendasVendedorExternas.length]);

  // Processar dados dos canais
  const canaisData = useMemo(() => {
    if (!vendasParaProcessar || vendasParaProcessar.length === 0) return [];

    console.log('📊 [VendedorDetalhesModal] Processando canais com dados reais:', {
      totalVendas: vendasParaProcessar.length,
      fonteDados: vendasVendedorExternas.length > 0 ? 'vendasExternas' : 'buscaPropria',
      primeirasVendas: vendasParaProcessar.slice(0, 3).map(v => {
        const { valorTotal } = extrairDadosVenda(v);
        return {
          id: v.id,
          canal_venda: v.canal_venda,
          origem: v.origem,
          valor_total: valorTotal
        };
      })
    });

    const canaisMap = new Map<string, { quantidade: number; valor: number }>();
    
    // Processar vendas reais - usando exatamente os mesmos campos que CanalDeVendasUnidade.tsx
    vendasParaProcessar.forEach((venda: any) => {
      // Usar exatamente a mesma lógica do componente funcionando (linhas 101-110)
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
      
      // Normalizar nome do canal (mesmo tratamento dos componentes funcionais)
      if (canal && typeof canal === 'string') {
        canal = canal.trim();
        if (canal === '' || canal.toLowerCase() === 'null') {
          canal = 'Não informado';
        }
      } else {
        canal = 'Não informado';
      }

      const { valorTotal: valorVendaStr } = extrairDadosVenda(venda);
      const valor = parseFloat(valorVendaStr || '0');

      if (canaisMap.has(canal)) {
        const existente = canaisMap.get(canal)!;
        existente.quantidade += 1;
        existente.valor += valor;
      } else {
        canaisMap.set(canal, { quantidade: 1, valor });
      }
    });

    const totalVendas = vendasParaProcessar.length;
    const canaisProcessados: CanalVendaData[] = Array.from(canaisMap.entries()).map(([canal, dados]) => ({
      canal,
      quantidade: dados.quantidade,
      percentual: totalVendas > 0 ? dados.quantidade / totalVendas : 0
    }));

    console.log('✅ [VendedorDetalhesModal] Canais processados:', {
      totalVendas,
      fonteDados: vendasVendedorExternas.length > 0 ? 'vendasExternas' : 'buscaPropria',
      totalCanais: canaisProcessados.length,
      canais: canaisProcessados.map(c => ({ canal: c.canal, quantidade: c.quantidade, percentual: c.percentual })),
      somaTotal: canaisProcessados.reduce((sum, c) => sum + c.quantidade, 0)
    });

    return canaisProcessados.sort((a, b) => b.quantidade - a.quantidade);
  }, [vendasParaProcessar, vendasVendedorExternas.length]);

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
                ) : vendasParaProcessar.length === 0 ? (
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
                          {vendasPaginadas.map((venda, index) => {
                            const { dataVenda, nomeCliente, valorTotal } = extrairDadosVenda(venda);
                            return (
                              <tr key={index} className="hover:bg-muted/20 cursor-pointer" onClick={() => onVendaClick(venda)}>
                                <td className="px-2 py-2">
                                  {formatarDataBrasileira(dataVenda || '')}
                                </td>
                                <td className="px-2 py-2">{nomeCliente}</td>
                                <td className="px-2 py-2 text-right">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(valorTotal) || 0)}
                                </td>
                              </tr>
                            );
                          })}
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
                  <div className="text-center">
                    <p className="text-muted-foreground">Nenhuma forma de pagamento encontrada</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Debug: {vendasParaProcessar.length} vendas processadas
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fonte: {vendasVendedorExternas.length > 0 ? 'vendasExternas' : 'buscaPropria'}
                    </p>
                  </div>
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
                  <div className="text-center">
                    <p className="text-muted-foreground">Nenhuma origem encontrada</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Debug: {vendasParaProcessar.length} vendas processadas
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fonte: {vendasVendedorExternas.length > 0 ? 'vendasExternas' : 'buscaPropria'}
                    </p>
                  </div>
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
                                `${value} clientes`,
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
                              formatter={(value) => [`${value} clientes`, 'Quantidade']}
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
                        <div className="text-right">Clientes</div>
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
                  <div className="text-center">
                    <p className="text-muted-foreground">Nenhum canal encontrado</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Debug: {vendasParaProcessar.length} vendas processadas
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fonte: {vendasVendedorExternas.length > 0 ? 'vendasExternas' : 'buscaPropria'}
                    </p>
                  </div>
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