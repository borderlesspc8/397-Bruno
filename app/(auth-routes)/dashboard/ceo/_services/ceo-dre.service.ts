/**
 * 📊 CEO DASHBOARD - DRE SERVICE
 * 
 * Serviço para cálculos de DRE (Demonstração do Resultado do Exercício)
 * ⚠️ SOMENTE LEITURA do GestaoClickSupabaseService
 */

import { GestaoClickSupabaseService } from '@/app/_services/gestao-click-supabase';
import type {
  DRECompleta,
  DRECascata,
  DRECascataItem,
  DREComparativa,
  DREAnual,
  DRECalculoParams,
  DREConfig,
} from '../_types/dre.types';
import {
  calcularReceitaLiquida,
  calcularLucroBruto,
  calcularLucroOperacional,
  calcularLucroLiquido,
  estimarImpostosSimples,
  calcularMargemBruta,
  calcularMargemLiquida,
  arredondarFinanceiro,
} from '../_utils/calculos-financeiros';
import {
  formatarPeriodoMensal,
  obterInicioFimMes,
  obterMesesEntre,
} from '../_utils/date-helpers';
import { categorizarDespesa, obterSecaoDRE } from '../_constants/categorias-despesas';

// ============================================================================
// CLASSE DO SERVICE
// ============================================================================

