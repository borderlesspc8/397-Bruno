/**
 * 💰 CEO DASHBOARD - CÁLCULOS FINANCEIROS
 * 
 * Funções para cálculos financeiros e indicadores
 */

import { calcularMedia, calcularDesvioPadrao, calcularCoeficienteVariacao } from './estatistica';

// ============================================================================
// MARGENS E RENTABILIDADE
// ============================================================================

/**
 * Calcula a margem bruta
 */
export function calcularMargemBruta(receita: number, custo: number): number {
  if (receita === 0) return 0;
  return ((receita - custo) / receita) * 100;
}

/**
 * Calcula a margem líquida
 */
export function calcularMargemLiquida(receitaLiquida: number, lucroLiquido: number): number {
  if (receitaLiquida === 0) return 0;
  return (lucroLiquido / receitaLiquida) * 100;
}

/**
 * Calcula a margem operacional
 */
export function calcularMargemOperacional(receitaLiquida: number, lucroOperacional: number): number {
  if (receitaLiquida === 0) return 0;
  return (lucroOperacional / receitaLiquida) * 100;
}

/**
 * Calcula o ROI (Return on Investment)
 */
export function calcularROI(lucro: number, investimento: number): number {
  if (investimento === 0) return 0;
  return (lucro / investimento) * 100;
}

/**
 * Calcula o ROE (Return on Equity)
 */
export function calcularROE(lucroLiquido: number, patrimonioLiquido: number): number {
  if (patrimonioLiquido === 0) return 0;
  return (lucroLiquido / patrimonioLiquido) * 100;
}

/**
 * Calcula o ROA (Return on Assets)
 */
export function calcularROA(lucroLiquido: number, ativoTotal: number): number {
  if (ativoTotal === 0) return 0;
  return (lucroLiquido / ativoTotal) * 100;
}

/**
 * Calcula markup sobre custo
 */
export function calcularMarkup(precoVenda: number, custo: number): number {
  if (custo === 0) return 0;
  return ((precoVenda - custo) / custo) * 100;
}

// ============================================================================
// INDICADORES DE LIQUIDEZ
// ============================================================================

/**
 * Calcula liquidez corrente
 */
export function calcularLiquidezCorrente(ativosCirculantes: number, passivosCirculantes: number): number {
  if (passivosCirculantes === 0) return 0;
  return ativosCirculantes / passivosCirculantes;
}

/**
 * Calcula liquidez seca
 */
export function calcularLiquidezSeca(
  ativosCirculantes: number,
  estoques: number,
  passivosCirculantes: number
): number {
  if (passivosCirculantes === 0) return 0;
  return (ativosCirculantes - estoques) / passivosCirculantes;
}

/**
 * Calcula liquidez imediata
 */
export function calcularLiquidezImediata(disponibilidades: number, passivosCirculantes: number): number {
  if (passivosCirculantes === 0) return 0;
  return disponibilidades / passivosCirculantes;
}

/**
 * Classifica status de liquidez
 */
export function classificarLiquidez(indice: number): 'excelente' | 'bom' | 'adequado' | 'atencao' | 'critico' {
  if (indice >= 2.0) return 'excelente';
  if (indice >= 1.5) return 'bom';
  if (indice >= 1.0) return 'adequado';
  if (indice >= 0.5) return 'atencao';
  return 'critico';
}

// ============================================================================
// CICLO FINANCEIRO
// ============================================================================

/**
 * Calcula o Prazo Médio de Recebimento (PMR)
 */
export function calcularPMR(contasReceber: number, receitaMediaDiaria: number): number {
  if (receitaMediaDiaria === 0) return 0;
  return contasReceber / receitaMediaDiaria;
}

/**
 * Calcula o Prazo Médio de Pagamento (PMP)
 */
export function calcularPMP(contasPagar: number, comprasMediaDiaria: number): number {
  if (comprasMediaDiaria === 0) return 0;
  return contasPagar / comprasMediaDiaria;
}

