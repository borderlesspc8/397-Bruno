import { useMemo } from "react";
import { Vendedor } from "@/app/_services/betelTecnologia";

type OrdenacaoVendedor = "faturamento" | "vendas" | "ticket";

// Vendedores a serem excluídos apenas no ranking de faturamento
const VENDEDORES_EXCLUIDOS_RANKING = [
  "FERNANDO AUGUSTO LOYO CADETTE FREIRE",
  "Personal Prime MATRIZ"
];

/**
 * Hook personalizado para gerenciar a ordenação e filtragem de vendedores
 * Utiliza memoização para evitar cálculos repetidos desnecessários
 * 
 * @param vendedores Lista completa de vendedores
 * @param ordenacao Critério de ordenação
 * @param limite Número máximo de vendedores a retornar
 * @param isRankingComponent Flag para indicar se está no componente de Ranking de Vendas
 * @returns Lista ordenada e limitada de vendedores
 */
export const useRankingVendedores = (
  vendedores: Vendedor[],
  ordenacao: OrdenacaoVendedor = "faturamento",
  limite: number = 10,
  isRankingComponent: boolean = false
) => {
  // Garantir que vendedores é sempre um array, mesmo se undefined
  const vendedoresSeguro = useMemo(() => vendedores || [], [vendedores]);
  
  // Memoiza a ordenação e filtragem dos vendedores
  const vendedoresOrdenados = useMemo(() => {
    if (!vendedoresSeguro || vendedoresSeguro.length === 0) {
      return [];
    }

    // Cria uma cópia do array para não modificar o original
    let vendedoresFiltrados = [...vendedoresSeguro]
      .filter(v => v); // Remover possíveis entradas undefined/null
    
    // Aplicar filtro adicional apenas no componente de Ranking de Vendas e quando a ordenação for por faturamento
    if (isRankingComponent && ordenacao === "faturamento") {
      vendedoresFiltrados = vendedoresFiltrados.filter(vendedor => {
        // Verificar se o nome do vendedor contém algum dos nomes da lista de exclusão
        return !VENDEDORES_EXCLUIDOS_RANKING.some(nomeExcluido => 
          vendedor.nome.toUpperCase().includes(nomeExcluido.toUpperCase())
        );
      });
    }
    
    return vendedoresFiltrados
      .sort((a, b) => {
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
      })
      .slice(0, limite);
  }, [vendedoresSeguro, ordenacao, limite, isRankingComponent]);

  // Memoiza o cálculo do total conforme a ordenação - com tratamento de erro
  const totalOrdenacao = useMemo(() => {
    if (!vendedoresSeguro || vendedoresSeguro.length === 0) {
      return 0;
    }

    try {
      switch (ordenacao) {
        case "faturamento":
          return vendedoresSeguro.reduce((acc, v) => acc + (v?.faturamento || 0), 0);
        case "vendas":
          return vendedoresSeguro.reduce((acc, v) => acc + (v?.vendas || 0), 0);
        case "ticket":
          // Para ticket médio, calculamos a média dos tickets
          const total = vendedoresSeguro.reduce((acc, v) => acc + (v?.ticketMedio || 0), 0);
          return vendedoresSeguro.length > 0 ? total / vendedoresSeguro.length : 0;
        default:
          return 0;
      }
    } catch (error) {
      console.error("Erro ao calcular total:", error);
      return 0;
    }
  }, [vendedoresSeguro, ordenacao]);

  // Memoiza o título com base na ordenação
  const titulo = useMemo(() => {
    switch (ordenacao) {
      case "faturamento":
        return "Top Vendedores por Faturamento";
      case "vendas":
        return "Top Vendedores por Quantidade";
      case "ticket":
        return "Top Vendedores por Ticket Médio";
      default:
        return "Top Vendedores";
    }
  }, [ordenacao]);

  // Memoiza a descrição com base na ordenação
  const descricao = useMemo(() => {
    switch (ordenacao) {
      case "faturamento":
        return "Ordenado por valor total";
      case "vendas":
        return "Ordenado por quantidade de vendas";
      case "ticket":
        return "Ordenado por ticket médio";
      default:
        return "Ordenado por valor total";
    }
  }, [ordenacao]);

  return {
    vendedoresOrdenados,
    totalOrdenacao,
    titulo,
    descricao
  };
}; 