class CEODREService {
  /**
   * Calcula DRE completa para um período
   */
  static async calcularDRE(params: DRECalculoParams): Promise<DRECompleta> {
    console.log('[CEODREService] 📊 Iniciando cálculo de DRE', params);
    
    const { dataInicio, dataFim, userId, tipo, config, pagamentos, centrosCustos } = params;
    
    // Usar vendas passadas ou buscar
    let vendas = params.vendas;
    if (!vendas) {
    const resultado = await GestaoClickSupabaseService.sincronizarVendas({
      dataInicio,
      dataFim,
      userId,
      forceUpdate: false,
    });
      vendas = resultado.vendas;
    }
    
    if (!vendas || vendas.length === 0) {
      console.log('[CEODREService] ⚠️ Nenhuma venda encontrada para o período');
      return this.criarDREVazia(dataInicio, dataFim, tipo);
    }
    
    // 1. RECEITA BRUTA
    const receitaBruta = vendas.reduce((sum, v) => sum + (v.valor_total || 0), 0);
    
    // 2. IMPOSTOS
    const impostos = this.calcularImpostos(receitaBruta, config);
    
    // 3. DEDUÇÕES
    const descontosAbatimentos = vendas.reduce((sum, v) => sum + (v.desconto_valor || 0), 0);
    const devolucoes = 0; // TODO: Implementar quando disponível
    const totalDeducoes = impostos.total + descontosAbatimentos + devolucoes;
    
    // 4. RECEITA LÍQUIDA
    const receitaLiquida = receitaBruta - totalDeducoes;
    
    // 5. CMV (Custo de Mercadoria Vendida)
    const cmv = this.calcularCMV(vendas);
    
    // 6. MARGEM BRUTA
    const margemBruta = receitaLiquida - cmv.total;
    const margemBrutaPercent = calcularMargemBruta(receitaLiquida, cmv.total);
    
    // 7. DESPESAS OPERACIONAIS
    // ✅ Usar despesas REAIS se disponíveis
    const despesasOperacionais = (pagamentos && pagamentos.length > 0 && centrosCustos && centrosCustos.length > 0)
      ? this.calcularDespesasOperacionaisReais(pagamentos, centrosCustos)
      : this.calcularDespesasOperacionais(vendas);
    
    console.log('[CEODREService] 📊 Despesas calculadas:', {
      usandoDadosReais: !!(pagamentos && pagamentos.length > 0),
      total: despesasOperacionais.total,
    });
    
    // 8. EBITDA e EBIT
    const ebitda = margemBruta - despesasOperacionais.total;
    const ebitdaPercent = (ebitda / receitaLiquida) * 100;
    
    const depreciacaoAmortizacao = 0; // TODO: Implementar quando disponível
    const ebit = ebitda - depreciacaoAmortizacao;
    const ebitPercent = (ebit / receitaLiquida) * 100;
    
    // 9. RESULTADO FINANCEIRO
    const resultadoFinanceiro = this.calcularResultadoFinanceiro(vendas);
    
    // 10. LUCRO ANTES DOS IMPOSTOS
    const lucroAntesImpostos = ebit + resultadoFinanceiro.saldo;
    const lucroAntesImpostosPercent = (lucroAntesImpostos / receitaLiquida) * 100;
    
    // 11. IMPOSTOS SOBRE LUCRO
    const impostosLucro = 0; // Já considerado no Simples Nacional
    
    // 12. LUCRO LÍQUIDO
    const lucroLiquido = lucroAntesImpostos - impostosLucro;
    const lucroLiquidoPercent = calcularMargemLiquida(receitaLiquida, lucroLiquido);
    
    const dre: DRECompleta = {
      periodo: formatarPeriodoMensal(dataInicio),
      tipo,
      
      receitaBruta: arredondarFinanceiro(receitaBruta),
      
      impostos,
      descontosAbatimentos: arredondarFinanceiro(descontosAbatimentos),
      devolucoes: arredondarFinanceiro(devolucoes),
      totalDeducoes: arredondarFinanceiro(totalDeducoes),
      
      receitaLiquida: arredondarFinanceiro(receitaLiquida),
      
      cmv,
      
      margemBruta: arredondarFinanceiro(margemBruta),
      margemBrutaPercent: arredondarFinanceiro(margemBrutaPercent),
      
      despesasOperacionais,
      
      ebitda: arredondarFinanceiro(ebitda),
      ebitdaPercent: arredondarFinanceiro(ebitdaPercent),
      depreciacaoAmortizacao: arredondarFinanceiro(depreciacaoAmortizacao),
      ebit: arredondarFinanceiro(ebit),
      ebitPercent: arredondarFinanceiro(ebitPercent),
      
      resultadoFinanceiro,
      
      lucroAntesImpostos: arredondarFinanceiro(lucroAntesImpostos),
      lucroAntesImpostosPercent: arredondarFinanceiro(lucroAntesImpostosPercent),
      
      impostosLucro: arredondarFinanceiro(impostosLucro),
      
      lucroLiquido: arredondarFinanceiro(lucroLiquido),
      lucroLiquidoPercent: arredondarFinanceiro(lucroLiquidoPercent),
      
      metadata: {
        dataInicio,
        dataFim,
        diasPeriodo: Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)),
        moeda: 'BRL',
        metodoCalculo: 'competencia',
        observacoes: [],
        alertas: this.gerarAlertasDRE({
          margemBrutaPercent,
          margemLiquidaPercent: lucroLiquidoPercent,
          receitaLiquida,
          lucroLiquido,
        }),
      },
    };
    
    console.log('[CEODREService] ✅ DRE calculada', {
      receita: receitaLiquida,
      lucro: lucroLiquido,
      margem: lucroLiquidoPercent,
    });
    
    return dre;
  }
  
  /**
   * Gera DRE em formato cascata (waterfall)
   */
  static async gerarDRECascata(params: DRECalculoParams): Promise<DRECascata> {
    const dre = await this.calcularDRE(params);
    
    const items: DRECascataItem[] = [
      {
        id: '1',
        nome: 'Receita Bruta',
        categoria: 'receita',
        valor: dre.receitaBruta,
        tipo: 'total',
        percentualReceita: 100,
        acumulado: dre.receitaBruta,
        ordem: 1,
      },
      {
        id: '2',
        nome: 'Impostos',
        categoria: 'deducao',
        valor: -dre.impostos.total,
        tipo: 'negativo',
        percentualReceita: (dre.impostos.total / dre.receitaBruta) * 100,
        acumulado: dre.receitaBruta - dre.impostos.total,
        ordem: 2,
      },
      {
        id: '3',
        nome: 'Receita Líquida',
        categoria: 'receita',
        valor: dre.receitaLiquida,
        tipo: 'subtotal',
        percentualReceita: (dre.receitaLiquida / dre.receitaBruta) * 100,
        acumulado: dre.receitaLiquida,
        ordem: 3,
      },
      {
        id: '4',
        nome: 'CMV',
        categoria: 'custo',
        valor: -dre.cmv.total,
        tipo: 'negativo',
        percentualReceita: (dre.cmv.total / dre.receitaBruta) * 100,
        acumulado: dre.receitaLiquida - dre.cmv.total,
        ordem: 4,
      },
      {
        id: '5',
        nome: 'Margem Bruta',
        categoria: 'lucro',
        valor: dre.margemBruta,
        tipo: 'subtotal',
        percentualReceita: dre.margemBrutaPercent,
        acumulado: dre.margemBruta,
        ordem: 5,
      },
      {
        id: '6',
        nome: 'Despesas Operacionais',
        categoria: 'despesa_admin',
        valor: -dre.despesasOperacionais.total,
        tipo: 'negativo',
        percentualReceita: (dre.despesasOperacionais.total / dre.receitaBruta) * 100,
        acumulado: dre.margemBruta - dre.despesasOperacionais.total,
        ordem: 6,
      },
      {
        id: '7',
        nome: 'Lucro Operacional (EBIT)',
        categoria: 'lucro',
        valor: dre.ebit,
        tipo: 'subtotal',
        percentualReceita: dre.ebitPercent,
        acumulado: dre.ebit,
        ordem: 7,
      },
      {
        id: '8',
        nome: 'Resultado Financeiro',
        categoria: 'resultado_financeiro',
        valor: dre.resultadoFinanceiro.saldo,
        tipo: dre.resultadoFinanceiro.saldo >= 0 ? 'positivo' : 'negativo',
        percentualReceita: (dre.resultadoFinanceiro.saldo / dre.receitaBruta) * 100,
        acumulado: dre.ebit + dre.resultadoFinanceiro.saldo,
        ordem: 8,
      },
      {
        id: '9',
        nome: 'Lucro Líquido',
        categoria: 'lucro',
        valor: dre.lucroLiquido,
        tipo: 'total',
        percentualReceita: dre.lucroLiquidoPercent,
        acumulado: dre.lucroLiquido,
        ordem: 9,
      },
    ];
    
    return {
      items,
      receitaBrutaInicial: dre.receitaBruta,
      lucroLiquidoFinal: dre.lucroLiquido,
    };
  }
  
  /**
   * Gera DRE comparativa entre períodos
   */
  static async gerarDREComparativa(
    periodos: { dataInicio: Date; dataFim: Date }[],
    userId: string,
    tipo: 'mensal' | 'trimestral' | 'anual',
    config?: DREConfig
  ): Promise<DREComparativa> {
    console.log('[CEODREService] 📊 Gerando DRE comparativa', { periodos: periodos.length });
    
    // Calcular DRE para cada período
    const dresPromises = periodos.map(periodo =>
      this.calcularDRE({
        dataInicio: periodo.dataInicio,
        dataFim: periodo.dataFim,
        userId,
        tipo,
        config,
      })
    );
    
    const dres = await Promise.all(dresPromises);
    
    // Extrair períodos
    const periodosStr = dres.map(dre => dre.periodo);
    
    // Criar linhas comparativas
    const linhas = this.criarLinhasComparativas(dres);
    
    return {
      periodos: periodosStr,
      linhas,
    };
  }
  
  // ==========================================================================
  // MÉTODOS AUXILIARES
  // ==========================================================================
  
  /**
   * Calcula impostos
   */
  private static calcularImpostos(receitaBruta: number, config?: DREConfig) {
    const aliquota = config?.aliquotaSimplesNacional || 8.65; // Simples Nacional padrão
    const total = estimarImpostosSimples(receitaBruta, aliquota);
    
    return {
      simplesNacional: total,
      icms: undefined,
      pis: undefined,
      cofins: undefined,
      iss: undefined,
      outros: undefined,
      total,
      aliquotaEfetiva: aliquota,
    };
  }
  
  /**
   * Calcula CMV (Custo de Mercadoria Vendida)
   */
  private static calcularCMV(vendas: any[]) {
    let custoProdutos = 0;
    let custoServicos = 0;
    let fretes = 0;
    let embalagens = 0;
    let outros = 0;
    
    vendas.forEach(venda => {
      // Custo principal dos produtos
      custoProdutos += venda.valor_custo || 0;
      
      // Frete como parte do CMV
      fretes += venda.valor_frete || 0;
      
      // Analisar produtos para detalhamento
      if (venda.produtos && Array.isArray(venda.produtos)) {
        venda.produtos.forEach((produto: any) => {
          if (produto.tipo === 'servico' || produto.tipo === 'serviço') {
            custoServicos += produto.valor_custo || 0;
          }
        });
      }
    });
    
    const total = custoProdutos + custoServicos + fretes + embalagens + outros;
    const percentualReceita = 0; // Será calculado no contexto da DRE
    
    return {
      custoProdutos: arredondarFinanceiro(custoProdutos),
      custoServicos: arredondarFinanceiro(custoServicos),
      fretes: arredondarFinanceiro(fretes),
      embalagens: arredondarFinanceiro(embalagens),
      outros: arredondarFinanceiro(outros),
      total: arredondarFinanceiro(total),
      percentualReceita,
    };
  }
  
  /**
   * Calcula despesas operacionais REAIS dos pagamentos
   */
  private static calcularDespesasOperacionaisReais(
    pagamentos: any[],
    centrosCustos: any[]
  ) {
    console.log('[CEODRE] 💸 Calculando despesas REAIS de', pagamentos.length, 'pagamentos');
    
    // Filtrar apenas pagamentos efetivados
    // ✅ liquidado pode ser "1" (pago) ou "pg" (pago)
    const pagos = pagamentos.filter(p => p.liquidado === 'pg' || p.liquidado === '1' || p.liquidado === 1);
    
    console.log('[CEODRE] ✅ Pagamentos efetivados:', pagos.length);
    
    // Inicializar estrutura de despesas
    const despesas = {
      // VENDAS
      comissoes: 0,
      marketing: 0,
      publicidade: 0,
      promocoes: 0,
      fretesEntrega: 0,
      
      // ADMINISTRATIVAS
      aluguel: 0,
      energia: 0,
      agua: 0,
      internet: 0,
      telefone: 0,
      materiais: 0,
      limpeza: 0,
      servicos: 0,
      manutencao: 0,
      equipamentos: 0,
      seguros: 0,
      contabilidade: 0,
      software: 0,
      
      // PESSOAL
      salarios: 0,
      prolabore: 0,
      encargos: 0,
      beneficios: 0,
      
      // OUTRAS
      eventos: 0,
      investimento: 0,
      logistica: 0,
      delivery: 0,
      transportadora: 0,
      impostos: 0,
      outras: 0,
    };
    
    // Classificar CADA pagamento pelo centro de custo
    pagos.forEach(pag => {
      const valor = parseFloat(pag.valor || '0');
      const ccNome = (pag.centro_custo_nome || '').toUpperCase();
      
      // Log para debug (primeiros 10)
      if (pagos.indexOf(pag) < 10) {
        console.log(`[CEODRE] 📝 Pagamento: ${ccNome} = R$ ${valor.toFixed(2)}`);
      }
      
      // MAPEAMENTO COMPLETO DE CENTROS DE CUSTO
      if (ccNome.includes('COMISSAO') || ccNome.includes('COMISSÃO') || ccNome.includes('BONIFICACAO') || ccNome.includes('BONIFICAÇÃO')) {
        despesas.comissoes += valor;
      }
      else if (ccNome.includes('MARKETING') || ccNome.includes('PUBLICIDADE')) {
        despesas.marketing += valor;
      }
      else if (ccNome.includes('PROMOCAO') || ccNome.includes('PROMOÇÃO')) {
        despesas.promocoes += valor;
      }
      else if (ccNome.includes('FRETE') || ccNome.includes('DELIVERY')) {
        despesas.fretesEntrega += valor;
      }
      else if (ccNome.includes('ALUGUEL')) {
        despesas.aluguel += valor;
      }
      else if (ccNome.includes('ENERGIA')) {
        despesas.energia += valor;
      }
      else if (ccNome.includes('AGUA') || ccNome.includes('ÁGUA')) {
        despesas.agua += valor;
      }
      else if (ccNome.includes('INTERNET')) {
        despesas.internet += valor;
      }
      else if (ccNome.includes('TELEFONE')) {
        despesas.telefone += valor;
      }
      else if (ccNome.includes('MATERIAL') && ccNome.includes('DESCARTAVEIS')) {
        despesas.materiais += valor;
      }
      else if (ccNome.includes('LIMPEZA')) {
        despesas.limpeza += valor;
      }
      else if (ccNome.includes('SERVICO') || ccNome.includes('SERVIÇO') || ccNome.includes('PRESTACAO')) {
        despesas.servicos += valor;
      }
      else if (ccNome.includes('MANUTENCAO') || ccNome.includes('MANUTENÇÃO')) {
        despesas.manutencao += valor;
      }
      else if (ccNome.includes('EQUIPAMENTO')) {
        despesas.equipamentos += valor;
      }
      else if (ccNome.includes('CONTABIL')) {
        despesas.contabilidade += valor;
      }
      else if (ccNome.includes('SOFTWARE')) {
        despesas.software += valor;
      }
      else if (ccNome.includes('SALARIO') || ccNome.includes('SALÁRIO')) {
        despesas.salarios += valor;
      }
      else if (ccNome.includes('PROLABORE') || ccNome.includes('PRÓ-LABORE')) {
        despesas.prolabore += valor;
      }
      else if (ccNome.includes('ENCARGO')) {
        despesas.encargos += valor;
      }
      else if (ccNome.includes('BENEFICIO') || ccNome.includes('VALE')) {
        despesas.beneficios += valor;
      }
      else if (ccNome.includes('EVENTO')) {
        despesas.eventos += valor;
      }
      else if (ccNome.includes('INVESTIMENTO')) {
        despesas.investimento += valor;
      }
      else if (ccNome.includes('LOGISTICA') || ccNome.includes('LOGÍSTICA')) {
        despesas.logistica += valor;
      }
      else if (ccNome.includes('TRANSPORTADORA')) {
        despesas.transportadora += valor;
      }
      else if (ccNome.includes('IMPOSTO')) {
        despesas.impostos += valor;
      }
      else {
        despesas.outras += valor;
        console.log('[CEODRE] ⚠️ Despesa não categorizada:', ccNome, 'R$', valor.toFixed(2));
      }
    });
    
    // Montar estrutura da DRE
    const despesasVendas = {
      comissoes: despesas.comissoes,
      marketing: despesas.marketing,
      publicidade: despesas.publicidade,
      promocoes: despesas.promocoes,
      fretesEntrega: despesas.fretesEntrega + despesas.delivery + despesas.transportadora + despesas.logistica,
      outros: 0,
      total: 0, // calculado abaixo
    };
    despesasVendas.total = 
      despesasVendas.comissoes +
      despesasVendas.marketing +
      despesasVendas.publicidade +
      despesasVendas.promocoes +
      despesasVendas.fretesEntrega;
    
    const despesasAdministrativas = {
      aluguel: despesas.aluguel,
      contas: despesas.energia + despesas.agua + despesas.internet + despesas.telefone,
      materiais: despesas.materiais + despesas.limpeza,
      servicos: despesas.servicos + despesas.contabilidade + despesas.software,
      manutencao: despesas.manutencao + despesas.equipamentos,
      seguros: despesas.seguros,
      taxas: despesas.impostos,
      outros: despesas.outras + despesas.eventos + despesas.investimento,
      total: 0,
    };
    despesasAdministrativas.total = 
      despesasAdministrativas.aluguel +
      despesasAdministrativas.contas +
      despesasAdministrativas.materiais +
      despesasAdministrativas.servicos +
      despesasAdministrativas.manutencao +
      despesasAdministrativas.seguros +
      despesasAdministrativas.taxas +
      despesasAdministrativas.outros;
    
    const despesasPessoal = {
      salarios: despesas.salarios + despesas.prolabore,
      encargos: despesas.encargos,
      beneficios: despesas.beneficios,
      treinamento: 0,
      outros: 0,
      total: despesas.salarios + despesas.prolabore + despesas.encargos + despesas.beneficios,
    };
    
    const total = despesasVendas.total + despesasAdministrativas.total + despesasPessoal.total;
    
    console.log('[CEODRE] ✅ Despesas categorizadas:', {
      vendas: despesasVendas.total.toFixed(2),
      administrativas: despesasAdministrativas.total.toFixed(2),
      pessoal: despesasPessoal.total.toFixed(2),
      total: total.toFixed(2),
    });
    
    return {
      vendas: despesasVendas,
      administrativas: despesasAdministrativas,
      pessoal: despesasPessoal,
      total: arredondarFinanceiro(total),
      percentualReceita: 0,
    };
  }
  
  /**
   * Calcula despesas operacionais (fallback se não houver pagamentos)
   */
  private static calcularDespesasOperacionais(vendas: any[]) {
    // Estimativas conservadoras (usado apenas como fallback)
    const receitaTotal = vendas.reduce((sum, v) => sum + v.valor_total, 0);
    
    const comissoes = receitaTotal * 0.05;
    const marketing = receitaTotal * 0.03;
    const aluguel = 2000;
    const salarios = 5000;
    
    const despesasVendas = {
      comissoes,
      marketing,
      publicidade: 0,
      promocoes: 0,
      fretesEntrega: 0,
      outros: 0,
      total: comissoes + marketing,
    };
    
    const despesasAdministrativas = {
      aluguel,
      contas: 500,
      materiais: 200,
      servicos: 300,
      manutencao: 100,
      seguros: 150,
      taxas: 100,
      outros: 0,
      total: aluguel + 500 + 200 + 300 + 100 + 150 + 100,
    };
    
    const despesasPessoal = {
      salarios,
      encargos: salarios * 0.3,
      beneficios: salarios * 0.1,
      treinamento: 0,
      outros: 0,
      total: salarios + (salarios * 0.3) + (salarios * 0.1),
    };
    
    const total = 
      despesasVendas.total +
      despesasAdministrativas.total +
      despesasPessoal.total;
    
    return {
      vendas: despesasVendas,
      administrativas: despesasAdministrativas,
      pessoal: despesasPessoal,
      total: arredondarFinanceiro(total),
      percentualReceita: 0,
    };
  }
  
  /**
   * Calcula resultado financeiro
   */
  private static calcularResultadoFinanceiro(vendas: any[]) {
    // TODO: Implementar quando houver dados financeiros disponíveis
    
    const receitasFinanceiras = {
      jurosRecebidos: 0,
      descontosObtidos: 0,
      rendimentosAplicacoes: 0,
      outros: 0,
      total: 0,
    };
    
    const despesasFinanceiras = {
      jurosPagos: 0,
      tarifasBancarias: 50, // Estimativa
      iof: 0,
      multasJuros: 0,
      descontosConcedidos: 0,
      outros: 0,
      total: 50,
    };
    
    const saldo = receitasFinanceiras.total - despesasFinanceiras.total;
    
    return {
      receitasFinanceiras,
      despesasFinanceiras,
      saldo: arredondarFinanceiro(saldo),
      percentualReceita: 0,
    };
  }
  
  /**
   * Gera alertas baseados na DRE
   */
  private static gerarAlertasDRE(dados: {
    margemBrutaPercent: number;
    margemLiquidaPercent: number;
    receitaLiquida: number;
    lucroLiquido: number;
  }): string[] {
    const alertas: string[] = [];
    
    if (dados.margemBrutaPercent < 20) {
      alertas.push('Margem bruta abaixo de 20% - Revisar custos');
    }
    
    if (dados.margemLiquidaPercent < 5) {
      alertas.push('Margem líquida abaixo de 5% - Atenção à lucratividade');
    }
    
    if (dados.lucroLiquido < 0) {
      alertas.push('Operação em prejuízo');
    }
    
    return alertas;
  }
  
  /**
   * Cria DRE vazia
   */
  private static criarDREVazia(
    dataInicio: Date,
    dataFim: Date,
    tipo: 'mensal' | 'trimestral' | 'anual'
  ): DRECompleta {
    const vazio = {
      periodo: formatarPeriodoMensal(dataInicio),
      tipo,
      receitaBruta: 0,
      impostos: {
        simplesNacional: 0,
        total: 0,
        aliquotaEfetiva: 0,
      },
      descontosAbatimentos: 0,
      devolucoes: 0,
      totalDeducoes: 0,
      receitaLiquida: 0,
      cmv: {
        custoProdutos: 0,
        custoServicos: 0,
        fretes: 0,
        embalagens: 0,
        outros: 0,
        total: 0,
        percentualReceita: 0,
      },
      margemBruta: 0,
      margemBrutaPercent: 0,
      despesasOperacionais: {
        vendas: {
          comissoes: 0,
          marketing: 0,
          publicidade: 0,
          promocoes: 0,
          fretesEntrega: 0,
          outros: 0,
          total: 0,
        },
        administrativas: {
          aluguel: 0,
          contas: 0,
          materiais: 0,
          servicos: 0,
          manutencao: 0,
          seguros: 0,
          taxas: 0,
          outros: 0,
          total: 0,
        },
        pessoal: {
          salarios: 0,
          encargos: 0,
          beneficios: 0,
          treinamento: 0,
          outros: 0,
          total: 0,
        },
        total: 0,
        percentualReceita: 0,
      },
      ebitda: 0,
      ebitdaPercent: 0,
      depreciacaoAmortizacao: 0,
      ebit: 0,
      ebitPercent: 0,
      resultadoFinanceiro: {
        receitasFinanceiras: {
          jurosRecebidos: 0,
          descontosObtidos: 0,
          rendimentosAplicacoes: 0,
          outros: 0,
          total: 0,
        },
        despesasFinanceiras: {
          jurosPagos: 0,
          tarifasBancarias: 0,
          iof: 0,
          multasJuros: 0,
          descontosConcedidos: 0,
          outros: 0,
          total: 0,
        },
        saldo: 0,
        percentualReceita: 0,
      },
      lucroAntesImpostos: 0,
      lucroAntesImpostosPercent: 0,
      impostosLucro: 0,
      lucroLiquido: 0,
      lucroLiquidoPercent: 0,
      metadata: {
        dataInicio,
        dataFim,
        diasPeriodo: 0,
        moeda: 'BRL',
        metodoCalculo: 'competencia',
        observacoes: ['Sem vendas no período'],
        alertas: [],
      },
    };
    
    return vazio as DRECompleta;
  }
  
  /**
   * Cria linhas comparativas entre DREs
   */
  private static criarLinhasComparativas(dres: DRECompleta[]) {
    // TODO: Implementar lógica completa de comparação
    return [];
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default CEODREService;

