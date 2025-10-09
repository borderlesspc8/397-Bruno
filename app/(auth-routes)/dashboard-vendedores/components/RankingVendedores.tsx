"use client";

import React, { useState, useEffect, useRef } from "react";
import { Vendedor } from "@/app/_services/betelTecnologia";
import { VendedorImagensService } from "@/app/_services/vendedorImagens";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/_components/ui/tabs";
import { 
  TrendingUp,
  User,
  BarChart, 
  Users,
  Filter,
  BadgePercent,
  CreditCard,
  Sparkles,
  Trophy,
  Medal,
  BarChart3,
  Star,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/app/_lib/formatters";
import { cn } from "@/app/_lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/app/_components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";
import { Button } from "@/app/_components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import PodiumRanking from "./PodiumRanking";
import { motion } from 'framer-motion';

interface RankingVendedoresProps {
  vendedores: Vendedor[];
  titulo?: string;
  onVendedorClick?: (vendedor: Vendedor) => void;
  onPeriodoChange?: (periodo: string) => void;
  periodo?: string;
}

// Estendendo o tipo Vendedor para incluir dados adicionais para visualização
interface VendedorExibicao extends Vendedor {
  percentual: number;
  variacao?: number;
  foto?: string;
}

// Novos tipos e constantes para animações
type AnimationState = 'idle' | 'entering' | 'active';

const getRankColor = (posicao: number): string => {
  switch (posicao) {
    case 0: return "text-amber-500";
    case 1: return "text-slate-400";
    case 2: return "text-amber-800";
    default: return "text-muted-foreground";
  }
};

const getBadgeColor = (posicao: number): string => {
  switch (posicao) {
    case 0: return "bg-amber-500";
    case 1: return "bg-slate-400";
    case 2: return "bg-amber-800";
    default: return "bg-slate-600";
  }
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const getTrendIcon = (variacao?: number) => {
  if (variacao === undefined) return null;
  return variacao >= 0 ? (
    <ArrowUp className="h-3 w-3 text-emerald-500" />
  ) : (
    <ArrowDown className="h-3 w-3 text-rose-500" />
  );
};

export default function RankingVendedores({
  vendedores,
  titulo = "Ranking de Vendedores",
  onVendedorClick,
  onPeriodoChange,
  periodo = "30d"
}: RankingVendedoresProps) {
  const [visualizacao, setVisualizacao] = useState<string>("podio");
  const [ordenacao, setOrdenacao] = useState<string>("faturamento");
  const [vendedoresOrdenados, setVendedoresOrdenados] = useState<VendedorExibicao[]>([]);
  const [imagensVendedores, setImagensVendedores] = useState<Record<number, string>>({});
  const [animationState, setAnimationState] = useState<AnimationState>('entering');
  const [isDesktop, setIsDesktop] = useState(false);
  const [animacoesCarregadas, setAnimacoesCarregadas] = useState<boolean[]>([]);

  // Calcular totais para percentuais
  const totalFaturamento = vendedores.reduce((sum, v) => sum + v.faturamento, 0);
  const totalQuantidadeVendas = vendedores.reduce((sum, v) => sum + v.vendas, 0);

  // Processar vendedores para exibição com dados calculados
  useEffect(() => {
    const ordenados = [...vendedores].map(v => {
      const percentual = Number(((ordenacao === "faturamento" ? v.faturamento : v.vendas) / 
        (ordenacao === "faturamento" ? totalFaturamento : totalQuantidadeVendas) * 100).toFixed(1));
      
      return {
        ...v,
        percentual: isNaN(percentual) ? 0 : percentual,
        // Simulação de variação para exemplo
        variacao: Math.random() > 0.5 ? Math.random() * 10 : -Math.random() * 10
      } as VendedorExibicao;
    });

    // Ordenar conforme critério
    ordenados.sort((a, b) => {
      if (ordenacao === "faturamento") return b.faturamento - a.faturamento;
      if (ordenacao === "vendas") return b.vendas - a.vendas;
      return b.ticketMedio - a.ticketMedio;
    });

    setVendedoresOrdenados(ordenados);
    setAnimacoesCarregadas(Array(ordenados.length).fill(false));
  
    // Carregar as animações progressivamente
    const timer = setTimeout(() => {
      setAnimacoesCarregadas(Array(ordenados.length).fill(true));
    }, 500);

    return () => clearTimeout(timer);
  }, [vendedores, ordenacao, totalFaturamento, totalQuantidadeVendas]);

  // Detectar tamanho da tela para responsividade
  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkIfDesktop();
    window.addEventListener('resize', checkIfDesktop);
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);
  
  // Carregar imagens de vendedores
  useEffect(() => {
    const loadImages = async () => {
      const service = new VendedorImagensService();
      try {
        const imagens = await service.obterImagens(vendedores.map(v => v.id));
        setImagensVendedores(imagens);
        } catch (error) {
        console.error("Erro ao carregar imagens:", error);
      }
    };
    loadImages();
  }, [vendedores]);
  
  // Completar animação após renderizar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationState('active');
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Manipular alteração de período se disponível
  const handlePeriodoChange = (novoPeriodo: string) => {
    if (onPeriodoChange) {
      onPeriodoChange(novoPeriodo);
    };
  };

  // Componente para o pódio
  const RankingPodio = () => {
    // Garantir que temos ao menos 3 vendedores
    const top3 = [...vendedoresOrdenados].slice(0, 3);
    while (top3.length < 3) {
      top3.push({
        id: -(top3.length + 1),
        nome: 'Posição vaga',
        faturamento: 0,
        vendas: 0,
        ticketMedio: 0,
        percentual: 0,
      } as VendedorExibicao);
    }

    // Organizar o pódio com o primeiro colocado no centro
    const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
      <div className="flex flex-col items-center">
        <div className="flex items-end justify-center gap-4 mb-8 mt-4 w-full max-w-4xl mx-auto">
          {podiumOrder.map((vendedor, index) => {
            const posicaoReal = index === 0 ? 1 : index === 1 ? 0 : 2;
            const empty = vendedor.id < 0;
            const alturas = ["h-32", "h-40", "h-28"];
            const cores = ["from-blue-500 to-blue-600", "from-amber-500 to-amber-600", "from-orange-500 to-orange-600"];
            
            return (
              <motion.div
                key={vendedor.id}
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: posicaoReal * 0.1 }}
              >
                <div className="flex flex-col items-center mb-2">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                      {vendedor.foto ? (
                        <AvatarImage src={vendedor.foto} alt={vendedor.nome} />
                      ) : (
                        <AvatarFallback className={cn(
                          "bg-gradient-to-br text-white text-xl font-bold",
                          empty ? "bg-gray-300" : cores[posicaoReal]
                        )}>
                          {empty ? "?" : getInitials(vendedor.nome)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                      getBadgeColor(posicaoReal)
                    )}>
                      {posicaoReal + 1}
        </div>
          </div>
                  <h3 className="mt-3 font-semibold text-center line-clamp-1 max-w-[120px]">
                    {vendedor.nome}
                  </h3>
                  <div className="text-sm font-medium text-primary">
                    {empty ? "-" : formatCurrency(vendedor.faturamento)}
            </div>
                  <div className="text-xs text-muted-foreground">
                    {empty ? "-" : `${vendedor.vendas} vendas`}
        </div>
                </div>
                <div className={cn(
                  "w-24 rounded-t-lg bg-gradient-to-b flex items-center justify-center text-white font-semibold",
                  alturas[posicaoReal],
                  empty ? "bg-gray-200" : cores[posicaoReal]
                )}>
                  {!empty && (
                    <div className="text-center">
                      <div className="text-xl font-bold">{posicaoReal + 1}º</div>
                      <div className="text-xs opacity-80">{vendedor.percentual}%</div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {vendedoresOrdenados.length > 3 && (
          <div className="mt-4 w-full max-w-md mx-auto space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground text-center">
              Demais colocados
            </h4>
            <div className="space-y-1.5">
              {vendedoresOrdenados.slice(3, 6).map((vendedor, index) => (
                    <div 
                  key={vendedor.id}
                  className="flex items-center justify-between p-2 rounded-md border bg-card/50 hover:bg-card/80 transition-colors"
                      onClick={() => onVendedorClick && onVendedorClick(vendedor)}
                  role={onVendedorClick ? "button" : undefined}
                  tabIndex={onVendedorClick ? 0 : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium",
                      getBadgeColor(index + 3)
                    )}>
                      {index + 4}
                      </div>
                    <Avatar className="h-8 w-8">
                      {vendedor.foto ? (
                        <AvatarImage src={vendedor.foto} alt={vendedor.nome} />
                      ) : (
                        <AvatarFallback>
                          {getInitials(vendedor.nome)}
                        </AvatarFallback>
                      )}
                      </Avatar>
                    <div className="font-medium text-sm">{vendedor.nome}</div>
                          </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(vendedor.faturamento)}</div>
                    <div className="text-xs text-muted-foreground">{vendedor.vendas} vendas</div>
                  </div>
              </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Componente para exibição em lista
  const RankingLista = () => {
                  return (
      <div className="space-y-3 px-1 py-2">
        {vendedoresOrdenados.map((vendedor, index) => (
          <motion.div 
            key={vendedor.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className={cn(
              "flex items-center justify-between p-3 rounded-md border transition-all",
              index < 3 ? "bg-card/50 shadow-sm" : "bg-background hover:bg-muted/30",
              onVendedorClick && "cursor-pointer hover:shadow-md"
            )}
                      onClick={() => onVendedorClick && onVendedorClick(vendedor)}
            role={onVendedorClick ? "button" : undefined}
            tabIndex={onVendedorClick ? 0 : undefined}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium",
                getBadgeColor(index)
              )}>
                {index + 1}
                          </div>
              <Avatar className="h-10 w-10 border border-muted">
                {vendedor.foto ? (
                  <AvatarImage src={vendedor.foto} alt={vendedor.nome} />
                ) : (
                  <AvatarFallback>
                    {getInitials(vendedor.nome)}
                            </AvatarFallback>
                )}
                          </Avatar>
              <div>
                <div className="font-medium flex items-center gap-1.5">
                          {vendedor.nome}
                  {index < 3 && (
                    <Medal className={cn("h-3.5 w-3.5", getRankColor(index))} />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{vendedor.percentual}% do total</div>
                          </div>
                        </div>
            <div className="text-right">
              <div className="font-medium flex items-center justify-end gap-1">
                {formatCurrency(vendedor.faturamento)}
                {getTrendIcon(vendedor.variacao)}
              </div>
              <div className="text-xs text-muted-foreground">{vendedor.vendas} vendas</div>
                          </div>
          </motion.div>
        ))}
                        </div>
                  );
  };

  // Componente para exibição em cards
  const RankingCards = () => {
              return (
      <div className="grid grid-cols-1 gap-4 p-1">
        {vendedoresOrdenados.map((vendedor, index) => (
          <motion.div 
            key={vendedor.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => onVendedorClick && onVendedorClick(vendedor)}
                  className={cn(
              "relative rounded-lg border bg-card p-4 transition-all",
              onVendedorClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            )}
            role={onVendedorClick ? "button" : undefined}
            tabIndex={onVendedorClick ? 0 : undefined}
                >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-muted/30">
                  {vendedor.foto ? (
                    <AvatarImage src={vendedor.foto} alt={vendedor.nome} />
                  ) : (
                    <AvatarFallback>
                      {getInitials(vendedor.nome)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="font-medium">{vendedor.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {vendedor.vendas} vendas ({vendedor.percentual}%)
                  </div>
                </div>
              </div>
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold",
                getBadgeColor(index)
              )}>
                {index + 1}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Faturamento</span>
                <span className="text-lg font-bold">{formatCurrency(vendedor.faturamento)}</span>
                    </div>
                    
              <div className="w-full bg-muted/30 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full",
                    index === 0 ? "bg-amber-500" : 
                    index === 1 ? "bg-slate-400" : 
                    index === 2 ? "bg-amber-800" : 
                    "bg-primary/60"
                  )}
                  style={{ width: `${Math.max(vendedor.percentual, 5)}%` }}
                        />
                      </div>
                    </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-amber-500" />
              {titulo}
            </CardTitle>
            <CardDescription>
              Comparativo de desempenho entre vendedores
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => setOrdenacao(ordenacao === "faturamento" ? "vendas" : "faturamento")}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Ordenar por {ordenacao === "faturamento" ? "Vendas" : "Valor"}
            </Button>
            
            <Tabs defaultValue={visualizacao} onValueChange={(v) => setVisualizacao(v)}>
              <TabsList className="grid w-[180px] grid-cols-3">
                <TabsTrigger value="lista" className="text-xs">Lista</TabsTrigger>
                <TabsTrigger value="podio" className="text-xs">Pódio</TabsTrigger>
                <TabsTrigger value="cards" className="text-xs">Cards</TabsTrigger>
              </TabsList>
            </Tabs>
                  </div>
                </div>
      </CardHeader>
      
      <CardContent className="pt-1">
        {vendedoresOrdenados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mb-4 opacity-20" />
            <p>Nenhum vendedor encontrado no período</p>
          </div>
        ) : (
          <div>
            {visualizacao === 'lista' && <RankingLista />}
            {visualizacao === 'podio' && <RankingPodio />}
            {visualizacao === 'cards' && <RankingCards />}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between py-3 text-xs text-muted-foreground border-t">
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          <span>{vendedoresOrdenados.length} vendedores</span>
        </div>
        <div>
          Total: {formatCurrency(vendedoresOrdenados.reduce((acc, v) => acc + v.faturamento, 0))}
        </div>
      </CardFooter>
    </Card>
  );
} 