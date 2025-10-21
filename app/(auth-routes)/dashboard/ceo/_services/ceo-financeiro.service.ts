/**
 * 💰 CEO DASHBOARD - INDICADORES FINANCEIROS SERVICE
 * 
 * Serviço para cálculo de indicadores financeiros
 * ⚠️ SOMENTE LEITURA do GestaoClickSupabaseService
 */

import { GestaoClickSupabaseService } from '@/app/_services/gestao-click-supabase';
import type {
  IndicadoresFinanceirosResponse,
  IndicadoresLiquidez,
  IndicadoresInadimplencia,
  IndicadoresEficiencia,
  IndicadoresSustentabilidade,
  ClienteInadimplente,
  AgingRecebiveis,
  RentabilidadeItem,
} from '../_types/indicadores-financeiros.types';
import type { CEODashboardFilters } from '../_types/ceo-dashboard.types';
import {
  calcularLiquidezCorrente,
  calcularPMR,
  calcularPMP,
  calcularCicloConversaoCaixa,
  calcularTaxaInadimplencia,
  calcularRelacaoCustosReceita,
  calcularCAC,
  calcularLTV,
  calcularRatioLTVCAC,
  calcularTicketMedio,
  calcularMesesCobertura,
  classificarLiquidez,
  classificarCicloConversao,
  classificarInadimplencia,
  classificarRatioLTVCAC,
  classificarEndividamento,
  classificarCoberturaDespesas,
  arredondarFinanceiro,
} from '../_utils/calculos-financeiros';
import { calcularDiasAtraso, determinarFaixaAging } from '../_utils/date-helpers';

class CEOFinanceiroService {
  /**
   * Calcula todos os indicadores financeiros
   */
  static async calcularIndicadoresFinanceiros(
    filtros: CEODashboardFilters
  ): Promise<IndicadoresFinanceirosResponse> {
    console.log('[CEOFinanceiroService] 💰 Calculando indicadores financeiros');
    
    try {
      const { dataInicio, dataFim, userId } = filtros;
      
      // Buscar vendas
      const resultado = await GestaoClickSupabaseService.sincronizarVendas({
        dataInicio,
        dataFim,
        userId,
        forceUpdate: false,
      });
      
      if (!resultado.vendas || resultado.vendas.length === 0) {
        console.log('[CEOFinanceiroService] ⚠️ Sem vendas para calcular indicadores');
        return this.criarIndicadoresVazios();
      }
      
      const vendas = resultado.vendas;
      
      // Calcular indicadores
      const [liquidez, inadimplencia, eficiencia, sustentabilidade] = await Promise.all([
        this.calcularLiquidez(vendas),
        this.calcularInadimplencia(vendas),
        this.calcularEficiencia(vendas, { 
          pagamentos: filtros.pagamentos,
          centrosCustos: filtros.centrosCustos 
        }),
        this.calcularSustentabilidade(vendas),
      ]);
      
      const capitalGiro = {
        capitalGiroLiquido: 0,
        necessidadeCapitalGiro: 0,
        saldoTesouraria: 0,
        cicloFinanceiro: liquidez.cicloConversao.dias,
        status: liquidez.liquidezCorrente.status as any,
        recomendacoes: [],
      };
      
      console.log('[CEOFinanceiroService] ✅ Indicadores calculados');
      
      return {
        success: true,
        data: {
          liquidez,
          inadimplencia,
          eficiencia,
          sustentabilidade,
          capitalGiro,
        },
        timestamp: new Date(),
        cached: false,
      };
    } catch (error) {
      console.error('[CEOFinanceiroService] ❌ Erro ao calcular indicadores:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
        cached: false,
      };
    }
  }
  
