"use client";

import { useState, useEffect, useRef } from "react";
import { Vendedor } from "@/app/_services/betelTecnologia";
import { VendedorImagensService } from "@/app/_services/vendedorImagens";
import { 
  TrendingUp,
  Users,
  Medal,
  BarChart,
  Trophy,
  ArrowUp,
  Clock,
  ChevronUp,
  ChevronDown,
  Filter,
  BadgePercent,
  CreditCard,
  Sparkles,
  User
} from "lucide-react";
import { formatCurrency } from "@/app/_utils/format";
import { cn } from "@/app/_utils/cn";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/_components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";
import { Button } from "@/app/_components/ui/button";
import { Progress } from "@/app/_components/ui/progress";
import { Badge } from "@/app/_components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/app/_components/ui/dropdown-menu";
import PodiumRanking from "./PodiumRanking";

interface RankingVendedoresProps {
  vendedores: Vendedor[];
  totalVendas?: number;
  periodo?: string;
  onPeriodoChange?: (periodo: string) => void;
  titulo?: string;
  onVendedorClick?: (vendedor: Vendedor) => void;
}

// Novos tipos e constantes para animações
type AnimationState = 'idle' | 'entering' | 'active';

export default function RankingVendedores({
  vendedores,
  totalVendas = 0,
  periodo = "30d",
  onPeriodoChange,
  titulo = "Ranking de Vendedores",
  onVendedorClick
}: RankingVendedoresProps) {
  const [ordenacao, setOrdenacao] = useState<"faturamento" | "vendas" | "ticket">("faturamento");
  const [visualizacao, setVisualizacao] = useState<"podio" | "lista" | "cards">("podio");
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [animacoesCarregadas, setAnimacoesCarregadas] = useState<boolean[]>([]);
  const ultimaVisualizacao = useRef<string>(visualizacao);
  const [imagensVendedores, setImagensVendedores] = useState<Record<string, string>>({});
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Verificar largura da tela
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    
    return () => {
      window.removeEventListener('resize', checkIsDesktop);
    };
  }, []);
  
  // Configurar animações progressivas para os elementos visuais
  useEffect(() => {
    // Reset animation state when visualization changes
    if (ultimaVisualizacao.current !== visualizacao) {
      setAnimationState('entering');
      ultimaVisualizacao.current = visualizacao;
      
      // Sequência de animações
      setTimeout(() => {
        setAnimationState('active');
      }, 100);
    } else if (animationState === 'idle') {
      // Início inicial
      setAnimationState('entering');
      setTimeout(() => {
        setAnimationState('active');
      }, 100);
    }
    
    // Configura animações progressivas para cada item
    const quantidade = (visualizacao === 'cards' || visualizacao === 'lista') 
      ? vendedores.length 
      : Math.min(vendedores.length, 8); // Garantir que pelo menos 8 vendedores sejam animados na visualização "pódio" (ou menos, se houver menos)
    
    const novasAnimacoes = Array(quantidade).fill(false);
    
    // Cria um efeito cascata de carregamento
    for (let i = 0; i < quantidade; i++) {
      setTimeout(() => {
        setAnimacoesCarregadas(prev => {
          const novo = [...prev];
          novo[i] = true;
          return novo;
        });
      }, 150 + (i * 80)); // Delay escalonado para efeito cascata
    }
    
    // Garantir que o ranking completo fique visível após carregamento
    if (visualizacao === 'podio' && vendedores.length > 3) {
      setTimeout(() => {
        const container = document.getElementById('ranking-completo-container');
        if (container) {
          // Garantir que o quarto vendedor fique visível
          const quartoVendedor = container.children[3];
          if (quartoVendedor) {
            setTimeout(() => {
              quartoVendedor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 500);
          } else {
            // Se não houver um quarto vendedor, garantir que o scroll mostre abaixo do terceiro
            container.scrollTop = 100;
          }
        }
      }, 1200);
    }
  }, [visualizacao, vendedores.length]);
  
  // Carregar imagens dos vendedores
  useEffect(() => {
    const carregarImagens = async () => {
      const imagensPromises = vendedores.map(async (vendedor) => {
        const id = vendedor.id;
        if (!id) return null;
        
        try {
          const imageUrl = await VendedorImagensService.buscarImagemVendedor(id);
          return { id, url: imageUrl };
        } catch (error) {
          console.error(`Erro ao carregar imagem para ${vendedor.nome}:`, error);
          return { id, url: '/images/default-avatar.svg' };
        }
      });
      
      const imagens = await Promise.all(imagensPromises);
      const novoMapa: Record<string, string> = {};
      
      imagens.forEach(item => {
        if (item) {
          novoMapa[item.id] = item.url;
        }
      });
      
      setImagensVendedores(novoMapa);
    };
    
    if (vendedores.length > 0) {
      carregarImagens();
    }
  }, [vendedores]);
  
  // Filtra e ordena vendedores com base na ordenação selecionada
  const vendedoresOrdenados = [...vendedores].sort((a, b) => {
    // Verifica se ambos os vendedores não têm vendas/faturamento
    const aVazio = ordenacao === "faturamento" ? (a.faturamento === 0) : 
                  ordenacao === "vendas" ? (a.vendas === 0) : 
                  (a.ticketMedio === 0);
    
    const bVazio = ordenacao === "faturamento" ? (b.faturamento === 0) : 
                  ordenacao === "vendas" ? (b.vendas === 0) : 
                  (b.ticketMedio === 0);
    
    // Se ambos não têm valor, ordenar por nome
    if (aVazio && bVazio) {
      return a.nome.localeCompare(b.nome);
    }
    
    // Se apenas um não tem valor, priorizá-lo por último
    if (aVazio) return 1;
    if (bVazio) return -1;
    
    // Ordenação normal baseada no critério selecionado
    switch (ordenacao) {
      case "faturamento":
        return (b.faturamento || 0) - (a.faturamento || 0);
      case "vendas":
        return (b.vendas || 0) - (a.vendas || 0);
      case "ticket":
        return (b.ticketMedio || 0) - (a.ticketMedio || 0);
      default:
        return (b.faturamento || 0) - (a.faturamento || 0);
    }
  });
  
  // Verificar se existem vendedores no ranking
  console.log(`RankingVendedores: Total de vendedores recebidos: ${vendedores.length}`);
  console.log(`RankingVendedores: Total de vendedores após ordenação: ${vendedoresOrdenados.length}`);
  
  // Log detalhado de todos os vendedores ordenados para diagnóstico
  console.log('RankingVendedores: Lista completa de vendedores ordenados:', 
    vendedoresOrdenados.map((v, i) => `${i+1}. ${v.nome} (${v.vendas} vendas, R$ ${v.faturamento.toFixed(2)})`).join(', ')
  );
  
  // Top 3 para o pódio
  const podio = vendedoresOrdenados.slice(0, 3);
  
  // Determina maior valor para cálculo de percentuais
  const maiorValor = ordenacao === "faturamento" 
    ? Math.max(...vendedoresOrdenados.map(v => v.faturamento || 0))
    : ordenacao === "vendas" 
      ? Math.max(...vendedoresOrdenados.map(v => v.vendas || 0))
      : Math.max(...vendedoresOrdenados.map(v => v.ticketMedio || 0));
  
  // Calcula total para métricas
  const totalFaturamento = vendedoresOrdenados.reduce((acc, v) => acc + (v.faturamento || 0), 0);
  const totalQuantidadeVendas = vendedoresOrdenados.reduce((acc, v) => acc + (v.vendas || 0), 0);
  
  if (!vendedores || vendedores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">{titulo}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground text-center">
            Nenhum dado disponível para o período selecionado
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const handlePeriodoChange = (value: string) => {
    if (value && onPeriodoChange) {
      onPeriodoChange(value);
    }
  };
  
  const getValorVendedor = (vendedor: any) => {
    if (ordenacao === "faturamento") {
      return formatCurrency(vendedor.faturamento || 0);
    } else if (ordenacao === "vendas") {
      return `${vendedor.vendas || 0} venda${vendedor.vendas === 1 ? '' : 's'}`;
    } else {
      return formatCurrency(vendedor.ticketMedio || 0);
    }
  };
  
  const formatarPercentual = (valor: number, total: number) => {
    if (total === 0) return "0";
    return ((valor / total) * 100).toFixed(1);
  };
  
  const getCorPosicao = (posicao: number) => {
    if (posicao === 0) return "bg-gradient-to-br from-yellow-400 to-yellow-600";
    if (posicao === 1) return "bg-gradient-to-br from-gray-300 to-gray-500";
    if (posicao === 2) return "bg-gradient-to-br from-amber-600 to-amber-800";
    return "bg-gradient-to-br from-blue-500 to-indigo-600";
  };
  
  // Obter cor para o badge de posição
  const getCorBadge = (posicao: number) => {
    if (posicao === 0) return "bg-yellow-500 border-yellow-600";
    if (posicao === 1) return "bg-gray-400 border-gray-500";
    if (posicao === 2) return "bg-amber-700 border-amber-800";
    return "bg-indigo-600 border-indigo-700";
  };
  
  // Obter cor baseada no percentual - quanto maior o percentual, mais verde
  const getCorPercentual = (percentual: number) => {
    if (percentual >= 45) return "bg-green-600";
    if (percentual >= 30) return "bg-green-500";
    if (percentual >= 15) return "bg-yellow-500";
    return "bg-blue-500";
  };
  
  // Retorna classe de animação baseada no índice e estado
  const getAnimacaoItem = (index: number) => {
    if (!animacoesCarregadas[index]) {
      return "opacity-0 transform translate-y-4";
    }
    
    return "opacity-100 transform translate-y-0 transition-all duration-500";
  };
  
  // Renderizar medalha com efeito de brilho para primeiros lugares
  const renderizarMedalha = (posicao: number) => {
    if (posicao === 0) {
      return (
        <div className="relative">
          <Medal className="h-5 w-5 text-yellow-500" />
          <span className="absolute -top-1 -right-1">
            <Sparkles className="h-3 w-3 text-yellow-300 animate-pulse" />
          </span>
        </div>
      );
    }
    if (posicao === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (posicao === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-xs font-medium">{posicao + 1}</span>;
  };
  
  const getTendenciaVendedor = (vendedor: any, index: number) => {
    // Aqui você pode implementar lógica real de tendência baseada em histórico
    // Por enquanto, vamos simular baseado na posição para ter resultados consistentes
    const tendencia = index % 3;
    
    if (tendencia === 0) return "subindo";
    if (tendencia === 1) return "descendo";
    return "estável";
  };
  
  // Renderizar tendência (ícone de seta) com animação
  const renderizarTendencia = (tendencia: string) => {
    if (tendencia === "subindo") 
      return <ChevronUp className="h-4 w-4 text-green-500 animate-bounce" style={{animationDuration: '2s'}} />;
    if (tendencia === "descendo") 
      return <ChevronDown className="h-4 w-4 text-red-500 animate-bounce" style={{animationDuration: '2s'}} />;
    return null;
  };

  return (
    <Card className={cn(
      "overflow-hidden border-t-4 border-t-amber-500 transition-all duration-500",
      animationState === 'entering' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
    )}>
      {/* Removida a animação de scroll que destacava automaticamente o quarto lugar */}
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              {titulo}
            </CardTitle>
            <CardDescription className="mt-1">
              Comparativo de desempenho entre vendedores
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ordenar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem 
                    onClick={() => setOrdenacao("faturamento")}
                    className={ordenacao === "faturamento" ? "bg-muted" : ""}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Faturamento</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setOrdenacao("vendas")}
                    className={ordenacao === "vendas" ? "bg-muted" : ""}
                  >
                    <BarChart className="mr-2 h-4 w-4" />
                    <span>Quantidade</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setOrdenacao("ticket")}
                    className={ordenacao === "ticket" ? "bg-muted" : ""}
                  >
                    <BadgePercent className="mr-2 h-4 w-4" />
                    <span>Ticket Médio</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Tabs defaultValue="podio" onValueChange={(v) => setVisualizacao(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="podio" className="h-7 px-2">Pódio</TabsTrigger>
                <TabsTrigger value="lista" className="h-7 px-2">Lista</TabsTrigger>
                <TabsTrigger value="cards" className="h-7 px-2">Cards</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>
              {vendedores.length} Vendedores · Total: {formatCurrency(totalFaturamento)}
            </span>
          </div>
          
          {onPeriodoChange && (
            <div className="flex items-center gap-1 bg-muted/20 rounded-md">
              <Button 
                variant={periodo === "7d" ? "secondary" : "ghost"} 
                size="sm" 
                className="h-6 px-2 text-xs rounded-sm"
                onClick={() => handlePeriodoChange("7d")}
              >
                7d
              </Button>
              <Button 
                variant={periodo === "30d" ? "secondary" : "ghost"} 
                size="sm" 
                className="h-6 px-2 text-xs rounded-sm"
                onClick={() => handlePeriodoChange("30d")}
              >
                30d
              </Button>
              <Button 
                variant={periodo === "90d" ? "secondary" : "ghost"} 
                size="sm" 
                className="h-6 px-2 text-xs rounded-sm"
                onClick={() => handlePeriodoChange("90d")}
              >
                90d
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {visualizacao === "podio" && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Seção do Pódio - Ocupa 100% em mobile e 6/9 em desktop */}
            <div className="w-full lg:w-2/3">
              <div className="flex justify-center items-center w-full">
                <div className="w-full">
                  <PodiumRanking 
                    vendedores={vendedoresOrdenados}
                    ordenacao={ordenacao}
                    onVendedorClick={onVendedorClick}
                  />
                </div>
              </div>
            </div>
            
            {/* Seção de Ranking Completo - 100% em mobile e 3/9 em desktop */}
            <div className="w-full lg:w-1/3 mt-4 lg:mt-0">
              <h3 className="font-medium text-sm mb-4 text-muted-foreground uppercase tracking-wider border-b pb-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span>Ranking Completo</span>
                  {vendedoresOrdenados.length > 3 && (
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-300 animate-pulse">
                      {vendedoresOrdenados.length}
                    </div>
                  )}
                </div>
                <span className="text-xs font-normal">vendedores</span>
              </h3>
              
              <div 
                className="space-y-3 overflow-auto pr-2 scrollbar-thin relative rounded-lg border border-muted bg-card shadow-inner p-3" 
                id="ranking-completo-container"
                style={{ 
                  maxHeight: '520px',
                  minHeight: vendedoresOrdenados.length > 3 ? (
                    isDesktop ? '400px' : '280px'
                  ) : 'auto'
                }}
              >
                {vendedoresOrdenados.map((vendedor, index) => {
                  const valorOrdenacao = ordenacao === "faturamento" 
                    ? vendedor.faturamento 
                    : ordenacao === "vendas" 
                      ? vendedor.vendas 
                      : vendedor.ticketMedio;
                      
                  const percentual = Number(formatarPercentual(
                    valorOrdenacao,
                    ordenacao === "faturamento" 
                      ? totalFaturamento 
                      : ordenacao === "vendas" 
                        ? totalQuantidadeVendas 
                        : totalFaturamento
                  ));
                  
                  const tendencia = getTendenciaVendedor(vendedor, index);
                  
                  return (
                    <div 
                      key={`vendedor-${vendedor.id || index}`}
                      className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors ${
                        onVendedorClick ? 'cursor-pointer' : ''
                      } ${getAnimacaoItem(index)}`}
                      onClick={() => onVendedorClick && onVendedorClick(vendedor)}
                    >
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-white ${getCorBadge(index)} border shadow-sm`}>
                        {index < 3 ? renderizarMedalha(index) : (index + 1)}
                      </div>
                      
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={vendedor?.id ? imagensVendedores[vendedor.id] : '/images/default-avatar.svg'}
                          alt={`Foto de ${vendedor?.nome || 'vendedor'}`}
                        />
                        <AvatarFallback className={`text-white ${getCorPosicao(index)}`}>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="font-medium text-sm truncate">{vendedor.nome}</span>
                            {renderizarTendencia(tendencia)}
                          </div>
                          <div className="flex items-center gap-1 text-right whitespace-nowrap">
                            <span className="text-xs font-medium">{getValorVendedor(vendedor)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center mt-1 gap-2">
                          <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getCorPercentual(percentual)} transition-all duration-1000 ease-out`} 
                              style={{ 
                                width: `${animacoesCarregadas[index] ? percentual : 0}%`,
                                transition: 'width 1.5s cubic-bezier(0.65, 0, 0.35, 1)'
                              }}
                            />
                          </div>
                          <span className="text-xs w-11 text-right">{percentual}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {vendedoresOrdenados.length > 5 && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none flex justify-center items-end pb-2">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-muted-foreground mb-1">
                        +{vendedoresOrdenados.length - 4} vendedores
                      </span>
                      <span className="text-xs text-amber-500 animate-bounce">
                        Role para ver mais
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {visualizacao === "lista" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">Pos.</th>
                  <th className="px-3 py-2 text-left">Vendedor</th>
                  <th className="px-3 py-2 text-right">Vendas</th>
                  <th className="px-3 py-2 text-right">Faturamento</th>
                  <th className="px-3 py-2 text-right">Ticket Médio</th>
                  <th className="px-3 py-2 text-right">% do Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vendedoresOrdenados.map((vendedor, index) => {
                  const valorOrdenacao = ordenacao === "faturamento" 
                    ? vendedor.faturamento 
                    : ordenacao === "vendas" 
                      ? vendedor.vendas 
                      : vendedor.ticketMedio;
                      
                  const percentual = Number(formatarPercentual(
                    valorOrdenacao,
                    ordenacao === "faturamento" 
                      ? totalFaturamento 
                      : ordenacao === "vendas" 
                        ? totalQuantidadeVendas 
                        : totalFaturamento
                  ));
                  
                  return (
                    <tr 
                      key={index} 
                      className={`hover:bg-muted/25 transition-colors ${
                        onVendedorClick ? 'cursor-pointer' : ''
                      } ${getAnimacaoItem(index)}`}
                      onClick={() => onVendedorClick && onVendedorClick(vendedor)}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${getCorBadge(index)} shadow-sm`}>
                            {index < 3 ? renderizarMedalha(index) : (index + 1)}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-medium">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage
                              src={vendedor?.id ? imagensVendedores[vendedor.id] : '/images/default-avatar.svg'}
                              alt={`Foto de ${vendedor?.nome || 'vendedor'}`}
                            />
                            <AvatarFallback className={`text-white ${getCorPosicao(index)}`}>
                              <User className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-1">
                          {vendedor.nome}
                            {renderizarTendencia(getTendenciaVendedor(vendedor, index))}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">{vendedor.vendas}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(vendedor.faturamento)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(vendedor.ticketMedio)}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-16 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getCorPercentual(percentual)} transition-all duration-1000 ease-out`} 
                              style={{ 
                                width: `${animacoesCarregadas[index] ? percentual : 0}%`,
                                transition: 'width 1.5s cubic-bezier(0.65, 0, 0.35, 1)'
                              }}
                            />
                          </div>
                          <span>{percentual}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {visualizacao === "cards" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {vendedoresOrdenados.map((vendedor, index) => {
              const valorOrdenacao = ordenacao === "faturamento" 
                ? vendedor.faturamento 
                : ordenacao === "vendas" 
                  ? vendedor.vendas 
                  : vendedor.ticketMedio;
                  
              const percentual = Number(formatarPercentual(
                valorOrdenacao,
                ordenacao === "faturamento" 
                  ? totalFaturamento 
                  : ordenacao === "vendas" 
                    ? totalQuantidadeVendas 
                    : totalFaturamento
              ));
              
              return (
                <div 
                  key={`vendedor-card-${index}`}
                  className={cn(
                    "relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow",
                    onVendedorClick ? 'cursor-pointer' : '',
                    getAnimacaoItem(index),
                    index < 3 ? "ring-1 ring-offset-2" : "",
                    index === 0 ? "ring-yellow-400" : index === 1 ? "ring-gray-400" : index === 2 ? "ring-amber-700" : ""
                  )}
                  onClick={() => onVendedorClick && onVendedorClick(vendedor)}
                >
                  <div className={`absolute top-0 right-0 w-8 h-8 ${getCorBadge(index)} rounded-bl-lg rounded-tr-lg flex items-center justify-center text-white font-bold shadow-md`}>
                    {index < 3 ? renderizarMedalha(index) : (index + 1)}
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={vendedor?.id ? imagensVendedores[vendedor.id] : '/images/default-avatar.svg'}
                        alt={`Foto de ${vendedor?.nome || 'vendedor'}`}
                      />
                      <AvatarFallback className={`text-white ${getCorPosicao(index)}`}>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h4 className="font-semibold text-sm flex items-center gap-1">
                        {vendedor.nome}
                        {renderizarTendencia(getTendenciaVendedor(vendedor, index))}
                      </h4>
                      <p className="text-muted-foreground text-xs">
                        {vendedor.vendas} venda{vendedor.vendas === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Faturamento</span>
                      <span className="font-medium text-sm">{formatCurrency(vendedor.faturamento)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Ticket Médio</span>
                      <span className="font-medium text-sm">{formatCurrency(vendedor.ticketMedio)}</span>
                    </div>
                    
                    <div className="pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Participação</span>
                        <span>{percentual}%</span>
                      </div>
                      <div className="mt-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getCorPercentual(percentual)} transition-all duration-1000 ease-out`} 
                          style={{ 
                            width: `${animacoesCarregadas[index] ? percentual : 0}%`,
                            transition: 'width 1.5s cubic-bezier(0.65, 0, 0.35, 1)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 