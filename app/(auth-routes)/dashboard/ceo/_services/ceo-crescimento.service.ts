/**
 * 📈 CEO DASHBOARD - CRESCIMENTO E SAZONALIDADE SERVICE
 * 
 * Serviço para cálculo de indicadores de crescimento e análise de sazonalidade
 * ⚠️ SOMENTE LEITURA do GestaoClickSupabaseService
 */

import { GestaoClickSupabaseService } from '@/app/_services/gestao-click-supabase';
import type {
  IndicadoresCrescimentoData,
  SazonalidadeData,
  DadosMensaisSazonalidade,
  PrevisibilidadeData,
} from '../_types/sazonalidade.types';
import type { CEODashboardFilters } from '../_types/ceo-dashboard.types';
import {
  calcularMoM,
  calcularYoY,
  calcularCAGR,
  classificarCrescimento,
  calcularTaxaRecorrencia,
  calcularChurnRate,
  calcularIndiceEstabilidade,
  classificarEstabilidade,
  arredondarFinanceiro,
} from '../_utils/calculos-financeiros';
import {
  calcularMedia,
  calcularDesvioPadrao,
  calcularCoeficienteVariacao,
  calcularMediana,
  calcularQuartis,
  identificarTendencia,
  calcularRegressaoLinear,
  preverRegressaoLinear,
} from '../_utils/estatistica';
import {
  formatarPeriodoMensal,
  obterMesesEntre,
  obterMesAnterior,
  obterMesmoMesAnoAnterior,
  extrairMesAno,
  obterNomeMes,
  obterProximosNMeses,
} from '../_utils/date-helpers';

class CEOCrescimentoService {
  /**
   * Calcula indicadores de crescimento
   */
  static async calcularIndicadoresCrescimento(
    filtros: CEODashboardFilters
  ): Promise<IndicadoresCrescimentoData> {
    console.log('[CEOCrescimentoService] 📈 Calculando indicadores de crescimento');
    
    const { dataInicio, dataFim, userId } = filtros;
    
    // Buscar vendas do período atual
    const vendas = await this.buscarVendas(dataInicio, dataFim, userId);
    const valorAtual = vendas.reduce((sum, v) => sum + v.valor_total, 0);
    
    // Buscar mês anterior para MoM
    const mesAnteriorData = obterMesAnterior(dataInicio);
    const vendasMesAnterior = await this.buscarVendas(mesAnteriorData, dataInicio, userId);
    const valorMesAnterior = vendasMesAnterior.reduce((sum, v) => sum + v.valor_total, 0);
    
    // Buscar mesmo mês ano anterior para YoY
    const anoAnteriorData = obterMesmoMesAnoAnterior(dataInicio);
    const vendasAnoAnterior = await this.buscarVendas(anoAnteriorData, obterMesAnterior(anoAnteriorData), userId);
    const valorAnoAnterior = vendasAnoAnterior.reduce((sum, v) => sum + v.valor_total, 0);
    
    // Calcular crescimentos
    const momPercent = calcularMoM(valorAtual, valorMesAnterior);
    const yoyPercent = calcularYoY(valorAtual, valorAnoAnterior);
    
    // CAGR (últimos 12 meses)
    const dataInicio12Meses = new Date(dataFim);
    dataInicio12Meses.setMonth(dataInicio12Meses.getMonth() - 12);
    const vendas12Meses = await this.buscarVendas(dataInicio12Meses, dataFim, userId);
    const vendasPorMes = this.agruparVendasPorMes(vendas12Meses);
    const valores = Object.values(vendasPorMes);
    const valorInicial = valores.length > 0 ? valores[0] : 0;
    const valorFinal = valores.length > 0 ? valores[valores.length - 1] : 0;
    const cagrPercent = calcularCAGR(valorInicial, valorFinal, valores.length);
    
    return {
      crescimento: {
        mom: {
          percentual: arredondarFinanceiro(momPercent),
          valorAtual: arredondarFinanceiro(valorAtual),
          valorAnterior: arredondarFinanceiro(valorMesAnterior),
          status: classificarCrescimento(momPercent),
        },
        yoy: {
          percentual: arredondarFinanceiro(yoyPercent),
          valorAtual: arredondarFinanceiro(valorAtual),
          valorAnterior: arredondarFinanceiro(valorAnoAnterior),
          status: classificarCrescimento(yoyPercent),
        },
        cagr: {
          percentual: arredondarFinanceiro(cagrPercent),
          valorInicial: arredondarFinanceiro(valorInicial),
          valorFinal: arredondarFinanceiro(valorFinal),
          meses: valores.length,
          status: classificarCrescimento(cagrPercent),
        },
      },
      breakdown: {
        porProduto: [],
        porVendedor: [],
        porLoja: [],
        porCanal: [],
      },
    };
  }
  