/**
 * Calcula o Prazo Médio de Estoque (PME)
 */
export function calcularPME(estoqueAtual: number, custoVendasMedioDiario: number): number {
  if (custoVendasMedioDiario === 0) return 0;
  return estoqueAtual / custoVendasMedioDiario;
}

/**
 * Calcula o Ciclo de Conversão de Caixa
 * CCC = PMR + PME - PMP
 */
export function calcularCicloConversaoCaixa(pmr: number, pme: number, pmp: number): number {
  return pmr + pme - pmp;
}

/**
 * Classifica ciclo de conversão
 */
export function classificarCicloConversao(diasCiclo: number): 'excelente' | 'bom' | 'atencao' | 'critico' {
  if (diasCiclo <= 30) return 'excelente';
  if (diasCiclo <= 60) return 'bom';
  if (diasCiclo <= 90) return 'atencao';
  return 'critico';
}

// ============================================================================
// ENDIVIDAMENTO
// ============================================================================

/**
 * Calcula índice de endividamento geral
 */
export function calcularEndividamentoGeral(passivoTotal: number, ativoTotal: number): number {
  if (ativoTotal === 0) return 0;
  return (passivoTotal / ativoTotal) * 100;
}

/**
 * Calcula composição do endividamento
 */
export function calcularComposicaoEndividamento(passivoCurtoPrazo: number, passivoTotal: number): number {
  if (passivoTotal === 0) return 0;
  return (passivoCurtoPrazo / passivoTotal) * 100;
}

/**
 * Calcula garantia ao capital de terceiros
 */
export function calcularGarantiaCapitalTerceiros(patrimonioLiquido: number, passivoTotal: number): number {
  if (passivoTotal === 0) return 0;
  return (patrimonioLiquido / passivoTotal) * 100;
}

/**
 * Classifica endividamento
 */
export function classificarEndividamento(percentual: number): 'saudavel' | 'atencao' | 'critico' {
  if (percentual <= 50) return 'saudavel';
  if (percentual <= 70) return 'atencao';
  return 'critico';
}

// ============================================================================
// INADIMPLÊNCIA
// ============================================================================

/**
 * Calcula taxa de inadimplência
 */
export function calcularTaxaInadimplencia(valorVencido: number, valorTotal: number): number {
  if (valorTotal === 0) return 0;
  return (valorVencido / valorTotal) * 100;
}

/**
 * Calcula provisão para devedores duvidosos
 */
export function calcularProvisaoDevedores(valorReceber: number, taxaProvisao: number = 5): number {
  return valorReceber * (taxaProvisao / 100);
}

/**
 * Calcula taxa de recuperação
 */
export function calcularTaxaRecuperacao(valorRecuperado: number, valorVencido: number): number {
  if (valorVencido === 0) return 0;
  return (valorRecuperado / valorVencido) * 100;
}

/**
 * Classifica inadimplência
 */
export function classificarInadimplencia(percentual: number): 'excelente' | 'bom' | 'atencao' | 'critico' {
  if (percentual <= 2) return 'excelente';
  if (percentual <= 5) return 'bom';
  if (percentual <= 10) return 'atencao';
  return 'critico';
}

// ============================================================================
// EFICIÊNCIA E PRODUTIVIDADE
// ============================================================================

/**
 * Calcula relação custos/receita
 */
export function calcularRelacaoCustosReceita(custoTotal: number, receitaTotal: number): number {
  if (receitaTotal === 0) return 0;
  return (custoTotal / receitaTotal) * 100;
}

/**
 * Calcula CAC (Custo de Aquisição de Cliente)
 */
export function calcularCAC(custosMarketingVendas: number, clientesAdquiridos: number): number {
  if (clientesAdquiridos === 0) return 0;
  return custosMarketingVendas / clientesAdquiridos;
}

/**
 * Calcula LTV (Lifetime Value)
 */
