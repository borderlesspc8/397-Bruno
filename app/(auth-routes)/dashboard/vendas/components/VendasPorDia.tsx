import { useState, useEffect, useMemo } from 'react';
import { format, eachDayOfInterval, isSameDay, isToday, isYesterday, parseISO, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CalendarDays, 
  ChevronRight, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown,
  Coins
} from 'lucide-react';
import { formatCurrency } from '@/app/_utils/format';

interface VendasPorDiaProps {
  dataInicio: Date;
  dataFim: Date;
  onDiaClick?: (data: string, vendas: any[]) => void;
}

interface VendaDiaria {
  data: string;
  totalVendas: number;
  totalValor: number;
  vendas?: any[];
}

export function VendasPorDia({ dataInicio, dataFim, onDiaClick }: VendasPorDiaProps) {
  const [vendasPorDia, setVendasPorDia] = useState<VendaDiaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Garantir que o componente só renderize no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Buscar dados das vendas por dia - REATIVADO COM PROTEÇÃO CONTRA LOOPS
  useEffect(() => {
    if (!isMounted) return;
    
    const buscarVendasPorDia = async () => {
      setLoading(true);
      setErro(null);

      try {
        const response = await fetch(`/api/dashboard/vendas/diario?dataInicio=${dataInicio.toISOString()}&dataFim=${dataFim.toISOString()}`);
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.erro) {
          setErro(data.erro);
          setVendasPorDia([]);
        } else {
          setVendasPorDia(data.vendasPorDia || []);
        }
      } catch (error) {
        console.error('Erro ao buscar vendas por dia:', error);
        setErro(error instanceof Error ? error.message : 'Erro desconhecido ao buscar dados');
        setVendasPorDia([]);
      } finally {
        setLoading(false);
      }
    };

    buscarVendasPorDia();
  }, [dataInicio, dataFim, isMounted]);

  // Preparar dados para exibição
  const dadosFormatados = useMemo(() => {
    // Criar array com todos os dias do intervalo
    const diasIntervalo = eachDayOfInterval({ start: dataInicio, end: dataFim });
    
    // Data atual para filtrar datas futuras
    const hoje = new Date();
    
    // Mapear os valores de vendas para cada dia do intervalo
    return diasIntervalo
      .filter(dia => !isFuture(dia)) // Filtrar datas futuras
      .map(dia => {
        // Buscar os dados deste dia nos dados recebidos da API
        const dadosDia = vendasPorDia.find(venda => {
          const dataVenda = parseISO(venda.data);
          return isSameDay(dataVenda, dia);
        });
        
        // Calcular variação percentual em relação à média diária
        let variacao = 0;
        if (vendasPorDia.length > 0) {
          const mediaValorDiario = vendasPorDia.reduce((acc, curr) => acc + curr.totalValor, 0) / vendasPorDia.length;
          if (mediaValorDiario > 0) {
            variacao = ((dadosDia?.totalValor || 0) / mediaValorDiario - 1) * 100;
          }
        }
        
        // Determinar nome formatado do dia (Hoje, Ontem, ou data normal)
        let nomeDia = '';
        if (isToday(dia)) {
          nomeDia = 'Hoje';
        } else if (isYesterday(dia)) {
          nomeDia = 'Ontem';
        } else {
          nomeDia = format(dia, "EEE, dd 'de' MMM", { locale: ptBR });
          // Capitalizar primeira letra
          nomeDia = nomeDia.charAt(0).toUpperCase() + nomeDia.slice(1);
        }
        
        return {
          data: format(dia, 'yyyy-MM-dd'),
          dataFormatada: format(dia, 'dd/MM', { locale: ptBR }),
          nomeDia,
          totalVendas: dadosDia?.totalVendas || 0,
          totalValor: dadosDia?.totalValor || 0,
          variacao,
          vendas: dadosDia?.vendas || []
        };
      }).sort((a, b) => {
        // Ordenar em ordem crescente de data (mais antiga primeiro)
        return new Date(a.data).getTime() - new Date(b.data).getTime();
      });
  }, [vendasPorDia, dataInicio, dataFim]);

  // Calcular total de vendas e valor para o período
  const totais = useMemo(() => {
    const totalVendas = vendasPorDia.reduce((acc, curr) => acc + curr.totalVendas, 0);
    const totalValor = vendasPorDia.reduce((acc, curr) => acc + curr.totalValor, 0);
    return { totalVendas, totalValor };
  }, [vendasPorDia]);

  if (!isMounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#faba33] mx-auto mb-4" 
               role="progressbar" 
               aria-label="Carregando dados de vendas por dia"/>
          <p className="text-muted-foreground">Carregando vendas diárias...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex items-center justify-center h-[200px] text-red-500">
        <p>{erro}</p>
      </div>
    );
  }

  if (dadosFormatados.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <p className="text-muted-foreground">Nenhuma venda encontrada no período selecionado</p>
      </div>
    );
  }

  return (
    <div className="mt-2 pb-2">
      <div className="flex items-center justify-between mb-3 text-sm font-medium text-gray-400 border-b border-gray-700 pb-2">
        <div>Vendas por Dia</div>
        <div>Valor</div>
      </div>

      <div className="space-y-3">
        {dadosFormatados.map((dia, index) => {
          // Definir cores baseadas nos valores
          let bgColor = "bg-gray-800/50";
          
          // Estilo para variação (positiva ou negativa)
          const variacaoStyle = dia.variacao >= 0 
            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" 
            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
          
          return (
            <div 
              key={dia.data} 
              className="relative cursor-pointer" 
              onClick={() => onDiaClick && onDiaClick(dia.data, dia.vendas)}
            >
              {/* Card do item */}
              <div className={`rounded-lg ${bgColor} relative overflow-hidden py-3`}>
                {/* Conteúdo */}
                <div className="flex items-center relative z-10 px-3 pr-6">
                  {/* Ícone de calendário */}
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 text-gray-800 mr-3">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  
                  {/* Informações do dia */}
                  <div className="flex-1 flex flex-col">
                    <div className="font-medium text-white">{dia.nomeDia}</div>
                    <div className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <span>{dia.totalVendas} {dia.totalVendas === 1 ? 'venda' : 'vendas'}</span>
                      {dia.variacao !== 0 && (
                        <span className={`text-xs rounded-full px-1.5 py-0.5 flex items-center gap-0.5 ${variacaoStyle}`}>
                          {dia.variacao > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {Math.abs(dia.variacao).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Valor em destaque */}
                  <div className="flex items-center">
                    <div className="text-amber-400 font-bold text-lg flex items-center">
                      <Coins className="h-4 w-4 mr-1" />
                      {formatCurrency(dia.totalValor).replace('R$', '')}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 ml-1" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Rodapé com totais */}
      <div className="mt-4 pt-3 border-t border-gray-700/50 text-sm text-gray-400 flex justify-between items-center">
        <div className="flex items-center gap-1">
          <CalendarDays className="h-4 w-4" />
          <span>{dadosFormatados.length} dias</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-4 w-4 text-amber-500" />
          <span>Total: {formatCurrency(totais.totalValor)}</span>
        </div>
      </div>
    </div>
  );
} 