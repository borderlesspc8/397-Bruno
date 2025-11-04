/**
 * 📊 CEO DASHBOARD - SERVIÇO DE INDICADORES FINANCEIROS
 * 
 * Calcula TODOS os indicadores solicitados para o Dashboard CEO
 * Usa dados REAIS da API Betel
 * 
 * Indicadores Implementados:
 * ✅ 1. Indicadores de Eficiência Operacional
 * ✅ 2. Análise de Sazonalidade
 * ✅ 3. Indicadores de Liquidez
 * ✅ 4. Análise de Inadimplência
 * ✅ 5. Relatório de Sustentabilidade Financeira
 * ✅ 6. Previsibilidade de Receitas
 * ✅ 7. Análise DRE Simplificada
 * ✅ 8. Indicadores de Crescimento
 * ✅ 9. Dashboard de Metas Financeiras
 */

import type { BetelCompleteDados } from './betel-complete-api.service';

// ============================================================================
// INTERFACES DE RETORNO
// ============================================================================

export interface IndicadoresEficienciaOperacional {
  custoOperacionalSobreReceita: number; // %
  custoAquisicaoCliente: number; // CAC em R$
  rentabilidadePorCentroCusto: RentabilidadeCentroCusto[];
  ticketMedio: number;
  margemContribuicao: number; // %
}

export interface RentabilidadeCentroCusto {
  id: number;
  nome: string;
  receita: number;
  despesas: number;
  lucro: number;
  margem: number; // %
}

export interface AnaliseSazonalidade {
  meses: DadosMensais[];
  mediaReceita: number;
  mediaDespesa: number;
  mesComMaiorReceita: string;
  mesComMenorReceita: string;
  variabilidade: number; // Coeficiente de variação
}

export interface DadosMensais {
  mes: string;
  ano: number;
  receita: number;
  despesa: number;
  lucro: number;
  margem: number;
}

export interface IndicadoresLiquidez {
  liquidezCorrente: number;
  liquidezImediata: number;
  capitalGiro: number;
  cicloConversaoCaixa: number; // dias
  saldoDisponivel: number;
}

export interface AnaliseInadimplencia {
  taxaInadimplencia: number; // %
  valorInadimplente: number;
  valorReceber: number;
  agingRecebíveis: AgingRecebiveis[];
  ticketMedioInadimplente: number;
}

export interface AgingRecebiveis {
  faixa: string; // "0-30 dias", "31-60 dias", etc.
  quantidade: number;
  valorTotal: number;
  percentual: number;
}

export interface SustentabilidadeFinanceira {
  coberturaReservas: number; // meses
  capitalProprioSobreTerceiros: number;
  endividamento: number; // %
  saudeFinanceira: 'Excelente' | 'Boa' | 'Atenção' | 'Crítica';
  reservasAtuais: number;
  despesasMensaisMedias: number;
}

export interface PrevisibilidadeReceitas {
  receitasRecorrentes: number;
  receitasPontuais: number;
  percentualRecorrente: number; // %
  desviadoPadrao: number;
  coeficienteVariacao: number; // %
  estabilidade: 'Alta' | 'Média' | 'Baixa';
}

export interface DRESimplificada {
  receitaBruta: number;
  impostos: number;
  receitaLiquida: number;
  cmv: number; // Custo Mercadoria Vendida
  margemBruta: number;
  margemBrutaPercent: number;
  despesasOperacionais: number;
  lucroOperacional: number;
  lucroOperacionalPercent: number;
  resultadoFinanceiro: number;
  lucroLiquido: number;
  lucroLiquidoPercent: number;
}

export interface IndicadoresCrescimento {
  crescimentoMoM: number; // % Month over Month
  crescimentoYoY: number; // % Year over Year
  crescimentoMedioMensal: number; // %
  tendencia: 'Crescimento' | 'Estável' | 'Declínio';
  projecaoProximoMes: number;
  atingimentoMeta: number; // %
}

export interface MetasFinanceiras {
  metaReceitaMensal: number;
  receitaAtual: number;
  percentualAtingimento: number;
  faltaParaMeta: number;
  metaMargemLiquida: number;
  margemLiquidaAtual: number;
  metaTicketMedio: number;
  ticketMedioAtual: number;
  status: 'Superou' | 'Atingiu' | 'Próximo' | 'Distante';
}