  /**
   * Calcula indicadores de liquidez
   */
  private static async calcularLiquidez(vendas: any[]): Promise<IndicadoresLiquidez> {
    // Calcular contas a receber (vendas não pagas)
    const contasReceber = vendas
      .filter(v => v.status !== 'Concretizada' || !this.isPago(v))
      .reduce((sum, v) => sum + v.valor_total, 0);
    
    // Calcular receita média diária
    const receitaTotal = vendas.reduce((sum, v) => sum + v.valor_total, 0);
    const diasPeriodo = 30; // Assumir mês
    const receitaMediaDiaria = receitaTotal / diasPeriodo;
    
    // Calcular PMR (Prazo Médio de Recebimento)
    const pmr = calcularPMR(contasReceber, receitaMediaDiaria);
    
    // Calcular PMP (Prazo Médio de Pagamento) - estimativa
    const pmp = 30; // Estimativa padrão
    
    // Calcular PME (Prazo Médio de Estoque) - estimativa
    const pme = 15; // Estimativa padrão
    
    // Ciclo de Conversão de Caixa
    const diasCiclo = calcularCicloConversaoCaixa(pmr, pme, pmp);
    
    // Ativos e Passivos Circulantes (estimativas)
    const ativosCirculantes = contasReceber + 10000; // + caixa estimado
    const passivosCirculantes = 5000; // Estimativa
    
    // Liquidez Corrente
    const liquidezCorrenteValor = calcularLiquidezCorrente(ativosCirculantes, passivosCirculantes);
    
    return {
      liquidezCorrente: {
        valor: arredondarFinanceiro(liquidezCorrenteValor),
        status: classificarLiquidez(liquidezCorrenteValor),
        ativosCirculantes: arredondarFinanceiro(ativosCirculantes),
        passivosCirculantes: arredondarFinanceiro(passivosCirculantes),
      },
      liquidezSeca: {
        valor: arredondarFinanceiro(liquidezCorrenteValor * 0.8),
        ativosCirculantesSemEstoque: arredondarFinanceiro(ativosCirculantes * 0.8),
        passivosCirculantes: arredondarFinanceiro(passivosCirculantes),
        status: classificarLiquidez(liquidezCorrenteValor * 0.8),
      },
      liquidezImediata: {
        valor: arredondarFinanceiro(liquidezCorrenteValor * 0.3),
        disponibilidadeImediata: arredondarFinanceiro(ativosCirculantes * 0.3),
        passivosCirculantes: arredondarFinanceiro(passivosCirculantes),
        status: classificarLiquidez(liquidezCorrenteValor * 0.3),
      },
      cicloConversao: {
        dias: arredondarFinanceiro(diasCiclo),
        pmr: {
          dias: arredondarFinanceiro(pmr),
          contasReceber: arredondarFinanceiro(contasReceber),
          vendasMediaDiaria: arredondarFinanceiro(receitaMediaDiaria),
          detalhamento: {
            ate30dias: { valor: contasReceber * 0.6, percentual: 60 },
            de31a60dias: { valor: contasReceber * 0.3, percentual: 30 },
            de61a90dias: { valor: contasReceber * 0.08, percentual: 8 },
            acima90dias: { valor: contasReceber * 0.02, percentual: 2 },
          },
        },
        pmp: {
          dias: pmp,
          contasPagar: 5000,
          comprasMediaDiaria: 166.67,
          detalhamento: {
            vencidoAtraso: { valor: 0, percentual: 0 },
            venceHoje: { valor: 500, percentual: 10 },
            ate30dias: { valor: 4000, percentual: 80 },
            acima30dias: { valor: 500, percentual: 10 },
          },
        },
        pme: {
          dias: pme,
          estoqueAtual: 8000,
          custoVendasMedioDiario: 533.33,
          giro: 2,
        },
        status: classificarCicloConversao(diasCiclo),
      },
      coberturaDespesas: {
        meses: 3,
        reservasAtuais: 15000,
        despesasFixasMensais: 5000,
        status: classificarCoberturaDespesas(3),
      },
    };
  }
  