export function calcularLTV(
  ticketMedio: number,
  frequenciaCompra: number,
  tempoVidaMeses: number,
  margemContribuicao: number
): number {
  return ticketMedio * frequenciaCompra * tempoVidaMeses * (margemContribuicao / 100);
}

/**
 * Calcula ratio LTV/CAC
 */
export function calcularRatioLTVCAC(ltv: number, cac: number): number {
  if (cac === 0) return 0;
  return ltv / cac;
}

/**
 * Classifica ratio LTV/CAC
 */
export function classificarRatioLTVCAC(ratio: number): 'excelente' | 'bom' | 'atencao' | 'critico' {
  if (ratio >= 3) return 'excelente';
  if (ratio >= 2) return 'bom';
  if (ratio >= 1) return 'atencao';
  return 'critico';
}

/**
 * Calcula ticket médio
 */
export function calcularTicketMedio(receitaTotal: number, quantidadeVendas: number): number {
  if (quantidadeVendas === 0) return 0;
  return receitaTotal / quantidadeVendas;
}

/**
 * Calcula taxa de conversão
 */
export function calcularTaxaConversao(conversoes: number, visitantes: number): number {
  if (visitantes === 0) return 0;
  return (conversoes / visitantes) * 100;
}

// ============================================================================
// PONTO DE EQUILÍBRIO
// ============================================================================

/**
 * Calcula ponto de equilíbrio em unidades
 */
export function calcularPontoEquilibrioUnidades(
  custosFixos: number,
  precoVendaUnitario: number,
  custoVariavelUnitario: number
): number {
  const margemContribuicao = precoVendaUnitario - custoVariavelUnitario;
  if (margemContribuicao === 0) return 0;
  return custosFixos / margemContribuicao;
}

/**
 * Calcula ponto de equilíbrio em valor
 */
export function calcularPontoEquilibrioValor(
  custosFixos: number,
  margemContribuicaoPercent: number
): number {
  if (margemContribuicaoPercent === 0) return 0;
  return custosFixos / (margemContribuicaoPercent / 100);
}

/**
 * Calcula margem de segurança
 */
export function calcularMargemSeguranca(receitaAtual: number, pontoEquilibrio: number): number {
  if (receitaAtual === 0) return 0;
  return ((receitaAtual - pontoEquilibrio) / receitaAtual) * 100;
}

// ============================================================================
// CAPITAL DE GIRO
// ============================================================================

/**
 * Calcula Capital de Giro Líquido (CGL)
 */
export function calcularCapitalGiroLiquido(ativosCirculantes: number, passivosCirculantes: number): number {
  return ativosCirculantes - passivosCirculantes;
}

/**
 * Calcula Necessidade de Capital de Giro (NCG)
 */
export function calcularNecessidadeCapitalGiro(
  ativosOperacionais: number,
  passivosOperacionais: number
): number {
  return ativosOperacionais - passivosOperacionais;
}

/**
 * Calcula Saldo de Tesouraria (ST)
 */
export function calcularSaldoTesouraria(
  ativosFinanceiros: number,
  passivosFinanceiros: number
): number {
  return ativosFinanceiros - passivosFinanceiros;
}

/**
 * Classifica capital de giro
 */
export function classificarCapitalGiro(cgl: number): 'saudavel' | 'atencao' | 'critico' {
  if (cgl > 0) return 'saudavel';
  if (cgl === 0) return 'atencao';
  return 'critico';
}

// ============================================================================
// DRE - CÁLCULOS
// ============================================================================

/**
 * Calcula receita líquida
 */
export function calcularReceitaLiquida(
  receitaBruta: number,
  impostos: number,
  descontos: number = 0,
  devolucoes: number = 0
): number {
  return receitaBruta - impostos - descontos - devolucoes;
}

/**
 * Calcula lucro bruto
 */
export function calcularLucroBruto(receitaLiquida: number, cmv: number): number {
  return receitaLiquida - cmv;
}

/**
 * Calcula lucro operacional
 */
export function calcularLucroOperacional(lucroBruto: number, despesasOperacionais: number): number {
  return lucroBruto - despesasOperacionais;
}