  /**
   * Analisa sazonalidade
   */
  static async analisarSazonalidade(
    filtros: CEODashboardFilters
  ): Promise<SazonalidadeData> {
    console.log('[CEOCrescimentoService] 📊 Analisando sazonalidade');
    
    const { dataInicio, dataFim, userId } = filtros;
    const vendas = await this.buscarVendas(dataInicio, dataFim, userId);
    
    // Agrupar por mês
    const vendasPorMes = this.agruparVendasPorMesDetalhado(vendas);
    const dadosMensais = this.criarDadosMensais(vendasPorMes);
    
    // Calcular estatísticas
    const receitas = dadosMensais.map(d => d.receitas);
    const media = calcularMedia(receitas);
    const desvioPadrao = calcularDesvioPadrao(receitas);
    const cv = calcularCoeficienteVariacao(receitas);
    const mediana = calcularMediana(receitas);
    const quartis = calcularQuartis(receitas);
    
    const estatisticas = {
      geral: {
        mediaMensal: arredondarFinanceiro(media),
        mediana: arredondarFinanceiro(mediana),
        desvioPadrao: arredondarFinanceiro(desvioPadrao),
        coeficienteVariacao: arredondarFinanceiro(cv),
        amplitude: arredondarFinanceiro(Math.max(...receitas) - Math.min(...receitas)),
        quartis: {
          q1: arredondarFinanceiro(quartis.q1),
          q2: arredondarFinanceiro(quartis.q2),
          q3: arredondarFinanceiro(quartis.q3),
        },
        outliers: [],
      },
      porMes: {
        meses: [],
        melhorMes: { mes: 1, nome: 'Janeiro', media: 0 },
        piorMes: { mes: 1, nome: 'Janeiro', media: 0 },
        amplitude: 0,
      },
      porTrimestre: {
        trimestres: [],
        melhorTrimestre: 1,
        piorTrimestre: 1,
      },
      volatilidade: {
        nivel: 'moderada' as const,
        coeficienteVariacao: arredondarFinanceiro(cv),
        risco: cv > 20 ? 'alto' : cv > 10 ? 'medio' : 'baixo',
        estabilidade: arredondarFinanceiro(Math.max(0, 100 - cv)),
      },
    };
    
    // Identificar padrões
    const padroes = this.identificarPadroesSazonalidade(dadosMensais, estatisticas);
    
    // Gerar insights
    const insights = this.gerarInsightsSazonalidade(dadosMensais, estatisticas, padroes);
    
    // Calcular previsibilidade
    const previsibilidade = await this.calcularPrevisibilidade(vendas, dadosMensais);
    
    return {
      periodoAnalisado: {
        inicio: dataInicio,
        fim: dataFim,
        meses: dadosMensais.length,
      },
      dadosMensais,
      estatisticas,
      padroes,
      insights,
      previsibilidade,
    };
  }
  
  /**
   * Calcula previsibilidade
   */
  private static async calcularPrevisibilidade(
    vendas: any[],
    dadosMensais: DadosMensaisSazonalidade[]
  ): Promise<PrevisibilidadeData> {
    // Identificar clientes recorrentes
    const clientesMap = new Map<string, any[]>();
    vendas.forEach(v => {
      if (!clientesMap.has(v.cliente_id)) {
        clientesMap.set(v.cliente_id, []);
      }
      clientesMap.get(v.cliente_id)!.push(v);
    });
    
    const clientesRecorrentes = Array.from(clientesMap.values()).filter(v => v.length >= 2).length;
    const totalClientes = clientesMap.size;
    const receitaRecorrente = Array.from(clientesMap.values())
      .filter(v => v.length >= 2)
      .reduce((sum, vendas) => sum + vendas.slice(1).reduce((s, v) => s + v.valor_total, 0), 0);
    
    const receitaTotal = vendas.reduce((sum, v) => sum + v.valor_total, 0);
    const percentualRecorrencia = calcularTaxaRecorrencia(receitaRecorrente, receitaTotal);
    
    // Calcular estabilidade
    const receitas = dadosMensais.map(d => d.receitas);
    const cv = calcularCoeficienteVariacao(receitas);
    
    // Fazer previsões (3 meses)
    const x = dadosMensais.map((_, i) => i);
    const y = receitas;
    const previsoes = obterProximosNMeses(3, new Date()).map((data, i) => ({
      periodo: formatarPeriodoMensal(data),
      valorPrevisto: arredondarFinanceiro(preverRegressaoLinear(x, y, x.length + i)),
      valorMinimo: 0,
      valorMaximo: 0,
      margemErro: 0,
      confianca: 70,
      metodo: 'tendencia_linear' as const,
      componentesSazonais: [],
      premissas: [],
      riscos: [],
    }));
    
    return {
      indicePrevisibilidade: arredondarFinanceiro(Math.max(0, 100 - cv)),
      classificacao: cv < 10 ? 'muito_previsivel' : cv < 20 ? 'previsivel' : cv < 30 ? 'moderado' : 'imprevisivel',
      receitaRecorrente: {
        percentual: arredondarFinanceiro(percentualRecorrencia),
        valor: arredondarFinanceiro(receitaRecorrente),
        receitaTotal: arredondarFinanceiro(receitaTotal),
        clientesRecorrentes: {
          quantidade: clientesRecorrentes,
          percentual: arredondarFinanceiro((clientesRecorrentes / totalClientes) * 100),
          ticketMedio: clientesRecorrentes > 0 ? arredondarFinanceiro(receitaRecorrente / clientesRecorrentes) : 0,
          frequenciaMedia: 2,
        },
        clientesNovos: {
          quantidade: totalClientes - clientesRecorrentes,
          percentual: arredondarFinanceiro(((totalClientes - clientesRecorrentes) / totalClientes) * 100),
          ticketMedio: 0,
        },
        totalClientes,
        churn: {
          taxa: 0,
          clientesPerdidos: 0,
          impactoReceita: 0,
        },
      },
      estabilidade: {
        coeficienteVariacao: arredondarFinanceiro(cv),
        status: classificarEstabilidade(cv),
        mediaMensal: arredondarFinanceiro(calcularMedia(receitas)),
        desvioPadrao: arredondarFinanceiro(calcularDesvioPadrao(receitas)),
        fonteEstabilidade: {
          clientesRecorrentes: percentualRecorrencia,
          diversificacaoProdutos: 50,
          diversificacaoCanais: 50,
          score: 50,
        },
      },
      previsoes,
      cenarios: {
        otimista: {
          nome: 'Otimista',
          descricao: 'Crescimento acelerado',
          receita: arredondarFinanceiro(receitaTotal * 1.2),
          lucro: 0,
          margem: 0,
          crescimento: 20,
          premissas: ['Aumento de vendas', 'Novos clientes'],
        },
        realista: {
          nome: 'Realista',
          descricao: 'Crescimento moderado',
          receita: arredondarFinanceiro(receitaTotal * 1.1),
          lucro: 0,
          margem: 0,
          crescimento: 10,
          premissas: ['Manutenção do ritmo atual'],
        },
        pessimista: {
          nome: 'Pessimista',
          descricao: 'Crescimento lento',
          receita: arredondarFinanceiro(receitaTotal * 1.05),
          lucro: 0,
          margem: 0,
          crescimento: 5,
          premissas: ['Dificuldades de mercado'],
        },
        probabilidades: {
          otimista: 20,
          realista: 60,
          pessimista: 20,
        },
      },
    };
  }
  
