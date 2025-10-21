/**
 * API: DRE por Competência - Dashboard CEO
 * 
 * Implementação rigorosa seguindo princípios contábeis:
 * - Receita Bruta
 * - (-) Deduções (Impostos sobre vendas, Descontos, Devoluções)
 * - (=) Receita Líquida
 * - (-) CMV
 * - (=) Lucro Bruto
 * - (-) Despesas Operacionais
 * - (=) EBIT
 * - (+/-) Resultado Financeiro
 * - (=) LAIR
 * - (-) IR/CSLL
 * - (=) Lucro Líquido
 */

import { NextRequest, NextResponse } from 'next/server';
import { format, subDays, differenceInDays } from 'date-fns';
import { CEOGestaoClickService } from '../_lib/gestao-click-service';
import {
  classificarPlanoContas,
  isImpostoVenda,
  isDespesaOperacional,
  isResultadoFinanceiro,
  isImpostoRenda,
  ClassificacaoPlanoContas,
  type PagamentoClassificado
} from '../_lib/plano-contas-mapper';

export const dynamic = "force-dynamic";

interface DRECompetencia {
  // Receita
  receitaBruta: number;
  deducoes: {
    impostosVendas: number;
    descontos: number;
    devolucoes: number;
    total: number;
  };
  receitaLiquida: number;
  
  // Custos e Lucro Bruto
  cmv: number;
  lucroBruto: number;
  
  // Despesas Operacionais
  despesasOperacionais: {
    administrativa: number;
    comercial: number;
    marketing: number;
    logistica: number;
    ti: number;
    rh: number;
    total: number;
  };
  
  // EBIT
  ebit: number;
  
  // Resultado Financeiro
  resultadoFinanceiro: {
    receitasFinanceiras: number;
    despesasFinanceiras: number;
    total: number;
  };
  
  // LAIR
  lair: number;
  
  // IR/CSLL
  irCSLL: number;
  
  // Lucro Líquido
  lucroLiquido: number;
  
  // Margens
  margens: {
    bruta: number;      // Lucro Bruto / Receita Líquida
    operacional: number; // EBIT / Receita Líquida
    liquida: number;    // Lucro Líquido / Receita Líquida
  };
  
  // Comparação com período anterior
  comparacao?: {
    receitaLiquidaAnterior: number;
    lucroLiquidoAnterior: number;
    variacaoReceita: number;
    variacaoLucro: number;
  };
  
  // Qualidade dos dados
  qualidade: 'real' | 'parcial' | 'estimado';
  observacoes: string[];
  
  // Metadados
  periodo: {
    inicio: string;
    fim: string;
    dias: number;
  };
  lastUpdated: string;
  fonte: {
    vendas: boolean;
    pagamentos: boolean;
    planosContas: boolean;
  };
}

/**
 * Converte valor monetário brasileiro para número
 */
