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
            // Usar faturamento ou valor como fallback
            const valorA = (a.faturamento ?? a.valor ?? 0);
            const valorB = (b.faturamento ?? b.valor ?? 0);
            const numA = typeof valorA === 'number' ? valorA : parseFloat(String(valorA)) || 0;
            const numB = typeof valorB === 'number' ? valorB : parseFloat(String(valorB)) || 0;
            return numB - numA;
          case "vendas":
            const vendasA = typeof a.vendas === 'number' ? a.vendas : parseFloat(String(a.vendas)) || 0;
            const vendasB = typeof b.vendas === 'number' ? b.vendas : parseFloat(String(b.vendas)) || 0;
            return vendasB - vendasA;
          case "ticket":
            const ticketA = typeof a.ticketMedio === 'number' ? a.ticketMedio : parseFloat(String(a.ticketMedio)) || 0;
            const ticketB = typeof b.ticketMedio === 'number' ? b.ticketMedio : parseFloat(String(b.ticketMedio)) || 0;
            return ticketB - ticketA;
          default:
            const defaultA = (a.faturamento ?? a.valor ?? 0);
            const defaultB = (b.faturamento ?? b.valor ?? 0);
            const defaultNumA = typeof defaultA === 'number' ? defaultA : parseFloat(String(defaultA)) || 0;
            const defaultNumB = typeof defaultB === 'number' ? defaultB : parseFloat(String(defaultB)) || 0;
            return defaultNumB - defaultNumA;
        }
      })
      .slice(0, limite);
  }, [vendedoresSeguro, ordenacao, limite, filtrarVendedoresEspeciais]);

  // Memoiza os vendedores filtrados (antes da ordenação e limitação) para calcular o total
  const vendedoresFiltradosParaTotal = useMemo(() => {
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
    
    return vendedoresFiltrados;
  }, [vendedoresSeguro, ordenacao, filtrarVendedoresEspeciais]);

  // Memoiza o cálculo do total conforme a ordenação - usando os vendedores filtrados
  const totalOrdenacao = useMemo(() => {
    if (!vendedoresFiltradosParaTotal || vendedoresFiltradosParaTotal.length === 0) {
      return 0;
    }

    try {
      switch (ordenacao) {
        case "faturamento":
          // Usar faturamento ou valor como fallback
          return vendedoresFiltradosParaTotal.reduce((acc, v) => {
            const valor = (v?.faturamento ?? v?.valor ?? 0);
            return acc + (typeof valor === 'number' ? valor : parseFloat(String(valor)) || 0);
          }, 0);
        case "vendas":
          return vendedoresFiltradosParaTotal.reduce((acc, v) => {
            const vendas = (v?.vendas ?? 0);
            return acc + (typeof vendas === 'number' ? vendas : parseFloat(String(vendas)) || 0);
          }, 0);
        case "ticket":
          // Para ticket médio, calculamos a média dos tickets
          const total = vendedoresFiltradosParaTotal.reduce((acc, v) => {
            const ticket = (v?.ticketMedio ?? 0);
            return acc + (typeof ticket === 'number' ? ticket : parseFloat(String(ticket)) || 0);
          }, 0);
          return vendedoresFiltradosParaTotal.length > 0 ? total / vendedoresFiltradosParaTotal.length : 0;
        default:
          return 0;
      }
    } catch (error) {
      console.error("Erro ao calcular total:", error);
      return 0;
    }
  }, [vendedoresFiltradosParaTotal, ordenacao]);

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