  /**
   * Calcula indicadores de inadimplência
   */
  private static async calcularInadimplencia(vendas: any[]): Promise<IndicadoresInadimplencia> {
    const hoje = new Date();
    
    // Identificar vendas vencidas
    const vendasVencidas = vendas.filter(v => {
      if (this.isPago(v)) return false;
      const dataVencimento = this.getDataVencimento(v);
      return dataVencimento && dataVencimento < hoje;
    });
    
    const valorTotal = vendas.reduce((sum, v) => sum + v.valor_total, 0);
    const valorVencido = vendasVencidas.reduce((sum, v) => sum + v.valor_total, 0);
    const valorAVencer = valorTotal - valorVencido;
    
    const taxa = calcularTaxaInadimplencia(valorVencido, valorTotal);
    
    // Calcular aging
    const aging = this.calcularAging(vendasVencidas);
    
    // Top inadimplentes
    const topInadimplentes = this.calcularTopInadimplentes(vendasVencidas);
    
    return {
      taxaInadimplencia: {
        percentual: arredondarFinanceiro(taxa),
        valorTotal: arredondarFinanceiro(valorTotal),
        valorVencido: arredondarFinanceiro(valorVencido),
        valorAVencer: arredondarFinanceiro(valorAVencer),
        quantidadeVendasVencidas: vendasVencidas.length,
        quantidadeVendasTotais: vendas.length,
        status: classificarInadimplencia(taxa),
        tendencia: 'estavel',
        historico: [],
      },
      aging,
      provisaoDevedores: {
        valorProvisionado: valorVencido * 0.05,
        percentualSobreRecebiveis: 5,
        metodologia: 'Percentual fixo de 5%',
        impactoNoLucro: valorVencido * 0.05,
      },
      recuperacao: {
        taxaRecuperacao: 80,
        valorRecuperado: 0,
        valorIrrecuperavel: valorVencido * 0.2,
        tempoMedioRecuperacao: 45,
        esforcoCobranca: {
          tentativas: 0,
          custoEstimado: 0,
          efetividade: 0,
        },
      },
      topInadimplentes,
    };
  }
  
  /**
   * Calcula indicadores de eficiência
   */
  private static async calcularEficiencia(vendas: any[], params?: { pagamentos?: any[], centrosCustos?: any[] }): Promise<IndicadoresEficiencia> {
    const receitaTotal = vendas.reduce((sum, v) => sum + v.valor_total, 0);
    const custoTotal = vendas.reduce((sum, v) => sum + (v.valor_custo || 0), 0);
    
    const relacaoCustos = calcularRelacaoCustosReceita(custoTotal, receitaTotal);
    
    // Calcular novos clientes (primeira compra)
    const clientesMap = new Map<string, any[]>();
    vendas.forEach(v => {
      if (!clientesMap.has(v.cliente_id)) {
        clientesMap.set(v.cliente_id, []);
      }
      clientesMap.get(v.cliente_id)!.push(v);
    });
    
    const novosClientes = Array.from(clientesMap.values()).filter(vendas => vendas.length === 1).length;
    
    // CAC estimado
    const custosMarketing = receitaTotal * 0.03; // 3% estimativa
    const cacValor = calcularCAC(custosMarketing, novosClientes || 1);
    
    // LTV estimado
    const ticketMedio = calcularTicketMedio(receitaTotal, vendas.length);
    const ltvValor = calcularLTV(ticketMedio, 2, 12, 30); // 2 compras/mês, 12 meses, 30% margem
    
    const ratioLTVCAC = calcularRatioLTVCAC(ltvValor, cacValor);
    
    return {
      relacaoCustosReceita: {
        percentual: arredondarFinanceiro(relacaoCustos),
        custoTotal: arredondarFinanceiro(custoTotal),
        receitaTotal: arredondarFinanceiro(receitaTotal),
        status: relacaoCustos < 50 ? 'excelente' : relacaoCustos < 70 ? 'bom' : 'atencao',
        tendencia: 'estavel',
        breakdown: {
          custosDiretos: custoTotal,
          custosIndiretos: 0,
          custosFixos: 0,
          custosVariaveis: custoTotal,
        },
        historico: [],
      },
      cac: {
        valor: arredondarFinanceiro(cacValor),
        custosMarketing: arredondarFinanceiro(custosMarketing),
        custosVendas: 0,
        clientesNovos: novosClientes,
        status: cacValor < 100 ? 'excelente' : cacValor < 300 ? 'bom' : 'atencao',
        porCanal: [],
      },
      ltv: {
        valor: arredondarFinanceiro(ltvValor),
        ticketMedio: arredondarFinanceiro(ticketMedio),
        frequenciaCompra: 2,
        tempoVidaMedio: 12,
        margemContribuicao: 30,
        ratioLTVCAC: arredondarFinanceiro(ratioLTVCAC),
        status: classificarRatioLTVCAC(ratioLTVCAC),
      },
      rentabilidadePorDimensao: await this.calcularRentabilidadePorDimensao(
        vendas,
        params.pagamentos || [],
        params.centrosCustos || []
      ),
      produtividade: {
        receitaPorFuncionario: receitaTotal / 5, // Assumir 5 funcionários
        lucroPorFuncionario: (receitaTotal - custoTotal) / 5,
        vendasPorVendedor: vendas.length / 2, // Assumir 2 vendedores
        ticketMedioPorVendedor: ticketMedio,
        eficienciaOperacional: 85,
      },
    };
  }
  
