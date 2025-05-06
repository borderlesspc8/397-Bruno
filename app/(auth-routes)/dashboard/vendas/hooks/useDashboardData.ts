import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { format, isEqual } from "date-fns";
import { useToast } from "@/app/_components/ui/use-toast";
import { useRouter } from "next/navigation";

// Tipos
export interface VendaData {
  nome: string;
  faturamento: number;
  vendas: number;
  ticketMedio: number;
}

export interface DashboardData {
  vendedores: VendaData[];
  produtos: {
    id: string;
    nome: string;
    quantidade: number;
    valor: number;
  }[];
  volumeVendas: {
    diario: {
      data: string;
      quantidade: number;
      valor: number;
    }[];
    semanal: {
      semana: string;
      quantidade: number;
      valor: number;
    }[];
  };
  totais: {
    faturamento: number;
    vendas: number;
    ticketMedio: number;
    custo?: number;
    descontos?: number;
    fretes?: number;
    lucro?: number;
  };
}

// Cache para armazenar as respostas da API para cada intervalo de datas
type CacheKey = string;
type CacheData = {
  data: DashboardData;
  timestamp: number;
};

// Tempo de expiração do cache em milissegundos (30 minutos)
const CACHE_EXPIRY_TIME = 30 * 60 * 1000;

