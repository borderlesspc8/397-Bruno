import { useMemo } from "react";
import { OrigemData, CanalVendaData } from "../types";
import { extrairDadosVenda, extrairComoNosConheceu } from "../utils";

interface UseProcessarDadosAnaliticosProps {
  vendasParaProcessar: any[];
}

export const useProcessarDadosAnaliticos = ({ vendasParaProcessar }: UseProcessarDadosAnaliticosProps) => {
  // Processar dados das origens
  const origensData = useMemo(() => {
    if (!vendasParaProcessar || vendasParaProcessar.length === 0) return [];

    const origensMap = new Map<string, { quantidade: number; valor: number }>();

    vendasParaProcessar.forEach((venda: any) => {
      let origem = venda.como_nos_conheceu || 
                   extrairComoNosConheceu(venda) ||
                   venda.origem || 
                   venda.canal_venda || 
                   venda.metadata?.como_nos_conheceu ||
                   venda.metadata?.origem ||
                   venda.metadata?.origem_lead ||
                   venda.metadata?.como_conheceu ||
                   venda.metadata?.fonte_origem ||
                   venda.metadata?.origem_cliente ||
                   'Não informado';
      
      if (origem && typeof origem === 'string') {
        origem = origem.trim();
        if (origem === '' || origem.toLowerCase() === 'null') {
          origem = 'Não informado';
        }
      } else {
        origem = 'Não informado';
      }

      const { valorTotal: valorVendaStr } = extrairDadosVenda(venda);
      const valor = parseFloat(valorVendaStr || '0');

      if (origensMap.has(origem)) {
        const existente = origensMap.get(origem)!;
        existente.quantidade += 1;
        existente.valor += valor;
      } else {
        origensMap.set(origem, { quantidade: 1, valor });
      }
    });

    const totalVendas = vendasParaProcessar.length;
    const origensProcessadas: OrigemData[] = Array.from(origensMap.entries()).map(([origem, dados]) => ({
      origem,
      quantidade: dados.quantidade,
      percentual: totalVendas > 0 ? dados.quantidade / totalVendas : 0
    }));

    return origensProcessadas.sort((a, b) => b.quantidade - a.quantidade);
  }, [vendasParaProcessar]);

  // Processar dados dos canais
  const canaisData = useMemo(() => {
    if (!vendasParaProcessar || vendasParaProcessar.length === 0) return [];

    const canaisMap = new Map<string, { quantidade: number; valor: number }>();
    
    vendasParaProcessar.forEach((venda: any) => {
      let canal = venda.canal_venda || 
                  venda.metadata?.nome_canal_venda ||
                  venda.metadata?.canal_venda ||
                  venda.origem || 
                  venda.canal || 
                  venda.metadata?.canal ||
                  venda.metadata?.origem_venda ||
                  venda.metadata?.fonte ||
                  venda.metadata?.meio ||
                  'Não informado';
      
      if (canal && typeof canal === 'string') {
        canal = canal.trim();
        if (canal === '' || canal.toLowerCase() === 'null') {
          canal = 'Não informado';
        }
      } else {
        canal = 'Não informado';
      }

      const { valorTotal: valorVendaStr } = extrairDadosVenda(venda);
      const valor = parseFloat(valorVendaStr || '0');

      if (canaisMap.has(canal)) {
        const existente = canaisMap.get(canal)!;
        existente.quantidade += 1;
        existente.valor += valor;
      } else {
        canaisMap.set(canal, { quantidade: 1, valor });
      }
    });

    const totalVendas = vendasParaProcessar.length;
    const canaisProcessados: CanalVendaData[] = Array.from(canaisMap.entries()).map(([canal, dados]) => ({
      canal,
      quantidade: dados.quantidade,
      percentual: totalVendas > 0 ? dados.quantidade / totalVendas : 0
    }));

    return canaisProcessados.sort((a, b) => b.quantidade - a.quantidade);
  }, [vendasParaProcessar]);

  return {
    origensData,
    canaisData
  };
};