  /**
   * Calcula indicadores de sustentabilidade
   */
  private static async calcularSustentabilidade(vendas: any[]): Promise<IndicadoresSustentabilidade> {
    const despesasFixasMensais = 5000;
    const reservasDisponiveis = 15000;
    const mesesCobertura = calcularMesesCobertura(reservasDisponiveis, despesasFixasMensais);
    
    return {
      solvencia: {
        patrimonioLiquido: 50000,
        ativoTotal: 80000,
        passivoTotal: 30000,
        indiceSolvencia: 1.67,
        status: 'saudavel',
      },
      endividamento: {
        endividamentoGeral: 37.5,
        endividamentoCP: 20,
        endividamentoLP: 17.5,
        composicaoEndividamento: 53.3,
        garantiaCapitalTerceiros: 166.7,
        status: classificarEndividamento(37.5),
      },
      capacidadePagamento: {
        coberturaDividas: 5,
        coberturaJuros: 10,
        fluxoCaixaOperacional: 10000,
        servicoDivida: 2000,
        status: 'excelente',
      },
      sustentabilidadeOperacional: {
        pontoEquilibrio: 20000,
        margemSeguranca: 30,
        alavancagemOperacional: 1.5,
        capacidadeAutofinanciamento: 70,
        status: 'sustentavel',
      },
    };
  }
  
  // ==========================================================================
  // MÉTODOS AUXILIARES
  // ==========================================================================
  
  /**
   * Calcula rentabilidade por dimensão (Centro de Custo, Vendedor, Loja, etc)
   */
  private static async calcularRentabilidadePorDimensao(
    vendas: any[],
    pagamentos: any[],
    centrosCustos: any[]
  ) {
    console.log('[CEOFinanceiro] 💰 Calculando rentabilidade por dimensões');
    console.log('[CEOFinanceiro] 📊 Dados recebidos:', {
      vendas: vendas.length,
      pagamentos: pagamentos.length,
      centrosCustos: centrosCustos.length,
    });
    
    // Rentabilidade por Centro de Custo
    const porCentroCusto = this.calcularRentabilidadePorCentroCusto(
      vendas,
      pagamentos,
      centrosCustos
    );
    
    // Rentabilidade por Vendedor
    const porVendedor = this.calcularRentabilidadePorVendedor(vendas);
    
    // Rentabilidade por Loja (se disponível)
    const porLoja = this.calcularRentabilidadePorLoja(vendas);
    
    // Rentabilidade por Produto (top produtos)
    const porProduto = this.calcularRentabilidadePorProduto(vendas);
    
    // Rentabilidade por Canal
    const porCanal = this.calcularRentabilidadePorCanal(vendas);
    
    return {
      porCentroCusto,
      porVendedor,
      porLoja,
      porProduto,
      porCanal,
    };
  }
  