export interface TodosIndicadores {
  eficienciaOperacional: IndicadoresEficienciaOperacional;
  sazonalidade: AnaliseSazonalidade;
  liquidez: IndicadoresLiquidez;
  inadimplencia: AnaliseInadimplencia;
  sustentabilidade: SustentabilidadeFinanceira;
  previsibilidade: PrevisibilidadeReceitas;
  dre: DRESimplificada;
  crescimento: IndicadoresCrescimento;
  metas: MetasFinanceiras;
  ultimaAtualizacao: string;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class CEOIndicadoresService {
  /**
   * 🎯 CALCULAR TODOS OS INDICADORES
   */
  static calcularTodosIndicadores(dados: BetelCompleteDados): TodosIndicadores {
    console.log('📊 [CEOIndicadores] Calculando TODOS os indicadores...');
    
    return {
      eficienciaOperacional: this.calcularEficienciaOperacional(dados),
      sazonalidade: this.calcularSazonalidade(dados),
      liquidez: this.calcularLiquidez(dados),
      inadimplencia: this.calcularInadimplencia(dados),
      sustentabilidade: this.calcularSustentabilidade(dados),
      previsibilidade: this.calcularPrevisibilidade(dados),
      dre: this.calcularDRE(dados),
      crescimento: this.calcularCrescimento(dados),
      metas: this.calcularMetas(dados),
      ultimaAtualizacao: new Date().toISOString(),
    };
  }
  
  /**
   * 1️⃣ INDICADORES DE EFICIÊNCIA OPERACIONAL
   */
  private static calcularEficienciaOperacional(dados: BetelCompleteDados): IndicadoresEficienciaOperacional {
    // Receita total
    const receitaTotal = dados.vendas.reduce((sum, v) => sum + this.parseNumber(v.valor_total), 0);
    
    // Despesas operacionais (pagamentos liquidados)
    const despesasOperacionais = dados.pagamentos
      .filter(p => p.liquidado === '1' || p.liquidado === 'Sim')
      .reduce((sum, p) => sum + this.parseNumber(p.valor_total || p.valor), 0);
    
    // Custo sobre receita
    const custoOperacionalSobreReceita = receitaTotal > 0 ? (despesasOperacionais / receitaTotal) * 100 : 0;
    
    // CAC - Custo de Aquisição de Cliente
    const despesasMarketing = dados.pagamentos
      .filter(p => p.liquidado === '1' && this.isDespesaMarketing(p))
      .reduce((sum, p) => sum + parseFloat(p.valor || '0'), 0);
    
    const novosClientes = this.contarNovosClientes(dados);
    const custoAquisicaoCliente = novosClientes > 0 ? despesasMarketing / novosClientes : 0;
    
    // Rentabilidade por Centro de Custo
    const rentabilidadePorCentroCusto = this.calcularRentabilidadeCentroCusto(dados);
    
    // Ticket Médio
    const ticketMedio = dados.vendas.length > 0 ? receitaTotal / dados.vendas.length : 0;
    
    // Margem de Contribuição (usando valor_custo das vendas)
    const custosProdutos = dados.vendas.reduce((sum, v) => sum + this.parseNumber(v.valor_custo), 0);
    const margemContribuicao = receitaTotal > 0 ? ((receitaTotal - custosProdutos) / receitaTotal) * 100 : 0;
    
    return {
      custoOperacionalSobreReceita,
      custoAquisicaoCliente,
      rentabilidadePorCentroCusto,
      ticketMedio,
      margemContribuicao,
    };
  }
  
  /**
   * 2️⃣ ANÁLISE DE SAZONALIDADE
   */
  private static calcularSazonalidade(dados: BetelCompleteDados): AnaliseSazonalidade {
    // Agrupar por mês
    const dadosPorMes = new Map<string, DadosMensais>();
    
    dados.vendas.forEach(venda => {
      const data = new Date(venda.data);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      if (!dadosPorMes.has(chave)) {
        dadosPorMes.set(chave, {
          mes: chave,
          ano: data.getFullYear(),
          receita: 0,
          despesa: 0,
          lucro: 0,
          margem: 0,
        });
      }
      
      const registro = dadosPorMes.get(chave)!;
      registro.receita += this.parseNumber(venda.valor_total);
    });
    
    // Adicionar despesas
    dados.pagamentos.forEach(pag => {
      if ((pag.liquidado === '1' || pag.liquidado === 'Sim') && pag.data_liquidacao) {
        const data = new Date(pag.data_liquidacao);
        const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
        
        if (dadosPorMes.has(chave)) {
          const registro = dadosPorMes.get(chave)!;
          registro.despesa += this.parseNumber(pag.valor_total || pag.valor);
        }
      }
    });
    
    // Calcular lucro e margem
    dadosPorMes.forEach(registro => {
      registro.lucro = registro.receita - registro.despesa;
      registro.margem = registro.receita > 0 ? (registro.lucro / registro.receita) * 100 : 0;
    });
    
    const meses = Array.from(dadosPorMes.values()).sort((a, b) => a.mes.localeCompare(b.mes));
    
    // Cálculos estatísticos
    const receitas = meses.map(m => m.receita);
    const mediaReceita = receitas.reduce((a, b) => a + b, 0) / receitas.length || 0;
    const mediaDespesa = meses.reduce((s, m) => s + m.despesa, 0) / meses.length || 0;
    
    const mesComMaiorReceita = meses.reduce((max, m) => m.receita > max.receita ? m : max, meses[0] || { receita: 0, mes: '' }).mes;
    const mesComMenorReceita = meses.reduce((min, m) => m.receita < min.receita ? m : min, meses[0] || { receita: Infinity, mes: '' }).mes;
    
    // Coeficiente de variação
    const desvioPadrao = this.calcularDesvioPadrao(receitas);
    const variabilidade = mediaReceita > 0 ? (desvioPadrao / mediaReceita) * 100 : 0;
    
    return {
      meses,
      mediaReceita,
      mediaDespesa,
      mesComMaiorReceita,
      mesComMenorReceita,
      variabilidade,
    };
  }
  
  /**
   * 3️⃣ INDICADORES DE LIQUIDEZ
   */
  private static calcularLiquidez(dados: BetelCompleteDados): IndicadoresLiquidez {
    // Saldo disponível - API não retorna campo saldo, calcular de recebimentos/pagamentos
    const recebimentosLiquidados = dados.recebimentos
      .filter(r => r.liquidado === '1' || r.liquidado === 'Sim')
      .reduce((sum, r) => sum + this.parseNumber(r.valor_total || r.valor), 0);
    
    const pagamentosLiquidados = dados.pagamentos
      .filter(p => p.liquidado === '1' || p.liquidado === 'Sim')
      .reduce((sum, p) => sum + this.parseNumber(p.valor_total || p.valor), 0);
    
    const saldoDisponivel = recebimentosLiquidados - pagamentosLiquidados;
    
    // Contas a receber (não liquidados)
    const contasReceber = dados.recebimentos
      .filter(r => r.liquidado === '0' || r.liquidado === 'Não' || !r.liquidado)
      .reduce((sum, r) => sum + this.parseNumber(r.valor_total || r.valor), 0);
    
    // Contas a pagar (não liquidados)
    const contasPagar = dados.pagamentos
      .filter(p => p.liquidado === '0' || p.liquidado === 'Não' || !p.liquidado)
      .reduce((sum, p) => sum + this.parseNumber(p.valor_total || p.valor), 0);
    
    // Ativos circulantes = Saldo + Contas a Receber
    const ativosCirculantes = saldoDisponivel + contasReceber;
    
    // Passivos circulantes = Contas a Pagar
    const passivosCirculantes = contasPagar;
    
    // Liquidez Corrente = Ativo Circulante / Passivo Circulante
    const liquidezCorrente = passivosCirculantes > 0 ? ativosCirculantes / passivosCirculantes : 0;
    
    // Liquidez Imediata = Disponível / Passivo Circulante
    const liquidezImediata = passivosCirculantes > 0 ? saldoDisponivel / passivosCirculantes : 0;
    
    // Capital de Giro = Ativo Circulante - Passivo Circulante
    const capitalGiro = ativosCirculantes - passivosCirculantes;
    
    // Ciclo de Conversão de Caixa (estimado)
    const prazoMedioRecebimento = 30; // Simplificado - pode ser calculado com mais dados
    const prazoMedioPagamento = 30; // Simplificado
    const cicloConversaoCaixa = prazoMedioRecebimento - prazoMedioPagamento;
    
    return {
      liquidezCorrente,
      liquidezImediata,
      capitalGiro,
      cicloConversaoCaixa,
      saldoDisponivel,
    };
  }
  
  /**
   * 4️⃣ ANÁLISE DE INADIMPLÊNCIA
   */
  private static calcularInadimplencia(dados: BetelCompleteDados): AnaliseInadimplencia {
    const hoje = new Date();
    
    // Recebimentos em aberto
    const recebimentosAberto = dados.recebimentos.filter(r => r.liquidado === '0');
    
    // Valor total a receber
    const valorReceber = recebimentosAberto.reduce((sum, r) => sum + parseFloat(r.valor || '0'), 0);
    
    // Inadimplentes (vencidos)
    const inadimplentes = recebimentosAberto.filter(r => {
      const dataVencimento = new Date(r.data_vencimento);
      return dataVencimento < hoje;
    });
    
    const valorInadimplente = inadimplentes.reduce((sum, r) => sum + parseFloat(r.valor || '0'), 0);
    
    // Taxa de inadimplência
    const taxaInadimplencia = valorReceber > 0 ? (valorInadimplente / valorReceber) * 100 : 0;
    
    // Aging de Recebíveis
    const agingRecebíveis = this.calcularAgingRecebiveis(inadimplentes, valorInadimplente);
    
    // Ticket Médio Inadimplente
    const ticketMedioInadimplente = inadimplentes.length > 0 ? valorInadimplente / inadimplentes.length : 0;
    
    return {
      taxaInadimplencia,
      valorInadimplente,
      valorReceber,
      agingRecebíveis,
      ticketMedioInadimplente,
    };
  }
  
  /**
   * 5️⃣ SUSTENTABILIDADE FINANCEIRA
   */
  private static calcularSustentabilidade(dados: BetelCompleteDados): SustentabilidadeFinanceira {
    // Reservas atuais (saldo em caixa)
    const reservasAtuais = dados.contasBancarias
      .filter(c => c.ativo)
      .reduce((sum, c) => sum + parseFloat(c.saldo || '0'), 0);
    
    // Despesas mensais médias
    const despesasPagas = dados.pagamentos
      .filter(p => p.liquidado === '1')
      .reduce((sum, p) => sum + parseFloat(p.valor || '0'), 0);
    
    const mesesAnalisados = this.contarMesesUnicos(dados.pagamentos.map(p => p.data_vencimento));
    const despesasMensaisMedias = mesesAnalisados > 0 ? despesasPagas / mesesAnalisados : 0;
    
    // Cobertura de reservas (em meses)
    const coberturaReservas = despesasMensaisMedias > 0 ? reservasAtuais / despesasMensaisMedias : 0;
    
    // Capital próprio vs terceiros
    const capitalProprio = reservasAtuais;
    const capitalTerceiros = dados.pagamentos
      .filter(p => p.liquidado === '0')
      .reduce((sum, p) => sum + parseFloat(p.valor || '0'), 0);
    
    const capitalProprioSobreTerceiros = capitalTerceiros > 0 ? capitalProprio / capitalTerceiros : 0;
    
    // Endividamento
    const endividamento = (capitalProprio + capitalTerceiros) > 0 
      ? (capitalTerceiros / (capitalProprio + capitalTerceiros)) * 100 
      : 0;
    
    // Saúde Financeira
    let saudeFinanceira: 'Excelente' | 'Boa' | 'Atenção' | 'Crítica' = 'Crítica';
    if (coberturaReservas >= 6 && endividamento < 30) saudeFinanceira = 'Excelente';
    else if (coberturaReservas >= 3 && endividamento < 50) saudeFinanceira = 'Boa';
    else if (coberturaReservas >= 1 && endividamento < 70) saudeFinanceira = 'Atenção';
    
    return {
      coberturaReservas,
      capitalProprioSobreTerceiros,
      endividamento,
      saudeFinanceira,
      reservasAtuais,
      despesasMensaisMedias,
    };
  }
  
  /**
   * 6️⃣ PREVISIBILIDADE DE RECEITAS
   */
  private static calcularPrevisibilidade(dados: BetelCompleteDados): PrevisibilidadeReceitas {
    // Receitas recorrentes (clientes que compraram mais de 1x)
    const comprasPorCliente = new Map<number, number>();
    dados.vendas.forEach(v => {
      const atual = comprasPorCliente.get(v.cliente_id) || 0;
      comprasPorCliente.set(v.cliente_id, atual + parseFloat(v.valor_liquido || '0'));
    });
    
    const clientesRecorrentes = Array.from(comprasPorCliente.values()).filter((_, i) => {
      // Verificar se cliente tem mais de 1 venda
      const vendas = dados.vendas.filter(v => Array.from(comprasPorCliente.keys())[i] === v.cliente_id);
      return vendas.length > 1;
    });
    
    const receitasRecorrentes = clientesRecorrentes.reduce((sum, valor) => sum + valor, 0);
    const receitaTotal = dados.vendas.reduce((sum, v) => sum + parseFloat(v.valor_liquido || '0'), 0);
    const receitasPontuais = receitaTotal - receitasRecorrentes;
    
    const percentualRecorrente = receitaTotal > 0 ? (receitasRecorrentes / receitaTotal) * 100 : 0;
    
    // Variabilidade
    const receitasMensais = this.agruparReceitasMensais(dados.vendas);
    const desviadoPadrao = this.calcularDesvioPadrao(receitasMensais);
    const media = receitasMensais.reduce((a, b) => a + b, 0) / receitasMensais.length || 1;
    const coeficienteVariacao = (desviadoPadrao / media) * 100;
    
    // Estabilidade
    let estabilidade: 'Alta' | 'Média' | 'Baixa' = 'Baixa';
    if (coeficienteVariacao < 15) estabilidade = 'Alta';
    else if (coeficienteVariacao < 30) estabilidade = 'Média';
    
    return {
      receitasRecorrentes,
      receitasPontuais,
      percentualRecorrente,
      desviadoPadrao,
      coeficienteVariacao,
      estabilidade,
    };
  }
  
  /**
   * 7️⃣ DRE SIMPLIFICADA
   */
  private static calcularDRE(dados: BetelCompleteDados): DRESimplificada {
    // Receita Bruta - soma dos valores totais das vendas
    const receitaBruta = dados.vendas.reduce((sum, v) => sum + this.parseNumber(v.valor_total), 0);
    
    // Impostos (estimado 15% - pode ser ajustado)
    const impostos = dados.notasFiscaisProdutos
      .concat(dados.notasFiscaisServicos)
      .concat(dados.notasFiscaisConsumidores)
      .reduce((sum, nf) => sum + parseFloat(nf.valor_impostos || '0'), 0) || receitaBruta * 0.15;
    
    // Receita Líquida
    const receitaLiquida = receitaBruta - impostos;
    
    // CMV - Custo de Mercadoria Vendida (valor_custo das vendas)
    const cmv = dados.vendas.reduce((sum, v) => sum + this.parseNumber(v.valor_custo), 0);
    
    // Margem Bruta
    const margemBruta = receitaLiquida - cmv;
    const margemBrutaPercent = receitaLiquida > 0 ? (margemBruta / receitaLiquida) * 100 : 0;
    
    // Despesas Operacionais (pagamentos liquidados)
    const despesasOperacionais = dados.pagamentos
      .filter(p => p.liquidado === '1' || p.liquidado === 'Sim')
      .reduce((sum, p) => sum + this.parseNumber(p.valor_total || p.valor), 0);
    
    // Lucro Operacional
    const lucroOperacional = margemBruta - despesasOperacionais;
    const lucroOperacionalPercent = receitaLiquida > 0 ? (lucroOperacional / receitaLiquida) * 100 : 0;
    
    // Resultado Financeiro (recebimentos - pagamentos de juros/taxas)
    const resultadoFinanceiro = 0; // Simplificado - pode ser calculado com mais detalhes
    
    // Lucro Líquido
    const lucroLiquido = lucroOperacional + resultadoFinanceiro;
    const lucroLiquidoPercent = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;
    
    return {
      receitaBruta,
      impostos,
      receitaLiquida,
      cmv,
      margemBruta,
      margemBrutaPercent,
      despesasOperacionais,
      lucroOperacional,
      lucroOperacionalPercent,
      resultadoFinanceiro,
      lucroLiquido,
      lucroLiquidoPercent,
    };
  }
  
  /**
   * 8️⃣ INDICADORES DE CRESCIMENTO
   */
  private static calcularCrescimento(dados: BetelCompleteDados): IndicadoresCrescimento {
    const receitasMensais = this.agruparReceitasMensaisComData(dados.vendas);
    
    if (receitasMensais.length < 2) {
      return {
        crescimentoMoM: 0,
        crescimentoYoY: 0,
        crescimentoMedioMensal: 0,
        tendencia: 'Estável',
        projecaoProximoMes: 0,
        atingimentoMeta: 0,
      };
    }
    
    // Crescimento MoM (mês atual vs mês anterior)
    const mesAtual = receitasMensais[receitasMensais.length - 1].valor;
    const mesAnterior = receitasMensais[receitasMensais.length - 2].valor;
    const crescimentoMoM = mesAnterior > 0 ? ((mesAtual - mesAnterior) / mesAnterior) * 100 : 0;
    
    // Crescimento YoY (mês atual vs mesmo mês ano anterior)
    const mesAnoPassado = receitasMensais.find(r => {
      const atual = receitasMensais[receitasMensais.length - 1];
      return r.ano === atual.ano - 1 && r.mes === atual.mes;
    });
    const crescimentoYoY = mesAnoPassado ? ((mesAtual - mesAnoPassado.valor) / mesAnoPassado.valor) * 100 : 0;
    
    // Crescimento médio mensal
    let somaVariacoes = 0;
    for (let i = 1; i < receitasMensais.length; i++) {
      const anterior = receitasMensais[i - 1].valor;
      const atual = receitasMensais[i].valor;
      if (anterior > 0) {
        somaVariacoes += ((atual - anterior) / anterior) * 100;
      }
    }
    const crescimentoMedioMensal = receitasMensais.length > 1 ? somaVariacoes / (receitasMensais.length - 1) : 0;
    
    // Tendência
    let tendencia: 'Crescimento' | 'Estável' | 'Declínio' = 'Estável';
    if (crescimentoMedioMensal > 2) tendencia = 'Crescimento';
    else if (crescimentoMedioMensal < -2) tendencia = 'Declínio';
    
    // Projeção próximo mês (usando média móvel simples)
    const projecaoProximoMes = mesAtual * (1 + (crescimentoMedioMensal / 100));
    
    // Atingimento de meta (exemplo: meta = média * 1.1)
    const meta = (receitasMensais.reduce((sum, r) => sum + r.valor, 0) / receitasMensais.length) * 1.1;
    const atingimentoMeta = meta > 0 ? (mesAtual / meta) * 100 : 0;
    
    return {
      crescimentoMoM,
      crescimentoYoY,
      crescimentoMedioMensal,
      tendencia,
      projecaoProximoMes,
      atingimentoMeta,
    };
  }
  
  /**
   * 9️⃣ METAS FINANCEIRAS
   */
  private static calcularMetas(dados: BetelCompleteDados): MetasFinanceiras {
    const dre = this.calcularDRE(dados);
    const eficiencia = this.calcularEficienciaOperacional(dados);
    
    // Receita média dos últimos meses
    const receitasMensais = this.agruparReceitasMensais(dados.vendas);
    const receitaMedia = receitasMensais.reduce((sum, r) => sum + r, 0) / receitasMensais.length || 0;
    
    // Metas (podem ser configuradas)
    const metaReceitaMensal = receitaMedia * 1.15; // Meta = 15% acima da média
    const receitaAtual = receitasMensais[receitasMensais.length - 1] || 0;
    const percentualAtingimento = metaReceitaMensal > 0 ? (receitaAtual / metaReceitaMensal) * 100 : 0;
    const faltaParaMeta = Math.max(0, metaReceitaMensal - receitaAtual);
    
    // Meta margem líquida
    const metaMargemLiquida = 20; // 20%
    const margemLiquidaAtual = dre.lucroLiquidoPercent;
    
    // Meta ticket médio
    const metaTicketMedio = eficiencia.ticketMedio * 1.1; // 10% acima do atual
    const ticketMedioAtual = eficiencia.ticketMedio;
    
    // Status
    let status: 'Superou' | 'Atingiu' | 'Próximo' | 'Distante' = 'Distante';
    if (percentualAtingimento >= 100) status = 'Superou';
    else if (percentualAtingimento >= 90) status = 'Atingiu';
    else if (percentualAtingimento >= 75) status = 'Próximo';
    
    return {
      metaReceitaMensal,
      receitaAtual,
      percentualAtingimento,
      faltaParaMeta,
      metaMargemLiquida,
      margemLiquidaAtual,
      metaTicketMedio,
      ticketMedioAtual,
      status,
    };
  }
  
  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================
  
  private static isDespesaMarketing(pagamento: any): boolean {
    const descricao = (pagamento.descricao || '').toLowerCase();
    const keywords = ['marketing', 'publicidade', 'anuncio', 'propaganda', 'google', 'facebook', 'instagram', 'ads'];
    return keywords.some(k => descricao.includes(k));
  }
  
  private static contarNovosClientes(dados: BetelCompleteDados): number {
    // Simplificado - contar clientes únicos no período
    const clientesUnicos = new Set(dados.vendas.map(v => v.cliente_id));
    return clientesUnicos.size;
  }
  
  private static calcularRentabilidadeCentroCusto(dados: BetelCompleteDados): RentabilidadeCentroCusto[] {
    const resultado = new Map<number, RentabilidadeCentroCusto>();
    
    // Inicializar centros de custo
    dados.centrosCustos.forEach(cc => {
      resultado.set(cc.id, {
        id: cc.id,
        nome: cc.nome,
        receita: 0,
        despesas: 0,
        lucro: 0,
        margem: 0,
      });
    });
    
    // Somar despesas
    dados.pagamentos.forEach(p => {
      if (p.liquidado === '1' && p.centro_custo_id) {
        const cc = resultado.get(p.centro_custo_id);
        if (cc) {
          cc.despesas += parseFloat(p.valor || '0');
        }
      }
    });
    
    // Calcular lucro e margem
    resultado.forEach(cc => {
      cc.lucro = cc.receita - cc.despesas;
      cc.margem = cc.receita > 0 ? (cc.lucro / cc.receita) * 100 : 0;
    });
    
    return Array.from(resultado.values());
  }
  
  private static calcularAgingRecebiveis(inadimplentes: any[], total: number): AgingRecebiveis[] {
    const hoje = new Date();
    const faixas = [
      { nome: '0-30 dias', min: 0, max: 30, quantidade: 0, valor: 0 },
      { nome: '31-60 dias', min: 31, max: 60, quantidade: 0, valor: 0 },
      { nome: '61-90 dias', min: 61, max: 90, quantidade: 0, valor: 0 },
      { nome: '> 90 dias', min: 91, max: Infinity, quantidade: 0, valor: 0 },
    ];
    
    inadimplentes.forEach(r => {
      const diasAtraso = Math.floor((hoje.getTime() - new Date(r.data_vencimento).getTime()) / (1000 * 60 * 60 * 24));
      const valor = parseFloat(r.valor || '0');
      
      const faixa = faixas.find(f => diasAtraso >= f.min && diasAtraso <= f.max);
      if (faixa) {
        faixa.quantidade++;
        faixa.valor += valor;
      }
    });
    
    return faixas.map(f => ({
      faixa: f.nome,
      quantidade: f.quantidade,
      valorTotal: f.valor,
      percentual: total > 0 ? (f.valor / total) * 100 : 0,
    }));
  }
  
  private static agruparReceitasMensais(vendas: any[]): number[] {
    const porMes = new Map<string, number>();
    
    vendas.forEach(v => {
      const data = new Date(v.data);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      const atual = porMes.get(chave) || 0;
      porMes.set(chave, atual + this.parseNumber(v.valor_total));
    });
    
    return Array.from(porMes.values());
  }
  
  private static agruparReceitasMensaisComData(vendas: any[]): { mes: number; ano: number; valor: number }[] {
    const porMes = new Map<string, { mes: number; ano: number; valor: number }>();
    
    vendas.forEach(v => {
      const data = new Date(v.data);
      const mes = data.getMonth() + 1;
      const ano = data.getFullYear();
      const chave = `${ano}-${String(mes).padStart(2, '0')}`;
      
      if (!porMes.has(chave)) {
        porMes.set(chave, { mes, ano, valor: 0 });
      }
      
      const registro = porMes.get(chave)!;
      registro.valor += this.parseNumber(v.valor_total);
    });
    
    return Array.from(porMes.values()).sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      return a.mes - b.mes;
    });
  }
  
  private static calcularDesvioPadrao(valores: number[]): number {
    if (valores.length === 0) return 0;
    
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const variancia = valores.reduce((sum, v) => sum + Math.pow(v - media, 2), 0) / valores.length;
    return Math.sqrt(variancia);
  }
  
  private static contarMesesUnicos(datas: string[]): number {
    const mesesUnicos = new Set<string>();
    datas.forEach(d => {
      if (d) {
        const data = new Date(d);
        const chave = `${data.getFullYear()}-${data.getMonth()}`;
        mesesUnicos.add(chave);
      }
    });
    return mesesUnicos.size;
  }
  
  /**
   * Converte string para número de forma segura
   */
  private static parseNumber(value: string | number | undefined | null): number {
    if (value === undefined || value === null || value === '') return 0;
    
    // Se já é número
    if (typeof value === 'number') {
      // Verificar se parece estar em centavos (inteiro muito grande)
      if (Number.isInteger(value)) {
        const valorAbs = Math.abs(value);
        // Se é inteiro e muito grande (> 10000), provavelmente está em centavos
        if (valorAbs > 10000) {
          return value / 100;
        }
      }
      return value;
    }
    
    // Se é string, tratar formatos brasileiro/americano e centavos
    const valorStr = String(value).trim();
    
    // Remover caracteres não numéricos exceto vírgula, ponto e menos
    let valorLimpo = valorStr.replace(/[^\d,.-]/g, '');
    
    // Detectar formato: brasileiro "1.234,56" ou americano "1234.56"
    const temVirgula = valorLimpo.includes(',');
    const temPonto = valorLimpo.includes('.');
    
    if (temVirgula && temPonto) {
      // Tem ambos: determinar qual é decimal
      const ultimaVirgula = valorLimpo.lastIndexOf(',');
      const ultimoPonto = valorLimpo.lastIndexOf('.');
      
      if (ultimaVirgula > ultimoPonto) {
        // Vírgula vem depois = formato brasileiro "1.234,56"
        valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
      } else {
        // Ponto vem depois = formato americano "1,234.56"
        valorLimpo = valorLimpo.replace(/,/g, '');
      }
    } else if (temVirgula) {
      // Só tem vírgula = formato brasileiro sem milhar "1234,56"
      valorLimpo = valorLimpo.replace(',', '.');
    } else if (temPonto) {
      // Só tem ponto - pode ser decimal ou milhar
      const partes = valorLimpo.split('.');
      
      if (partes.length === 2) {
        // Tem exatamente 2 partes: "1234.56" ou "1.234"
        const parteDepois = partes[1];
        
        if (parteDepois.length <= 2) {
          // Última parte tem 1-2 dígitos = formato decimal "10836.30"
          // Manter como está (já está correto para parseFloat)
        } else {
          // Última parte tem mais de 2 dígitos = provavelmente separador de milhar "1.2345"
          valorLimpo = partes.join('');
        }
      } else if (partes.length > 2) {
        // Múltiplos pontos = separadores de milhar "1.234.567"
        const ultimaParte = partes[partes.length - 1];
        if (ultimaParte.length <= 2) {
          // Última parte tem 1-2 dígitos = decimal
          valorLimpo = partes.slice(0, -1).join('') + '.' + ultimaParte;
        } else {
          // Sem decimais, remover todos os pontos
          valorLimpo = partes.join('');
        }
      }
    }
    
    // Converter para número
    const parsed = parseFloat(valorLimpo);
    
    // Se o valor resultante é muito grande (inteiro > 100000) e não tinha separador decimal claro, pode estar em centavos
    if (!temVirgula && !temPonto && !isNaN(parsed)) {
      const valorAbs = Math.abs(parsed);
      if (valorAbs > 100000 && Number.isInteger(valorAbs)) {
        return parsed / 100;
      }
    }
    
    return isNaN(parsed) ? 0 : parsed;
  }
}

export default CEOIndicadoresService;