function parseValorMonetario(valor: any): number {
  if (typeof valor === 'number') return valor;
  if (!valor) return 0;
  
  const valorStr = String(valor)
    .replace(/[^\d,.-]/g, '')  // Remove tudo exceto números, vírgula, ponto e menos
    .replace('.', '')           // Remove separador de milhar
    .replace(',', '.');         // Converte vírgula decimal para ponto
  
  const numero = parseFloat(valorStr);
  return isNaN(numero) ? 0 : numero;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { erro: 'Parâmetros startDate e endDate são obrigatórios' },
        { status: 400 }
      );
    }

    const dataInicio = new Date(startDate);
    const dataFim = new Date(endDate);
    const numeroDias = differenceInDays(dataFim, dataInicio) + 1;

    console.log(`[CEO DRE] Calculando DRE por competência: ${format(dataInicio, 'dd/MM/yyyy')} a ${format(dataFim, 'dd/MM/yyyy')} (${numeroDias} dias)`);

    const observacoes: string[] = [];
    let qualidade: 'real' | 'parcial' | 'estimado' = 'real';

    // =========================================================================
    // 1) BUSCAR DADOS DO PERÍODO ATUAL
    // =========================================================================
    
    const [vendasResult, pagamentosResult, planosContasResult] = await Promise.allSettled([
      CEOGestaoClickService.getVendas(
        format(dataInicio, 'yyyy-MM-dd'),
        format(dataFim, 'yyyy-MM-dd'),
        { todasLojas: true }
      ),
      CEOGestaoClickService.getPagamentos(
        format(dataInicio, 'yyyy-MM-dd'),
        format(dataFim, 'yyyy-MM-dd')
      ),
      CEOGestaoClickService.getPlanosContas()
    ]);

    const vendas = vendasResult.status === 'fulfilled' ? vendasResult.value : [];
    const pagamentos = pagamentosResult.status === 'fulfilled' ? pagamentosResult.value : [];
    const planosContas = planosContasResult.status === 'fulfilled' ? planosContasResult.value : [];

    const fontesDisponiveis = {
      vendas: vendasResult.status === 'fulfilled' && vendas.length > 0,
      pagamentos: pagamentosResult.status === 'fulfilled' && pagamentos.length > 0,
      planosContas: planosContasResult.status === 'fulfilled' && planosContas.length > 0
    };

    if (!fontesDisponiveis.vendas) {
      observacoes.push('Vendas: Nenhuma venda encontrada no período');
      qualidade = 'estimado';
    }

    // =========================================================================
    // 2) FILTRAR VENDAS POR COMPETÊNCIA (STATUS FATURADA/EMITIDA)
    // =========================================================================
    
    const vendasFaturadas = vendas.filter(venda => {
      // Aceitar status que indicam venda concretizada
      const statusValidos = ['faturada', 'emitida', 'concluída', 'finalizada', 'pago', 'recebido'];
      const status = (venda.situacao || '').toLowerCase();
      return statusValidos.some(s => status.includes(s));
    });

    console.log(`[CEO DRE] ${vendasFaturadas.length} vendas faturadas de ${vendas.length} vendas totais`);

    // =========================================================================
    // 3) CALCULAR RECEITA BRUTA
    // =========================================================================
    
    const receitaBruta = vendasFaturadas.reduce((acc, venda) => {
      return acc + parseValorMonetario(venda.valor_total);
    }, 0);

    // =========================================================================
    // 4) CALCULAR DEDUÇÕES
    // =========================================================================
    
    // 4.1) Impostos sobre vendas (dos campos da venda OU de pagamentos)
    let impostosVendas = 0;
    let impostosVendasFonte = 'campos_venda';
    
    // Tentar obter dos campos da venda primeiro
    const camposImpostosVenda = ['icms', 'pis', 'cofins', 'iss', 'imposto'];
    for (const venda of vendasFaturadas) {
      for (const campo of camposImpostosVenda) {
        if ((venda as any)[campo]) {
          impostosVendas += parseValorMonetario((venda as any)[campo]);
        }
      }
    }
    
    // Se não encontrou nos campos, buscar em pagamentos
    if (impostosVendas === 0 && fontesDisponiveis.pagamentos) {
      const pagamentosClassificados = pagamentos.map(pag => ({
        id: pag.id || '',
        valor: parseValorMonetario(pag.valor_pago || pag.valor),
        descricao: pag.descricao || '',
        planoConta: pag.plano_conta_nome || pag.plano_conta || '',
        classificacao: classificarPlanoContas(pag.plano_conta_nome || pag.plano_conta || ''),
        data: pag.data_pagamento || pag.data || ''
      }));
      
      impostosVendas = pagamentosClassificados
        .filter(pag => isImpostoVenda(pag.classificacao))
        .reduce((acc, pag) => acc + pag.valor, 0);
      
      impostosVendasFonte = 'pagamentos';
    }
    
    if (impostosVendas === 0) {
      // Estimativa: 10% da receita bruta (média Brasil)
      impostosVendas = receitaBruta * 0.10;
      observacoes.push('Impostos sobre vendas: Estimado em 10% da receita bruta (campos não disponíveis)');
      qualidade = 'parcial';
    } else {
      observacoes.push(`Impostos sobre vendas: Obtido de ${impostosVendasFonte}`);
    }

    // 4.2) Descontos
    const descontos = vendasFaturadas.reduce((acc, venda) => {
      return acc + parseValorMonetario(venda.desconto || venda.desconto_total || 0);
    }, 0);

    // 4.3) Devoluções
    const devolucoes = vendasFaturadas.reduce((acc, venda) => {
      return acc + parseValorMonetario(venda.valor_devolvido || 0);
    }, 0);

    const deducoesTotal = impostosVendas + descontos + devolucoes;

    // =========================================================================
    // 5) CALCULAR RECEITA LÍQUIDA
    // =========================================================================
    
    const receitaLiquida = receitaBruta - deducoesTotal;

    // =========================================================================
    // 6) CALCULAR CMV (Custo das Mercadorias Vendidas)
    // =========================================================================
    
    let cmv = 0;
    let cmvFonte = 'itens';
    
    for (const venda of vendasFaturadas) {
      if (venda.itens && Array.isArray(venda.itens) && venda.itens.length > 0) {
        // Usar itens detalhados
        const custoVenda = venda.itens.reduce((itemSum, item) => {
          const quantidade = parseValorMonetario(item.quantidade);
          const valorCusto = parseValorMonetario(item.valor_custo);
          return itemSum + (quantidade * valorCusto);
        }, 0);
        cmv += custoVenda;
      } else if (venda.valor_custo) {
        // Fallback: usar valor_custo da venda
        cmv += parseValorMonetario(venda.valor_custo);
        cmvFonte = 'valor_custo_venda';
      }
    }
    
    if (cmv === 0 && receitaLiquida > 0) {
      // Estimativa: 40% da receita líquida (margem bruta típica de 60%)
      cmv = receitaLiquida * 0.40;
      observacoes.push('CMV: Estimado em 40% da receita líquida (custos não disponíveis)');
      qualidade = 'estimado';
    } else if (cmvFonte === 'valor_custo_venda') {
      observacoes.push('CMV: Calculado a partir do campo valor_custo das vendas');
    } else {
      observacoes.push('CMV: Calculado a partir dos itens das vendas (quantidade × valor_custo)');
    }

    // =========================================================================
    // 7) CALCULAR LUCRO BRUTO
    // =========================================================================
    
    const lucroBruto = receitaLiquida - cmv;

    // =========================================================================
    // 8) CLASSIFICAR E SOMAR DESPESAS OPERACIONAIS
    // =========================================================================
    
    const despesasOp = {
      administrativa: 0,
      comercial: 0,
      marketing: 0,
      logistica: 0,
      ti: 0,
      rh: 0,
      total: 0
    };
    
    if (fontesDisponiveis.pagamentos) {
      const pagamentosClassificados = pagamentos.map(pag => ({
        id: pag.id || '',
        valor: parseValorMonetario(pag.valor_pago || pag.valor),
        descricao: pag.descricao || '',
        planoConta: pag.plano_conta_nome || pag.plano_conta || '',
        classificacao: classificarPlanoContas(pag.plano_conta_nome || pag.plano_conta || ''),
        data: pag.data_pagamento || pag.data || ''
      }));
      
      for (const pag of pagamentosClassificados) {
        if (!isDespesaOperacional(pag.classificacao)) continue;
        
        switch (pag.classificacao) {
          case ClassificacaoPlanoContas.DESPESA_ADMINISTRATIVA:
            despesasOp.administrativa += pag.valor;
            break;
          case ClassificacaoPlanoContas.DESPESA_COMERCIAL:
            despesasOp.comercial += pag.valor;
            break;
          case ClassificacaoPlanoContas.DESPESA_MARKETING:
            despesasOp.marketing += pag.valor;
            break;
          case ClassificacaoPlanoContas.DESPESA_LOGISTICA:
            despesasOp.logistica += pag.valor;
            break;
          case ClassificacaoPlanoContas.DESPESA_TI:
            despesasOp.ti += pag.valor;
            break;
          case ClassificacaoPlanoContas.DESPESA_RH:
            despesasOp.rh += pag.valor;
            break;
        }
      }
      
      despesasOp.total = Object.values(despesasOp).reduce((acc, val) => 
        typeof val === 'number' ? acc + val : acc, 0
      );
      
      observacoes.push('Despesas operacionais: Classificadas por plano de contas');
    } else {
      // Estimativa: 20% da receita líquida
      despesasOp.total = receitaLiquida * 0.20;
      observacoes.push('Despesas operacionais: Estimado em 20% da receita líquida (pagamentos não disponíveis)');
      qualidade = 'estimado';
    }

    // =========================================================================
    // 9) CALCULAR EBIT
    // =========================================================================
    
    const ebit = lucroBruto - despesasOp.total;

    // =========================================================================
    // 10) CALCULAR RESULTADO FINANCEIRO
    // =========================================================================
    
    let receitasFinanceiras = 0;
    let despesasFinanceiras = 0;
    
    if (fontesDisponiveis.pagamentos) {
      const pagamentosClassificados = pagamentos.map(pag => ({
        id: pag.id || '',
        valor: parseValorMonetario(pag.valor_pago || pag.valor),
        descricao: pag.descricao || '',
        planoConta: pag.plano_conta_nome || pag.plano_conta || '',
        classificacao: classificarPlanoContas(pag.plano_conta_nome || pag.plano_conta || ''),
        data: pag.data_pagamento || pag.data || ''
      }));
      
      for (const pag of pagamentosClassificados) {
        if (pag.classificacao === ClassificacaoPlanoContas.RECEITA_FINANCEIRA) {
          receitasFinanceiras += pag.valor;
        } else if (pag.classificacao === ClassificacaoPlanoContas.DESPESA_FINANCEIRA) {
          despesasFinanceiras += pag.valor;
        }
      }
    }
    
    const resultadoFinanceiro = receitasFinanceiras - despesasFinanceiras;

    // =========================================================================
    // 11) CALCULAR LAIR
    // =========================================================================
    
    const lair = ebit + resultadoFinanceiro;

    // =========================================================================
    // 12) CALCULAR IR/CSLL
    // =========================================================================
    
    let irCSLL = 0;
    
    if (fontesDisponiveis.pagamentos) {
      const pagamentosClassificados = pagamentos.map(pag => ({
        id: pag.id || '',
        valor: parseValorMonetario(pag.valor_pago || pag.valor),
        descricao: pag.descricao || '',
        planoConta: pag.plano_conta_nome || pag.plano_conta || '',
        classificacao: classificarPlanoContas(pag.plano_conta_nome || pag.plano_conta || ''),
        data: pag.data_pagamento || pag.data || ''
      }));
      
      irCSLL = pagamentosClassificados
        .filter(pag => isImpostoRenda(pag.classificacao))
        .reduce((acc, pag) => acc + pag.valor, 0);
    }
    
    if (irCSLL === 0 && lair > 0) {
      // Estimativa: 34% do LAIR (lucro presumido/real)
      irCSLL = lair * 0.34;
      observacoes.push('IR/CSLL: Estimado em 34% do LAIR (regime Lucro Presumido/Real)');
      qualidade = 'parcial';
    } else if (irCSLL > 0) {
      observacoes.push('IR/CSLL: Obtido de pagamentos classificados');
    }

    // =========================================================================
    // 13) CALCULAR LUCRO LÍQUIDO
    // =========================================================================
    
    const lucroLiquido = lair - irCSLL;

    // =========================================================================
    // 14) CALCULAR MARGENS
    // =========================================================================
    
    const margens = {
      bruta: receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0,
      operacional: receitaLiquida > 0 ? (ebit / receitaLiquida) * 100 : 0,
      liquida: receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0
    };

    // =========================================================================
    // 15) COMPARAÇÃO COM PERÍODO ANTERIOR (MESMA QUANTIDADE DE DIAS)
    // =========================================================================
    
    const dataInicioAnterior = subDays(dataInicio, numeroDias);
    const dataFimAnterior = subDays(dataInicio, 1);
    
    let comparacao: DRECompetencia['comparacao'] | undefined;
    
    try {
      const [vendasAntResult, pagamentosAntResult] = await Promise.allSettled([
        CEOGestaoClickService.getVendas(
          format(dataInicioAnterior, 'yyyy-MM-dd'),
          format(dataFimAnterior, 'yyyy-MM-dd'),
          { todasLojas: true }
        ),
        CEOGestaoClickService.getPagamentos(
          format(dataInicioAnterior, 'yyyy-MM-dd'),
          format(dataFimAnterior, 'yyyy-MM-dd')
        )
      ]);
      
      if (vendasAntResult.status === 'fulfilled' && pagamentosAntResult.status === 'fulfilled') {
        const vendasAnt = vendasAntResult.value;
        const pagamentosAnt = pagamentosAntResult.value;
        
        const vendasFaturadasAnt = vendasAnt.filter(venda => {
          const statusValidos = ['faturada', 'emitida', 'concluída', 'finalizada', 'pago', 'recebido'];
          const status = (venda.situacao || '').toLowerCase();
          return statusValidos.some(s => status.includes(s));
        });
        
        const receitaBrutaAnt = vendasFaturadasAnt.reduce((acc, venda) => 
          acc + parseValorMonetario(venda.valor_total), 0
        );
        
        const impostosAnt = receitaBrutaAnt * 0.10;
        const descontosAnt = vendasFaturadasAnt.reduce((acc, venda) => 
          acc + parseValorMonetario(venda.desconto || 0), 0
        );
        const devolucoesAnt = vendasFaturadasAnt.reduce((acc, venda) => 
          acc + parseValorMonetario(venda.valor_devolvido || 0), 0
        );
        
        const receitaLiquidaAnt = receitaBrutaAnt - impostosAnt - descontosAnt - devolucoesAnt;
        
        let cmvAnt = 0;
        for (const venda of vendasFaturadasAnt) {
          if (venda.itens && Array.isArray(venda.itens) && venda.itens.length > 0) {
            cmvAnt += venda.itens.reduce((sum, item) => 
              sum + (parseValorMonetario(item.quantidade) * parseValorMonetario(item.valor_custo)), 0
            );
          } else if (venda.valor_custo) {
            cmvAnt += parseValorMonetario(venda.valor_custo);
          }
        }
        if (cmvAnt === 0) cmvAnt = receitaLiquidaAnt * 0.40;
        
        const lucroBrutoAnt = receitaLiquidaAnt - cmvAnt;
        const despesasOpAnt = receitaLiquidaAnt * 0.20;
        const ebitAnt = lucroBrutoAnt - despesasOpAnt;
        const lairAnt = ebitAnt;
        const irCSLLAnt = lairAnt > 0 ? lairAnt * 0.34 : 0;
        const lucroLiquidoAnt = lairAnt - irCSLLAnt;
        
        comparacao = {
          receitaLiquidaAnterior: receitaLiquidoAnt,
          lucroLiquidoAnterior: lucroLiquidoAnt,
          variacaoReceita: receitaLiquidaAnt > 0 ? ((receitaLiquida - receitaLiquidaAnt) / receitaLiquidaAnt) * 100 : 0,
          variacaoLucro: lucroLiquidoAnt > 0 ? ((lucroLiquido - lucroLiquidoAnt) / lucroLiquidoAnt) * 100 : 0
        };
      }
    } catch (error) {
      console.error('[CEO DRE] Erro ao buscar período anterior:', error);
    }

    // =========================================================================
    // 16) MONTAR RESPOSTA
    // =========================================================================
    
    const dre: DRECompetencia = {
      receitaBruta,
      deducoes: {
        impostosVendas,
        descontos,
        devolucoes,
        total: deducoesTotal
      },
      receitaLiquida,
      cmv,
      lucroBruto,
      despesasOperacionais: despesasOp,
      ebit,
      resultadoFinanceiro: {
        receitasFinanceiras,
        despesasFinanceiras,
        total: resultadoFinanceiro
      },
      lair,
      irCSLL,
      lucroLiquido,
      margens,
      comparacao,
      qualidade,
      observacoes,
      periodo: {
        inicio: format(dataInicio, 'yyyy-MM-dd'),
        fim: format(dataFim, 'yyyy-MM-dd'),
        dias: numeroDias
      },
      lastUpdated: new Date().toISOString(),
      fonte: fontesDisponiveis
    };

    console.log(`[CEO DRE] DRE calculada - Receita Líquida: R$ ${receitaLiquida.toFixed(2)}, Lucro Líquido: R$ ${lucroLiquido.toFixed(2)}, Qualidade: ${qualidade}`);

    return NextResponse.json(dre);

  } catch (error: any) {
    console.error('[CEO DRE] Erro:', error);
    return NextResponse.json(
      {
        erro: 'Erro ao calcular DRE',
        mensagem: error.message,
        qualidade: 'estimado' as const,
        observacoes: ['Erro ao processar dados: ' + error.message]
      },
      { status: 500 }
    );
  }
}