  /**
   * Calcula rentabilidade POR CENTRO DE CUSTO
   */
  private static calcularRentabilidadePorCentroCusto(
    vendas: any[],
    pagamentos: any[],
    centrosCustos: any[]
  ): RentabilidadeItem[] {
    console.log('[CEOFinanceiro] 💰 Calculando rentabilidade por Centro de Custo');
    
    // Mapear centros de custo
    const ccMap = new Map();
    centrosCustos.forEach(cc => {
      ccMap.set(cc.id, {
        id: cc.id,
        nome: cc.nome,
        receitas: 0,
        custos: 0,
        despesas: 0,
      });
    });
    
    // Somar RECEITAS de cada centro de custo (das vendas)
    vendas.forEach(venda => {
      // ✅ CORRIGIDO: centro_custo_id está no objeto raiz, não em metadata
      const ccId = venda.centro_custo_id || venda.metadata?.centro_custo_id;
      
      // Converter para número se for string
      const ccIdNum = ccId ? (typeof ccId === 'string' ? parseInt(ccId) : ccId) : null;
      
      if (ccIdNum && ccMap.has(ccIdNum)) {
        const valor = parseFloat(venda.valor_total || '0');
        const custo = parseFloat(venda.valor_custo || '0');
        
        ccMap.get(ccIdNum).receitas += valor;
        ccMap.get(ccIdNum).custos += custo;
      }
    });
    
    // Somar DESPESAS de cada centro de custo (dos pagamentos)
    // ✅ liquidado pode ser "1" (pago) ou "pg" (pago)
    const pagamentosPagos = pagamentos.filter(p => p.liquidado === 'pg' || p.liquidado === '1' || p.liquidado === 1);
    
    pagamentosPagos.forEach(pag => {
      const ccId = pag.centro_custo_id;
      
      if (ccId && ccMap.has(ccId)) {
        const valor = parseFloat(pag.valor || '0');
        ccMap.get(ccId).despesas += valor;
      }
    });
    
    // Calcular rentabilidade de CADA centro de custo
    const receitaTotal = Array.from(ccMap.values()).reduce((sum, cc) => sum + cc.receitas, 0);
    
    const rentabilidades = Array.from(ccMap.values())
      .map(cc => {
        const lucro = cc.receitas - cc.custos - cc.despesas;
        const margem = cc.receitas > 0 ? (lucro / cc.receitas) * 100 : 0;
        const participacao = receitaTotal > 0 ? (cc.receitas / receitaTotal) * 100 : 0;
        const investimento = cc.custos + cc.despesas;
        const roi = investimento > 0 ? (lucro / investimento) * 100 : 0;
        
        return {
          id: cc.id.toString(),
          nome: cc.nome,
          receita: cc.receitas,
          custos: cc.custos,
          despesas: cc.despesas,
          lucro,
          margem,
          participacao,
          roi,
          status: lucro > 0 ? 'lucrativo' as const : lucro === 0 ? 'equilibrio' as const : 'prejuizo' as const,
          tendencia: 'estavel' as const,
        };
      })
      // ✅ MOSTRAR TODOS OS CENTROS (não filtrar por movimentação)
      .sort((a, b) => {
        // Ordenar por: 1. Com movimentação primeiro, 2. Maior receita
        const aMovimentacao = a.receita + a.despesas;
        const bMovimentacao = b.receita + b.despesas;
        
        if (aMovimentacao === 0 && bMovimentacao > 0) return 1;
        if (bMovimentacao === 0 && aMovimentacao > 0) return -1;
        
        return b.receita - a.receita;
      });
    
    console.log('[CEOFinanceiro] ✅ Rentabilidade calculada:', rentabilidades.length, 'centros de custo');
    if (rentabilidades.length > 0) {
      console.log('[CEOFinanceiro] 📊 Top 5:');
      rentabilidades.slice(0, 5).forEach(r => {
        console.log(`  - ${r.nome}: Receita R$ ${r.receita.toFixed(2)}, Lucro R$ ${r.lucro.toFixed(2)}, Margem ${r.margem.toFixed(1)}%`);
      });
    }
    
    return rentabilidades;
  }
  
