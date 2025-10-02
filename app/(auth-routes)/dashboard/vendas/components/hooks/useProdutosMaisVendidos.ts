import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/app/_hooks/useAuth";

// Tipos
export type OrdenacaoTipo = "quantidade" | "valor" | "margem";
export type VisualizacaoTipo = "grafico" | "tabela";

export interface ProdutoItem {
  id: string;
  nome: string;
  quantidade: number;
  valor: number;
  valorUnitario: number;
  margem: number;
  margemPercentual: number;
}


// Cache para reduzir requisições desnecessárias
// const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
// const produtosCache = new Map<string, { data: any, timestamp: number }>();

interface UseProdutosMaisVendidosProps {
  dataInicio: Date;
  dataFim: Date;
}

export const useProdutosMaisVendidos = ({ dataInicio, dataFim }: UseProdutosMaisVendidosProps) => {
  const { user } = useAuth();
  const userEmail = user?.email;

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

        // Ajustar as datas para considerar o fuso horário local
        const dataInicioAjustada = new Date(dataInicio);
        dataInicioAjustada.setHours(0, 0, 0, 0);
        
        const dataFimAjustada = new Date(dataFim);
        dataFimAjustada.setHours(23, 59, 59, 999);
        
        // Formatar datas no formato YYYY-MM-DD
        const dataInicioFormatada = dataInicioAjustada.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
        const dataFimFormatada = dataFimAjustada.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
        
        // Verificar cache antes de fazer a requisição
        // const cacheKey = getCacheKey(dataInicioAjustada, dataFimAjustada, userEmail);
        // const cacheEntry = produtosCache.get(cacheKey);
        // const now = Date.now();
        
        // Se temos dados em cache e eles ainda são válidos, usá-los
        // if (cacheEntry && now - cacheEntry.timestamp < CACHE_TTL) { ... }

        console.log(`Buscando produtos de ${dataInicioFormatada} até ${dataFimFormatada}`);

        const response = await axios.get(`/api/gestao-click/produtos-mais-vendidos`, {
          params: {
            userEmail,
            dataInicio: dataInicioFormatada,
            dataFim: dataFimFormatada
          }
        });
        
        if (response.data) {
          // A nova API já retorna as categorias separadas
          setEquipamentos(response.data.equipamentos || []);
          setAcessorios(response.data.acessorios || []);
          setAcessoriosEspeciais(response.data.acessoriosEspeciais || []);
          setAcessoriosSextavados(response.data.acessoriosSextavados || []);
          setAcessoriosEmborrachados(response.data.acessoriosEmborrachados || []);
          
          // Manter compatibilidade com o código existente
          const todosProdutos = [
            ...(response.data.equipamentos || []),
            ...(response.data.acessorios || []),
            ...(response.data.acessoriosEspeciais || []),
            ...(response.data.acessoriosSextavados || []),
            ...(response.data.acessoriosEmborrachados || [])
          ];
          setProdutos(todosProdutos);
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
  }, [dataInicio, dataFim, userEmail, getCacheKey]);
  
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
      acessorios: ordenarProdutos(acessorios, ordenacao),
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