  // ==========================================================================
  // AUXILIARES
  // ==========================================================================
  
  private static async buscarVendas(inicio: Date, fim: Date, userId: string) {
    const resultado = await GestaoClickSupabaseService.sincronizarVendas({
      dataInicio: inicio,
      dataFim: fim,
      userId,
      forceUpdate: false,
    });
    return resultado.vendas || [];
  }
  
  private static agruparVendasPorMes(vendas: any[]): Record<string, number> {
    const map: Record<string, number> = {};
    vendas.forEach(v => {
      const periodo = formatarPeriodoMensal(new Date(v.data_venda));
      map[periodo] = (map[periodo] || 0) + v.valor_total;
    });
    return map;
  }
  
  private static agruparVendasPorMesDetalhado(vendas: any[]): Map<string, any[]> {
    const map = new Map<string, any[]>();
    vendas.forEach(v => {
      const periodo = formatarPeriodoMensal(new Date(v.data_venda));
      if (!map.has(periodo)) {
        map.set(periodo, []);
      }
      map.get(periodo)!.push(v);
    });
    return map;
  }
  
  private static criarDadosMensais(vendasPorMes: Map<string, any[]>): DadosMensaisSazonalidade[] {
    const dados: DadosMensaisSazonalidade[] = [];
    
    vendasPorMes.forEach((vendas, periodo) => {
      const { mes, ano } = extrairMesAno(new Date(periodo + '-01'));
      const receitas = vendas.reduce((sum, v) => sum + v.valor_total, 0);
      const custos = vendas.reduce((sum, v) => sum + (v.valor_custo || 0), 0);
      const lucro = receitas - custos;
      const margem = receitas > 0 ? (lucro / receitas) * 100 : 0;
      
      dados.push({
        periodo,
        mes,
        ano,
        nomeMes: obterNomeMes(mes),
        trimestre: Math.ceil(mes / 3),
        vendas: vendas.length,
        receitas: arredondarFinanceiro(receitas),
        custos: arredondarFinanceiro(custos),
        lucro: arredondarFinanceiro(lucro),
        margem: arredondarFinanceiro(margem),
        variacaoMesAnterior: 0,
        variacaoMesAnteriorPercent: 0,
        variacaoMesmoMesAnoAnterior: 0,
        variacaoMesmoMesAnoAnteriorPercent: 0,
        posicaoRelativa: 'media',
        desviosPadrao: 0,
        diasUteis: 22,
      });
    });
    
    return dados.sort((a, b) => a.periodo.localeCompare(b.periodo));
  }
  
  private static identificarPadroesSazonalidade(dados: DadosMensaisSazonalidade[], estatisticas: any) {
    return [];
  }
  
  private static gerarInsightsSazonalidade(dados: DadosMensaisSazonalidade[], estatisticas: any, padroes: any[]) {
    return [];
  }
}

export default CEOCrescimentoService;