/**
 * Calcula lucro líquido
 */
export function calcularLucroLiquido(
  lucroOperacional: number,
  resultadoFinanceiro: number,
  impostosLucro: number = 0
): number {
  return lucroOperacional + resultadoFinanceiro - impostosLucro;
}

/**
 * Estima impostos (Simples Nacional)
 */
export function estimarImpostosSimples(receitaBruta: number, aliquota: number = 8.65): number {
  return receitaBruta * (aliquota / 100);
}

// ============================================================================
// CRESCIMENTO
// ============================================================================

/**
 * Calcula crescimento MoM (Month over Month)
 */
export function calcularMoM(valorAtual: number, valorMesAnterior: number): number {
  if (valorMesAnterior === 0) return 0;
  return ((valorAtual - valorMesAnterior) / valorMesAnterior) * 100;
}

/**
 * Calcula crescimento YoY (Year over Year)
 */
export function calcularYoY(valorAtual: number, valorAnoAnterior: number): number {
  if (valorAnoAnterior === 0) return 0;
  return ((valorAtual - valorAnoAnterior) / valorAnoAnterior) * 100;
}

/**
 * Calcula CAGR (Compound Annual Growth Rate)
 */
export function calcularCAGR(valorInicial: number, valorFinal: number, periodos: number): number {
  if (valorInicial === 0 || periodos === 0) return 0;
  return (Math.pow(valorFinal / valorInicial, 1 / periodos) - 1) * 100;
}

/**
 * Classifica crescimento
 */
export function classificarCrescimento(percentual: number): 'acelerado' | 'moderado' | 'lento' | 'negativo' {
  if (percentual >= 20) return 'acelerado';
  if (percentual >= 10) return 'moderado';
  if (percentual >= 0) return 'lento';
  return 'negativo';
}

// ============================================================================
// PREVISIBILIDADE
// ============================================================================

/**
 * Calcula taxa de recorrência
 */
export function calcularTaxaRecorrencia(receitaRecorrente: number, receitaTotal: number): number {
  if (receitaTotal === 0) return 0;
  return (receitaRecorrente / receitaTotal) * 100;
}

/**
 * Calcula churn rate (taxa de cancelamento)
 */
export function calcularChurnRate(clientesPerdidos: number, clientesInicio: number): number {
  if (clientesInicio === 0) return 0;
  return (clientesPerdidos / clientesInicio) * 100;
}

/**
 * Calcula índice de estabilidade
 */
export function calcularIndiceEstabilidade(valores: number[]): number {
  const cv = calcularCoeficienteVariacao(valores);
  // Converter CV em score de 0-100 (quanto menor o CV, maior a estabilidade)
  return Math.max(0, 100 - cv);
}

/**
 * Classifica estabilidade
 */
export function classificarEstabilidade(
  cv: number
): 'muito_estavel' | 'estavel' | 'moderado' | 'instavel' | 'muito_instavel' {
  if (cv <= 5) return 'muito_estavel';
  if (cv <= 10) return 'estavel';
  if (cv <= 20) return 'moderado';
  if (cv <= 30) return 'instavel';
  return 'muito_instavel';
}

// ============================================================================
// COBERTURA DE DESPESAS
// ============================================================================

/**
 * Calcula meses de cobertura de despesas
 */
export function calcularMesesCobertura(reservasDisponiveis: number, despesasMensais: number): number {
  if (despesasMensais === 0) return Infinity;
  return reservasDisponiveis / despesasMensais;
}

/**
 * Classifica cobertura de despesas
 */
export function classificarCoberturaDespesas(meses: number): 'excelente' | 'bom' | 'atencao' | 'critico' {
  if (meses >= 6) return 'excelente';
  if (meses >= 3) return 'bom';
  if (meses >= 1) return 'atencao';
  return 'critico';
}

// ============================================================================
// ANÁLISE DE RENTABILIDADE POR DIMENSÃO
// ============================================================================

/**
 * Calcula rentabilidade
 */
