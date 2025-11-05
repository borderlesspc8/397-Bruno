import { useState, useEffect, useMemo, useRef } from "react";
import { VendasService } from "@/app/_services/vendas";
import { Vendedor } from "../types";

interface UseVendedorVendasProps {
  vendedor: Vendedor | null;
  aberto: boolean;
  dataInicio: Date;
  dataFim: Date;
  vendasExternas?: any[];
  lastSync?: string;
}

export const useVendedorVendas = ({
  vendedor,
  aberto,
  dataInicio,
  dataFim,
  vendasExternas = [],
  lastSync
}: UseVendedorVendasProps) => {
  const [vendasVendedor, setVendasVendedor] = useState<any[]>([]);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const buscarVendasVendedor = async (vendedorId: string) => {
    if (!vendedorId) return;
    
    try {
      setLoadingVendas(true);
      setErro(null);
      
      const response = await VendasService.buscarVendasPorVendedor({
        dataInicio,
        dataFim,
        vendedorId
      });
      
      if (response.erro) {
        throw new Error(response.erro);
      }
      
      setVendasVendedor(response.vendas || []);
    } catch (error) {
      console.error('❌ [VendedorDetalhesModal] Erro ao buscar vendas do vendedor:', error);
      setErro(error instanceof Error ? error.message : 'Erro ao buscar vendas');
    } finally {
      setLoadingVendas(false);
    }
  };

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
      
      const matchById = vendaVendedorId === vendedorIdNormalizado;
      const matchByNomeExato = vendaNomeVendedor === vendedorNome || vendaVendedorNome === vendedorNome;
      const matchByInclusao = vendaNomeVendedor.includes(vendedorNome) || vendaVendedorNome.includes(vendedorNome);
      
      const vendedorNomeSemAcentos = vendedorNome.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const vendaNomeSemAcentos = vendaNomeVendedor.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const vendaVendedorNomeSemAcentos = vendaVendedorNome.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      const matchSemAcentos = vendaNomeSemAcentos.includes(vendedorNomeSemAcentos) || 
                             vendaVendedorNomeSemAcentos.includes(vendedorNomeSemAcentos);
      
      return matchById || matchByNomeExato || matchByInclusao || matchSemAcentos;
    });

    return vendasFiltradas;
  }, [vendedor, vendasExternas]);

  // Usar vendas externas filtradas como fonte principal, com fallback para vendas da busca própria
  const vendasParaProcessar = useMemo(() => {
    return vendasVendedorExternas.length > 0 ? vendasVendedorExternas : vendasVendedor;
  }, [vendasVendedorExternas, vendasVendedor]);

  useEffect(() => {
    if (aberto && vendedor) {
      if (vendasExternas && vendasExternas.length > 0) {
        return;
      }
      buscarVendasVendedor(vendedor.id);
    } else {
      setVendasVendedor([]);
      setErro(null);
    }
  }, [aberto, vendedor, dataInicio, dataFim, vendasExternas]);

  useEffect(() => {
    if (!aberto || !vendedor) {
      return;
    }

    if (vendasExternas && vendasExternas.length > 0) {
      return;
    }

    if (!vendasVendedor.length && vendedor.id) {
      buscarVendasVendedor(vendedor.id);
    }
  }, [aberto, vendedor, vendasExternas, lastSync]);

  useEffect(() => {
    if (!aberto || !vendedor) {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      return;
    }

    if (vendasExternas && vendasExternas.length > 0) {
      return;
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [aberto, vendedor, dataInicio, dataFim, vendasExternas]);

  return {
    vendasParaProcessar,
    loadingVendas,
    erro,
    vendasVendedorExternas
  };
};

