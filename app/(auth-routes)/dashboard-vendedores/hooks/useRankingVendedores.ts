import { useMemo } from "react";
import { Vendedor } from "@/app/_services/betelTecnologia";

type OrdenacaoVendedor = "faturamento" | "vendas" | "ticket";

// Vendedores a serem excluídos apenas no ranking de faturamento
const VENDEDORES_EXCLUIDOS_RANKING = [
  "FERNANDO AUGUSTO LOYO CADETTE FREIRE",
  "FERNANDO LOYO",
  "Personal Prime MATRIZ",
  "ADMINISTRATIVO"
];

/**
 * Hook personalizado para gerenciar a ordenação e filtragem de vendedores
 * Utiliza memoização para evitar cálculos repetidos desnecessários
 * 
 * @param vendedores Lista completa de vendedores
 * @param ordenacao Critério de ordenação
 * @param limite Número máximo de vendedores a retornar
 * @param filtrarVendedoresEspeciais Flag para indicar se os vendedores especiais devem ser filtrados
 * @returns Lista ordenada e limitada de vendedores
 */
export const useRankingVendedores = (
  vendedores: Vendedor[],
  ordenacao: OrdenacaoVendedor = "faturamento",
  limite: number = 10,
  filtrarVendedoresEspeciais: boolean = true
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
    
    // Aplicar filtro adicional quando solicitado E quando a ordenação for por faturamento
    if (filtrarVendedoresEspeciais && ordenacao === "faturamento") {
      vendedoresFiltrados = vendedoresFiltrados.filter(vendedor => {
        // Verificar se o nome do vendedor contém algum dos nomes da lista de exclusão
        return !VENDEDORES_EXCLUIDOS_RANKING.some(nomeExcluido => 
          vendedor.nome?.toUpperCase().includes(nomeExcluido.toUpperCase())
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
  }, [vendedoresSeguro, ordenacao, limite, filtrarVendedoresEspeciais]);

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

  // Memoiza a descrição com base na ordenação e filtragem
  const descricao = useMemo(() => {
    let baseDescription = "";
    switch (ordenacao) {
      case "faturamento":
        baseDescription = "Ordenado por valor total";
        break;
      case "vendas":
        baseDescription = "Ordenado por quantidade de vendas";
        break;
      case "ticket":
        baseDescription = "Ordenado por ticket médio";
        break;
      default:
        baseDescription = "Ordenado por valor total";
    }
    
    return baseDescription;
  }, [ordenacao, filtrarVendedoresEspeciais]);

  return {
    vendedoresOrdenados,
    totalOrdenacao,
    titulo,
    descricao
  };
}; 