export function calcularRentabilidade(receita: number, custos: number, despesas: number = 0): {
  lucro: number;
  margem: number;
  roi: number;
} {
  const lucro = receita - custos - despesas;
  const investimento = custos + despesas;
  
  return {
    lucro,
    margem: calcularMargemBruta(receita, custos + despesas),
    roi: calcularROI(lucro, investimento)
  };
}

/**
 * Classifica status de rentabilidade
 */
export function classificarRentabilidade(margem: number): 'lucrativo' | 'equilibrio' | 'prejuizo' {
  if (margem > 0) return 'lucrativo';
  if (margem === 0) return 'equilibrio';
  return 'prejuizo';
}

// ============================================================================
// UTILS
// ============================================================================

/**
 * Arredonda valor financeiro para 2 casas decimais
 */
export function arredondarFinanceiro(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Calcula percentual de participação
 */
export function calcularParticipacao(valorParcial: number, valorTotal: number): number {
  if (valorTotal === 0) return 0;
  return (valorParcial / valorTotal) * 100;
}

/**
 * Calcula variação absoluta
 */
export function calcularVariacaoAbsoluta(valorAtual: number, valorAnterior: number): number {
  return valorAtual - valorAnterior;
}

/**
 * Calcula variação percentual
 */
export function calcularVariacaoPercentual(valorAtual: number, valorAnterior: number): number {
  if (valorAnterior === 0) return 0;
  return ((valorAtual - valorAnterior) / valorAnterior) * 100;
}

// ============================================================================
// EXPORT DEFAULT (HELPER OBJECT)
// ============================================================================

export const CalculosFinanceiros = {
  // Margens
  calcularMargemBruta,
  calcularMargemLiquida,
  calcularMargemOperacional,
  calcularROI,
  calcularROE,
  calcularROA,
  calcularMarkup,
  
  // Liquidez
  calcularLiquidezCorrente,
  calcularLiquidezSeca,
  calcularLiquidezImediata,
  classificarLiquidez,
  
  // Ciclo
  calcularPMR,
  calcularPMP,
  calcularPME,
  calcularCicloConversaoCaixa,
  classificarCicloConversao,
  
  // Endividamento
  calcularEndividamentoGeral,
  calcularComposicaoEndividamento,
  calcularGarantiaCapitalTerceiros,
  classificarEndividamento,
  
  // Inadimplência
  calcularTaxaInadimplencia,
  calcularProvisaoDevedores,
  calcularTaxaRecuperacao,
  classificarInadimplencia,
  
  // Eficiência
  calcularRelacaoCustosReceita,
  calcularCAC,
  calcularLTV,
  calcularRatioLTVCAC,
  classificarRatioLTVCAC,
  calcularTicketMedio,
  calcularTaxaConversao,
  
  // Ponto de Equilíbrio
  calcularPontoEquilibrioUnidades,
  calcularPontoEquilibrioValor,
  calcularMargemSeguranca,
  
  // Capital de Giro
  calcularCapitalGiroLiquido,
  calcularNecessidadeCapitalGiro,
  calcularSaldoTesouraria,
  classificarCapitalGiro,
  
  // DRE
  calcularReceitaLiquida,
  calcularLucroBruto,
  calcularLucroOperacional,
  calcularLucroLiquido,
  estimarImpostosSimples,
  
  // Crescimento
  calcularMoM,
  calcularYoY,
  calcularCAGR,
  classificarCrescimento,
  
  // Previsibilidade
  calcularTaxaRecorrencia,
  calcularChurnRate,
  calcularIndiceEstabilidade,
  classificarEstabilidade,
  
  // Cobertura
  calcularMesesCobertura,
  classificarCoberturaDespesas,
  
  // Rentabilidade
  calcularRentabilidade,
  classificarRentabilidade,
  
  // Utils
  arredondarFinanceiro,
  calcularParticipacao,
  calcularVariacaoAbsoluta,
  calcularVariacaoPercentual,
};