// Função para debounce
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function useDashboardData(dateRange: DateRange | undefined) {
  const { toast } = useToast();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  // Cache de dados
  const [dataCache, setDataCache] = useState<Record<CacheKey, CacheData>>({});
  
  // Referência para controle de requisições em andamento
  const fetchingRef = useRef<Record<string, boolean>>({});
  // Referência para armazenar o último intervalo de datas processado
  const lastProcessedDateRange = useRef<string>('');

  // Gerar chave de cache baseada no intervalo de datas
  const generateCacheKey = useCallback((from: Date, to: Date): CacheKey => {
    return `${format(from, 'yyyy-MM-dd')}_${format(to, 'yyyy-MM-dd')}`;
  }, []);

  // Atualizar os parâmetros da URL quando o intervalo de datas mudar
  const atualizarParametrosURL = useCallback((newDateRange: DateRange | undefined) => {
    if (!newDateRange?.from) return;
    
    const dataInicio = format(newDateRange.from, "yyyy-MM-dd");
    const dataFim = newDateRange.to ? format(newDateRange.to, "yyyy-MM-dd") : dataInicio;
    
    // Verificar se a URL já contém esses parâmetros antes de atualizar
    const currentParams = new URLSearchParams(window.location.search);
    const currentDataInicio = currentParams.get("dataInicio");
    const currentDataFim = currentParams.get("dataFim");
    
    if (currentDataInicio === dataInicio && currentDataFim === dataFim) {
      return; // Evitar atualização desnecessária se os parâmetros já são os mesmos
    }
    
    // Criar nova URL com os parâmetros atualizados e não rolar a página
    router.push(`/dashboard/vendas?dataInicio=${dataInicio}&dataFim=${dataFim}`, { scroll: false });
  }, [router]);

  // Função para transformar dados da API no formato esperado pelo dashboard
  const transformApiData = useCallback((data: any): DashboardData => {
    console.log("Transformando dados da API:", data);
    
    // Garantir que todas as propriedades existem para evitar erros
    const vendasPorConsultor = data.vendasPorConsultor || [];
    
    // Log para debug dos dados de vendedores
    console.log("Dados dos vendedores na API:", vendasPorConsultor.map((v: any) => ({
      id: v.id,
      nome: v.nome_vendedor,
      nome_vendedor: v.nome_vendedor,
      valorTotal: v.valorTotal
    })));
    
    // Adaptar formato vendedores conforme resposta da API
    const vendedoresMapeados = vendasPorConsultor.map((item: any) => {
      // Priorizar o uso do nome_vendedor quando disponível
      // Se não estiver disponível, tentar usar o nome. Se ambos indisponíveis, mostrar ID
      const nomeExibicao = item.nome_vendedor || 
                        (item.nome && item.nome !== "Vendedor não encontrado" ? item.nome : 
                        `Vendedor ${item.id || "desconhecido"}`);

      return {
        nome: nomeExibicao,
        faturamento: Number(item.valorTotal || 0),
        vendas: Number(item.quantidadeVendas || 0),
        ticketMedio: item.quantidadeVendas > 0 
          ? Number(item.valorTotal || 0) / Number(item.quantidadeVendas) 
          : 0
      };
    });
    
    // Calcular totais a partir dos vendedores
    const totalFaturamento = parseFloat(vendedoresMapeados.reduce((acc: number, item: any) => 
      acc + item.faturamento, 0).toFixed(2));
    
    const totalVendas = vendedoresMapeados.reduce((acc: number, item: any) => 
      acc + item.vendas, 0);
    
    const ticketMedio = totalVendas > 0 
      ? parseFloat((totalFaturamento / totalVendas).toFixed(2))
      : 0;
    
    // Verificar dados contra o total real da API para garantir consistência
    const apiTotalFaturamento = data.totalValor || data.totalFaturamento;
    const faturamentoFinal = apiTotalFaturamento ? parseFloat(Number(apiTotalFaturamento).toFixed(2)) : totalFaturamento;
    
    console.log(`Faturamento calculado: ${totalFaturamento}, Faturamento da API: ${faturamentoFinal}`);
    
    // Calcular valores adicionais a partir das vendas
    let totalCusto = 0;
    let totalDescontos = 0;
    let totalFretes = 0;
    
    // Processar cada venda para extrair custos, descontos e fretes
    if (data.vendas && Array.isArray(data.vendas)) {
      data.vendas.forEach((venda: any) => {
        // Considerar apenas vendas Concretizada e Em andamento
        if (venda.nome_situacao !== "Concretizada" && venda.nome_situacao !== "Em andamento") {
          return;
        }
        
        // Somar custos
        if (venda.valor_custo) {
          totalCusto += parseFloat(venda.valor_custo);
        }
        
        // Somar descontos
        if (venda.desconto_valor) {
          totalDescontos += parseFloat(venda.desconto_valor);
        }
        
        // Somar fretes
        if (venda.valor_frete) {
          totalFretes += parseFloat(venda.valor_frete);
        }
      });
    }
    
    // Calcular lucro
    const lucroCalculado = faturamentoFinal - totalCusto - totalDescontos + totalFretes;
    
    console.log(`Custos: ${totalCusto}, Descontos: ${totalDescontos}, Fretes: ${totalFretes}, Lucro calculado: ${lucroCalculado}`);
    
    return {
      vendedores: vendedoresMapeados,
      produtos: [],
      volumeVendas: {
        diario: (data.quantidadeVendas?.porDia || []).map((item: any) => ({
          data: item.data || "",
          quantidade: Number(item.quantidade || 0),
          valor: Number(item.valor || 0)
        })),
        semanal: []
      },
      totais: {
        faturamento: faturamentoFinal,
        vendas: totalVendas,
        ticketMedio: ticketMedio,
        custo: totalCusto,
        descontos: totalDescontos,
        fretes: totalFretes,
        lucro: lucroCalculado
      }
    };
  }, []);

  // Buscar dados quando o intervalo de datas mudar
  const fetchDashboardData = useCallback(async () => {
    try {
      if (!dateRange?.from) return;
      
      // Formatando as datas para a API
      const dataInicio = format(dateRange.from, 'yyyy-MM-dd');
      const dataFim = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : dataInicio;
      
      console.log(`Iniciando requisição para período: ${dataInicio} até ${dataFim}`);
      
      // Criar uma chave única para esse intervalo de datas
      const cacheKey = generateCacheKey(dateRange.from, dateRange.to || dateRange.from);
      
      // Verificar se já existe uma requisição em andamento para este intervalo
      if (fetchingRef.current[cacheKey]) {
        console.log(`Já existe uma requisição em andamento para ${dataInicio} a ${dataFim}`);
        return;
      }
      
      // Verificar se este intervalo já foi processado recentemente
      if (lastProcessedDateRange.current === cacheKey) {
        console.log(`Intervalo ${dataInicio} a ${dataFim} já foi processado recentemente`);
        return;
      }
      
      // Verificar se os dados estão em cache e se ainda são válidos
      const cachedData = dataCache[cacheKey];
      const now = Date.now();
      
      if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRY_TIME)) {
        console.log(`Usando dados em cache para o período: ${dataInicio} a ${dataFim}`);
        setDashboardData(cachedData.data);
        lastProcessedDateRange.current = cacheKey;
        return;
      }
      
      // Marcar que estamos buscando dados para este intervalo
      fetchingRef.current[cacheKey] = true;
      
      // Dados não estão em cache ou estão expirados, buscar da API
      console.log(`Buscando dados para o período: ${dataInicio} a ${dataFim}`);
      
      // Só definir isLoading como true se realmente precisarmos fazer a requisição
      setIsLoading(true);
      
      const controller = new AbortController();
      const signal = controller.signal;
      
      const response = await fetch(
        `/api/dashboard/vendas?dataInicio=${dataInicio}&dataFim=${dataFim}`,
        { 
          signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          cache: 'no-store',
          credentials: 'include'
        }
      );
      
      console.log(`Resposta da API: status ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao processar resposta do servidor' }));
        
        // Tratar o caso específico de dados vazios
        if (response.status === 404 && errorData.error?.includes("Nenhum dado de vendas encontrado")) {
          // Configurar estado para mostrar mensagem de dados vazios, mas não como erro
          setDashboardData({
            vendedores: [],
            produtos: [],
            volumeVendas: {
              diario: [],
              semanal: []
            },
            totais: {
              faturamento: 0,
              vendas: 0,
              ticketMedio: 0
            }
          });
          setApiError(null);
          return;
        }
        
        throw new Error(errorData.error || 'Erro ao carregar dados do dashboard');
      }
      
      const data = await response.json();
      console.log("Dados recebidos da API:", data);
      
      // Transformar os dados
      const dashboardData = transformApiData(data);
      
      // Salvar no cache
      setDataCache(prevCache => ({
        ...prevCache,
        [cacheKey]: {
          data: dashboardData,
          timestamp: now
        }
      }));
      
      // Atualizar o estado com os dados
      setDashboardData(dashboardData);
      
      // Marcar este intervalo como processado
      lastProcessedDateRange.current = cacheKey;
      
      // Verificar se a URL precisa ser atualizada (comparando com os parâmetros atuais)
      const currentParams = new URLSearchParams(window.location.search);
      const currentDataInicio = currentParams.get("dataInicio");
      const currentDataFim = currentParams.get("dataFim");
      
      if (currentDataInicio !== dataInicio || currentDataFim !== dataFim) {
        atualizarParametrosURL(dateRange);
      }
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao buscar dados:', error);
        toast({
          title: "Erro",
          description: error.message || "Não foi possível carregar os dados do dashboard",
          variant: "destructive",
        });
        setApiError(error.message || "Erro ao carregar dados");
      }
    } finally {
      // Formatando as datas para a API para liberar a referência
      if (dateRange?.from) {
        const dataInicio = format(dateRange.from, 'yyyy-MM-dd');
        const dataFim = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : dataInicio;
        const cacheKey = generateCacheKey(
          dateRange.from, 
          dateRange.to || dateRange.from
        );
        
        // Remover a marcação de requisição em andamento
        fetchingRef.current[cacheKey] = false;
      }
      setIsLoading(false);
    }
  }, [dateRange, dataCache, generateCacheKey, toast, transformApiData, atualizarParametrosURL]);

  // Versão com debounce da função de busca para evitar múltiplas chamadas em rápida sucessão
  const debouncedFetchData = useMemo(
    () => debounce(fetchDashboardData, 300), 
    [fetchDashboardData]
  );

  // Usar useEffect com verificação para evitar requisições duplicadas
  useEffect(() => {
    if (!dateRange?.from) return;
    
    // Criar uma chave única para esse intervalo de datas para log
    const currentDateRangeKey = dateRange?.from && dateRange?.to 
      ? `${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}`
      : dateRange?.from 
        ? `${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.from, 'yyyy-MM-dd')}`
        : '';
    
    if (!currentDateRangeKey) return;
    
    console.log(`Preparando requisição para o período: ${currentDateRangeKey}`);
    
    // Executar a busca com debounce para evitar múltiplas chamadas em sequência
    debouncedFetchData();
    
  }, [dateRange, debouncedFetchData]);

  return {
    isLoading,
    dashboardData,
    apiError,
    atualizarParametrosURL
  };
} 