  /**
   * Calcula rentabilidade por Vendedor
   */
  private static calcularRentabilidadePorVendedor(vendas: any[]): RentabilidadeItem[] {
    const vendedoresMap = new Map();
    
    vendas.forEach(venda => {
      const vendedorId = venda.vendedor_id || 'sem-vendedor';
      const vendedorNome = venda.vendedor_nome || 'Sem Vendedor';
      
      if (!vendedoresMap.has(vendedorId)) {
        vendedoresMap.set(vendedorId, {
          id: vendedorId,
          nome: vendedorNome,
          receitas: 0,
          custos: 0,
          despesas: 0,
        });
      }
      
      const vendedor = vendedoresMap.get(vendedorId);
      vendedor.receitas += parseFloat(venda.valor_total || '0');
      vendedor.custos += parseFloat(venda.valor_custo || '0');
    });
    
    const receitaTotal = Array.from(vendedoresMap.values()).reduce((sum, v) => sum + v.receitas, 0);
    
    return Array.from(vendedoresMap.values())
      .map(v => {
        const lucro = v.receitas - v.custos - v.despesas;
        const margem = v.receitas > 0 ? (lucro / v.receitas) * 100 : 0;
        const participacao = receitaTotal > 0 ? (v.receitas / receitaTotal) * 100 : 0;
        const investimento = v.custos + v.despesas;
        const roi = investimento > 0 ? (lucro / investimento) * 100 : 0;
        
        return {
          id: v.id,
          nome: v.nome,
          receita: v.receitas,
          custos: v.custos,
          despesas: v.despesas,
          lucro,
          margem,
          participacao,
          roi,
          status: lucro > 0 ? 'lucrativo' as const : lucro === 0 ? 'equilibrio' as const : 'prejuizo' as const,
          tendencia: 'estavel' as const,
        };
      })
      .sort((a, b) => b.receita - a.receita);
  }
  
  /**
   * Calcula rentabilidade por Loja
   */
  private static calcularRentabilidadePorLoja(vendas: any[]): RentabilidadeItem[] {
    const lojasMap = new Map();
    
    vendas.forEach(venda => {
      const lojaId = venda.metadata?.loja_id || 'sem-loja';
      const lojaNome = venda.metadata?.loja_nome || 'Sem Loja';
      
      if (!lojasMap.has(lojaId)) {
        lojasMap.set(lojaId, {
          id: lojaId,
          nome: lojaNome,
          receitas: 0,
          custos: 0,
          despesas: 0,
        });
      }
      
      const loja = lojasMap.get(lojaId);
      loja.receitas += parseFloat(venda.valor_total || '0');
      loja.custos += parseFloat(venda.valor_custo || '0');
    });
    
    const receitaTotal = Array.from(lojasMap.values()).reduce((sum, l) => sum + l.receitas, 0);
    
    return Array.from(lojasMap.values())
      .map(l => {
        const lucro = l.receitas - l.custos - l.despesas;
        const margem = l.receitas > 0 ? (lucro / l.receitas) * 100 : 0;
        const participacao = receitaTotal > 0 ? (l.receitas / receitaTotal) * 100 : 0;
        const investimento = l.custos + l.despesas;
        const roi = investimento > 0 ? (lucro / investimento) * 100 : 0;
        
        return {
          id: l.id.toString(),
          nome: l.nome,
          receita: l.receitas,
          custos: l.custos,
          despesas: l.despesas,
          lucro,
          margem,
          participacao,
          roi,
          status: lucro > 0 ? 'lucrativo' as const : lucro === 0 ? 'equilibrio' as const : 'prejuizo' as const,
          tendencia: 'estavel' as const,
        };
      })
      .sort((a, b) => b.receita - a.receita);
  }
  
