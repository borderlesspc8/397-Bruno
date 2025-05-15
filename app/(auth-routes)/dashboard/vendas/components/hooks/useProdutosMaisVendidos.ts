import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

// Tipos
export type OrdenacaoTipo = "quantidade" | "valor" | "margem";
export type VisualizacaoTipo = "grafico" | "tabela";

export interface ProdutoItem {
  id?: string;
  nome: string;
  quantidade: number;
  valor: number;
  custo?: number;
  margem: number;
  margemPercentual: number | string;
  percentual?: number;
  categoria?: string;
}

// Categorias específicas para filtrar acessórios
const CATEGORIAS_ACESSORIOS_ESPECIAIS = [
  "ANILHA", "HALTER", "CABO DE AÇO", "KETTLEBELL", "PAR DE CANELEIRAS"
];

// Cache para reduzir requisições desnecessárias
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const produtosCache = new Map<string, { data: any, timestamp: number }>();

interface UseProdutosMaisVendidosProps {
  dataInicio: Date;
  dataFim: Date;
}

export const useProdutosMaisVendidos = ({ dataInicio, dataFim }: UseProdutosMaisVendidosProps) => {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  const [produtos, setProdutos] = useState<ProdutoItem[]>([]);
  const [equipamentos, setEquipamentos] = useState<ProdutoItem[]>([]);
  const [acessorios, setAcessorios] = useState<ProdutoItem[]>([]);
  const [acessoriosEspeciais, setAcessoriosEspeciais] = useState<ProdutoItem[]>([]);
  const [acessoriosSextavados, setAcessoriosSextavados] = useState<ProdutoItem[]>([]);
  const [acessoriosEmborrachados, setAcessoriosEmborrachados] = useState<ProdutoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoTipo>("quantidade");
  const [visualizacao, setVisualizacao] = useState<VisualizacaoTipo>("grafico");
  
  // Estados para o modal de detalhes do produto
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoItem | null>(null);
  const [vendaModalAberto, setVendaModalAberto] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<any>(null);

  // Gera uma chave de cache com base nos parâmetros da consulta
  const getCacheKey = useCallback((dataInicio: Date, dataFim: Date, userEmail?: string) => {
    return `produtos-vendidos:${dataInicio.toISOString()}-${dataFim.toISOString()}-${userEmail}`;
  }, []);

  // Função para separar os acessórios em categorias específicas
  const separaGrupos = useCallback((acessoriosLista: ProdutoItem[]) => {
    // Filtra acessórios especiais que contêm palavras-chave das categorias
    const especiais = acessoriosLista.filter(a => 
      CATEGORIAS_ACESSORIOS_ESPECIAIS.some(cat => 
        a.nome.toUpperCase().includes(cat)
      )
    );
    
    // Filtra itens sextavados
    const sextavados = acessoriosLista.filter(a => 
      a.nome.toLowerCase().includes("sextavado")
    );
    
    // Filtra itens emborrachados
    const emborrachados = acessoriosLista.filter(a => 
      a.nome.toLowerCase().includes("emborrachado")
    );
    
    // Filtra os demais acessórios (removendo os especiais)
    const demaisAcessorios = acessoriosLista.filter(a => 
      !CATEGORIAS_ACESSORIOS_ESPECIAIS.some(cat => a.nome.toUpperCase().includes(cat)) &&
      !a.nome.toLowerCase().includes("sextavado") &&
      !a.nome.toLowerCase().includes("emborrachado")
    );
    
    return {
      especiais,
      sextavados,
      emborrachados,
      demaisAcessorios
    };
  }, []);

  // Buscar produtos com suporte a cache
  useEffect(() => {
    const buscarProdutos = async () => {
      if (!userEmail) {
        setErro("Usuário não identificado. Faça login novamente.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErro(null);

        const dataInicioFormatada = dataInicio.toISOString().split('T')[0];
        const dataFimFormatada = dataFim.toISOString().split('T')[0];
        
        // Verificar cache antes de fazer a requisição
        const cacheKey = getCacheKey(dataInicio, dataFim, userEmail);
        const cacheEntry = produtosCache.get(cacheKey);
        const now = Date.now();
        
        // Se temos dados em cache e eles ainda são válidos, usá-los
        if (cacheEntry && now - cacheEntry.timestamp < CACHE_TTL) {
          const { data } = cacheEntry;
          const acessoriosLista = data.acessorios || [];
          
          // Classificar acessórios em grupos específicos
          const grupos = separaGrupos(acessoriosLista);
          
          setProdutos(data.produtos || []);
          setEquipamentos(data.equipamentos || []);
          setAcessorios(acessoriosLista);
          setAcessoriosEspeciais(grupos.especiais);
          setAcessoriosSextavados(grupos.sextavados);
          setAcessoriosEmborrachados(grupos.emborrachados);
          setLoading(false);
          return;
        }

        const response = await axios.get(`/api/gestao-click/produtos-mais-vendidos`, {
          params: {
            userEmail,
            dataInicio: dataInicioFormatada,
            dataFim: dataFimFormatada
          }
        });
        
        if (response.data) {
          const acessoriosLista = response.data.acessorios || [];
          
          // Classificar acessórios em grupos específicos
          const grupos = separaGrupos(acessoriosLista);
          
          setProdutos(response.data.produtos || []);
          setEquipamentos(response.data.equipamentos || []);
          setAcessorios(acessoriosLista);
          setAcessoriosEspeciais(grupos.especiais);
          setAcessoriosSextavados(grupos.sextavados);
          setAcessoriosEmborrachados(grupos.emborrachados);
          
          // Armazenar no cache
          produtosCache.set(cacheKey, {
            data: response.data,
            timestamp: now
          });
        } else {
          setErro("Formato de dados inválido");
        }
      } catch (error) {
        console.error("Erro ao buscar produtos mais vendidos:", error);
        setErro(error instanceof Error ? error.message : "Erro ao buscar produtos");
      } finally {
        setLoading(false);
      }
    };

    buscarProdutos();
  }, [dataInicio, dataFim, userEmail, separaGrupos, getCacheKey]);
  
  // Formatação de valores monetários
  const formatarDinheiro = useCallback((valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }, []);

  // Formatação de margem percentual
  const formatarMargem = useCallback((valor: number | string) => {
    if (valor === undefined || valor === null) return "N/A";
    
    // Se for string 'N/A', mantém assim
    if (typeof valor === 'string') return valor;
    
    // Se for número negativo, significa que não há margem calculável
    if (typeof valor === 'number' && valor < 0) return "N/A";
    
    // Formatar como percentual
    return new Intl.NumberFormat('pt-BR', { 
      style: 'percent', 
      minimumFractionDigits: 1, 
      maximumFractionDigits: 1 
    }).format(valor / 100);
  }, []);

  // Memorizar produtos ordenados para evitar reordenações frequentes
  const ordenarProdutos = useCallback((produtos: ProdutoItem[], criterio: OrdenacaoTipo, limite: number = 15) => {
    if (!produtos.length) return [];
    
    return [...produtos]
      .sort((a, b) => {
        switch (criterio) {
          case "quantidade":
            // Critério de desempate: se as quantidades forem iguais, ordena por valor maior
            if (a.quantidade === b.quantidade) {
              return b.valor - a.valor;
            }
            return b.quantidade - a.quantidade;
          case "valor":
            return b.valor - a.valor;
          case "margem":
            // Tratar margens não calculáveis (valor -1)
            const margemA = a.margem ?? 0;
            const margemB = b.margem ?? 0;
            if (margemA < 0) return 1; // Colocar produtos sem margem no final
            if (margemB < 0) return -1;
            return margemB - margemA;
          default:
            // Para ordenação padrão, também aplica o critério de desempate
            if (a.quantidade === b.quantidade) {
              return b.valor - a.valor;
            }
            return b.quantidade - a.quantidade;
        }
      })
      .slice(0, limite);
  }, []);

  // Produtos ordenados memoizados para evitar cálculos desnecessários
  const produtosOrdenados = useMemo(() => {
    return {
      equipamentos: ordenarProdutos(equipamentos, ordenacao),
      acessorios: ordenarProdutos(acessorios.filter(a => 
        !a.nome.toUpperCase().includes("ANILHA") && 
        !a.nome.toUpperCase().includes("HALTER") && 
        !a.nome.toUpperCase().includes("CABO DE AÇO") && 
        !a.nome.toUpperCase().includes("KETTLEBELL") && 
        !a.nome.toUpperCase().includes("PAR DE CANELEIRAS") &&
        !a.nome.toLowerCase().includes("sextavado") &&
        !a.nome.toLowerCase().includes("emborrachado")
      ), ordenacao),
      acessoriosEspeciais: ordenarProdutos(acessoriosEspeciais, ordenacao),
      acessoriosSextavados: ordenarProdutos(acessoriosSextavados, ordenacao),
      acessoriosEmborrachados: ordenarProdutos(acessoriosEmborrachados, ordenacao)
    };
  }, [equipamentos, acessorios, acessoriosEspeciais, acessoriosSextavados, acessoriosEmborrachados, ordenacao, ordenarProdutos]);

  // Funções para manipular estados
  const mudarVisualizacao = useCallback((tipo: VisualizacaoTipo) => {
    setVisualizacao(tipo);
  }, []);
  
  const mudarOrdenacao = useCallback((tipo: OrdenacaoTipo) => {
    setOrdenacao(tipo);
  }, []);
  
  // Função para abrir o modal de detalhes do produto
  const abrirDetalhesProduto = useCallback((produto: ProdutoItem) => {
    // Criar uma cópia para não alterar o objeto original
    const produtoCopy = { ...produto };
    
    // Garantir que temos um ID (podemos substituir por nome se necessário)
    if (!produtoCopy.id) {
      produtoCopy.id = produtoCopy.nome.replace(/\s+/g, '_').toLowerCase();
    }
    
    setProdutoSelecionado(produtoCopy);
    setModalAberto(true);
  }, []);
  
  // Função para abrir o modal de detalhes da venda
  const abrirDetalhesVenda = useCallback((venda: any) => {
    setVendaSelecionada(venda);
    setVendaModalAberto(true);
  }, []);

  return {
    // Estados
    loading,
    erro,
    ordenacao,
    visualizacao,
    modalAberto,
    produtoSelecionado,
    vendaModalAberto,
    vendaSelecionada,
    
    // Dados
    produtos,
    equipamentos,
    acessorios,
    acessoriosEspeciais,
    acessoriosSextavados,
    acessoriosEmborrachados,
    
    // Produtos pré-ordenados para melhor performance
    produtosOrdenados,
    
    // Funções de ordenação
    ordenarProdutos,
    
    // Formatadores
    formatarDinheiro,
    formatarMargem,
    
    // Manipuladores de estado
    setModalAberto,
    setVendaModalAberto,
    mudarVisualizacao,
    mudarOrdenacao,
    abrirDetalhesProduto,
    abrirDetalhesVenda
  };
}; 