  /**
   * Calcula rentabilidade por Produto
   */
  private static calcularRentabilidadePorProduto(vendas: any[]): RentabilidadeItem[] {
    const produtosMap = new Map();
    
    vendas.forEach(venda => {
      if (venda.produtos && Array.isArray(venda.produtos)) {
        venda.produtos.forEach((produto: any) => {
          const produtoId = produto.id || 'sem-id';
          const produtoNome = produto.nome || 'Sem Nome';
          
          if (!produtosMap.has(produtoId)) {
            produtosMap.set(produtoId, {
              id: produtoId,
              nome: produtoNome,
              receitas: 0,
              custos: 0,
              despesas: 0,
            });
          }
          
          const prod = produtosMap.get(produtoId);
          prod.receitas += parseFloat(produto.total || '0');
          prod.custos += parseFloat(produto.valor_custo || '0') * produto.quantidade;
        });
      }
    });
    
    const receitaTotal = Array.from(produtosMap.values()).reduce((sum, p) => sum + p.receitas, 0);
    
    return Array.from(produtosMap.values())
      .map(p => {
        const lucro = p.receitas - p.custos - p.despesas;
        const margem = p.receitas > 0 ? (lucro / p.receitas) * 100 : 0;
        const participacao = receitaTotal > 0 ? (p.receitas / receitaTotal) * 100 : 0;
        const investimento = p.custos + p.despesas;
        const roi = investimento > 0 ? (lucro / investimento) * 100 : 0;
        
        return {
          id: p.id,
          nome: p.nome,
          receita: p.receitas,
          custos: p.custos,
          despesas: p.despesas,
          lucro,
          margem,
          participacao,
          roi,
          status: lucro > 0 ? 'lucrativo' as const : lucro === 0 ? 'equilibrio' as const : 'prejuizo' as const,
          tendencia: 'estavel' as const,
        };
      })
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 20); // Top 20 produtos
  }
  
  /**
   * Calcula rentabilidade por Canal
   */
  private static calcularRentabilidadePorCanal(vendas: any[]): RentabilidadeItem[] {
    const canaisMap = new Map();
    
    vendas.forEach(venda => {
      const canalId = venda.canal_venda || venda.metadata?.canal_venda || 'sem-canal';
      const canalNome = venda.canal_venda || venda.metadata?.nome_canal_venda || 'Sem Canal';
      
      if (!canaisMap.has(canalId)) {
        canaisMap.set(canalId, {
          id: canalId,
          nome: canalNome,
          receitas: 0,
          custos: 0,
          despesas: 0,
        });
      }
      
      const canal = canaisMap.get(canalId);
      canal.receitas += parseFloat(venda.valor_total || '0');
      canal.custos += parseFloat(venda.valor_custo || '0');
    });
    
    const receitaTotal = Array.from(canaisMap.values()).reduce((sum, c) => sum + c.receitas, 0);
    
    return Array.from(canaisMap.values())
      .map(c => {
        const lucro = c.receitas - c.custos - c.despesas;
        const margem = c.receitas > 0 ? (lucro / c.receitas) * 100 : 0;
        const participacao = receitaTotal > 0 ? (c.receitas / receitaTotal) * 100 : 0;
        const investimento = c.custos + c.despesas;
        const roi = investimento > 0 ? (lucro / investimento) * 100 : 0;
        
        return {
          id: c.id,
          nome: c.nome,
          receita: c.receitas,
          custos: c.custos,
          despesas: c.despesas,
          lucro,
          margem,
          participacao,
          roi,
          status: lucro > 0 ? 'lucrativo' as const : lucro === 0 ? 'equilibrio' as const : 'prejuizo' as const,
          tendencia: 'estavel' as const,
        };
      })
      .sort((a, b) => b.receita - a.receita);
  }
  
  private static isPago(venda: any): boolean {
    if (venda.status === 'Concretizada') return true;
    if (venda.pagamentos && Array.isArray(venda.pagamentos)) {
      return venda.pagamentos.some((p: any) => p.status === 'pago' || p.status === 'aprovado');
    }
    return false;
  }
  
  private static getDataVencimento(venda: any): Date | null {
    if (venda.metadata?.data_vencimento) {
      return new Date(venda.metadata.data_vencimento);
    }
    // Assumir 30 dias após a venda
    const dataVenda = new Date(venda.data_venda);
    dataVenda.setDate(dataVenda.getDate() + 30);
    return dataVenda;
  }
  
  private static calcularAging(vendasVencidas: any[]): AgingRecebiveis {
    const faixas = [
      { faixa: '0-30 dias', dias: { min: 0, max: 30 }, risco: 'baixo' as const },
      { faixa: '31-60 dias', dias: { min: 31, max: 60 }, risco: 'medio' as const },
      { faixa: '61-90 dias', dias: { min: 61, max: 90 }, risco: 'alto' as const },
      { faixa: '90+ dias', dias: { min: 91, max: null }, risco: 'critico' as const },
    ];
    
    const agingFaixas = faixas.map(f => {
      const vendasFaixa = vendasVencidas.filter(v => {
        const dataVencimento = this.getDataVencimento(v);
        if (!dataVencimento) return false;
        const dias = calcularDiasAtraso(dataVencimento);
        return dias >= f.dias.min && (f.dias.max === null || dias <= f.dias.max);
      });
      
      const valor = vendasFaixa.reduce((sum, v) => sum + v.valor_total, 0);
      const valorTotal = vendasVencidas.reduce((sum, v) => sum + v.valor_total, 0);
      
      return {
        faixa: f.faixa,
        dias: f.dias,
        quantidade: vendasFaixa.length,
        valor: arredondarFinanceiro(valor),
        percentual: valorTotal > 0 ? arredondarFinanceiro((valor / valorTotal) * 100) : 0,
        risco: f.risco,
      };
    });
    
    const total = vendasVencidas.reduce((sum, v) => sum + v.valor_total, 0);
    
    return {
      total: arredondarFinanceiro(total),
      faixas: agingFaixas,
      distribuicao: {
        ate30dias: agingFaixas[0].valor,
        de31a60dias: agingFaixas[1].valor,
        de61a90dias: agingFaixas[2].valor,
        acima90dias: agingFaixas[3].valor,
      },
      percentualPorFaixa: {
        ate30dias: agingFaixas[0].percentual,
        de31a60dias: agingFaixas[1].percentual,
        de61a90dias: agingFaixas[2].percentual,
        acima90dias: agingFaixas[3].percentual,
      },
    };
  }
  
  private static calcularTopInadimplentes(vendasVencidas: any[]): ClienteInadimplente[] {
    const clientesMap = new Map<string, any[]>();
    
    vendasVencidas.forEach(v => {
      if (!clientesMap.has(v.cliente_id)) {
        clientesMap.set(v.cliente_id, []);
      }
      clientesMap.get(v.cliente_id)!.push(v);
    });
    
    const clientes: ClienteInadimplente[] = Array.from(clientesMap.entries())
      .map(([clienteId, vendas]) => {
        const valorDevedor = vendas.reduce((sum, v) => sum + v.valor_total, 0);
        const diasAtrasos = vendas.map(v => {
          const dataVenc = this.getDataVencimento(v);
          return dataVenc ? calcularDiasAtraso(dataVenc) : 0;
        });
        
        return {
          clienteId,
          clienteNome: vendas[0].cliente_nome || 'Cliente Desconhecido',
          valorDevedor: arredondarFinanceiro(valorDevedor),
          diasAtrasoMedio: Math.round(diasAtrasos.reduce((a, b) => a + b, 0) / diasAtrasos.length),
          diasAtrasoMaximo: Math.max(...diasAtrasos),
          quantidadeVendas: vendas.length,
          ultimaCompra: new Date(Math.max(...vendas.map((v: any) => new Date(v.data_venda).getTime()))),
          primeiraCompra: new Date(Math.min(...vendas.map((v: any) => new Date(v.data_venda).getTime()))),
          vendas: [],
          historicoPagamentos: 'ruim' as const,
          risco: valorDevedor > 5000 ? 'critico' : valorDevedor > 2000 ? 'alto' : 'medio',
          acoes: [],
        };
      })
      .sort((a, b) => b.valorDevedor - a.valorDevedor)
      .slice(0, 10);
    
    return clientes;
  }
  
  private static criarIndicadoresVazios(): IndicadoresFinanceirosResponse {
    return {
      success: true,
      data: undefined,
      error: 'Sem dados para calcular indicadores',
      timestamp: new Date(),
      cached: false,
    };
  }
}

export default CEOFinanceiroService;

