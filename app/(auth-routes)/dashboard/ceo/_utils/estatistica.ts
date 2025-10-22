/**
 * 📊 CEO DASHBOARD - ESTATÍSTICA
 * 
 * Funções estatísticas e matemáticas para análises
 */

// ============================================================================
// ESTATÍSTICAS BÁSICAS
// ============================================================================

/**
 * Calcula a média (average) de um array de números
 */
export function calcularMedia(valores: number[]): number {
  if (valores.length === 0) return 0;
  const soma = valores.reduce((acc, val) => acc + val, 0);
  return soma / valores.length;
}

/**
 * Calcula a mediana de um array de números
 */
export function calcularMediana(valores: number[]): number {
  if (valores.length === 0) return 0;
  
  const sorted = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[meio - 1] + sorted[meio]) / 2;
  }
  
  return sorted[meio];
}

/**
 * Calcula a moda (valor mais frequente)
 */
export function calcularModa(valores: number[]): number {
  if (valores.length === 0) return 0;
  
  const frequencias = new Map<number, number>();
  
  valores.forEach(valor => {
    frequencias.set(valor, (frequencias.get(valor) || 0) + 1);
  });
  
  let maxFreq = 0;
  let moda = 0;
  
  frequencias.forEach((freq, valor) => {
    if (freq > maxFreq) {
      maxFreq = freq;
      moda = valor;
    }
  });
  
  return moda;
}

/**
 * Calcula a soma de um array de números
 */
export function calcularSoma(valores: number[]): number {
  return valores.reduce((acc, val) => acc + val, 0);
}

/**
 * Calcula o valor mínimo
 */
export function calcularMinimo(valores: number[]): number {
  if (valores.length === 0) return 0;
  return Math.min(...valores);
}

/**
 * Calcula o valor máximo
 */
export function calcularMaximo(valores: number[]): number {
  if (valores.length === 0) return 0;
  return Math.max(...valores);
}

/**
 * Calcula a amplitude (range)
 */
export function calcularAmplitude(valores: number[]): number {
  if (valores.length === 0) return 0;
  return calcularMaximo(valores) - calcularMinimo(valores);
}

// ============================================================================
// MEDIDAS DE DISPERSÃO
// ============================================================================

/**
 * Calcula a variância
 */
export function calcularVariancia(valores: number[]): number {
  if (valores.length === 0) return 0;
  
  const media = calcularMedia(valores);
  const diferencasQuadradas = valores.map(valor => Math.pow(valor - media, 2));
  
  return calcularMedia(diferencasQuadradas);
}

/**
 * Calcula o desvio padrão
 */
export function calcularDesvioPadrao(valores: number[]): number {
  return Math.sqrt(calcularVariancia(valores));
}

/**
 * Calcula o coeficiente de variação (CV)
 * CV = (Desvio Padrão / Média) × 100
 */
export function calcularCoeficienteVariacao(valores: number[]): number {
  if (valores.length === 0) return 0;
  
  const media = calcularMedia(valores);
  if (media === 0) return 0;
  
  const desvioPadrao = calcularDesvioPadrao(valores);
  return (desvioPadrao / media) * 100;
}

/**
 * Calcula desvio padrão amostral
 */
export function calcularDesvioPadraoAmostral(valores: number[]): number {
  if (valores.length <= 1) return 0;
  
  const media = calcularMedia(valores);
  const diferencasQuadradas = valores.map(valor => Math.pow(valor - media, 2));
  const soma = calcularSoma(diferencasQuadradas);
  
  return Math.sqrt(soma / (valores.length - 1));
}

// ============================================================================
// QUARTIS E PERCENTIS
// ============================================================================

/**
 * Calcula o percentil de um array
 */
export function calcularPercentil(valores: number[], percentil: number): number {
  if (valores.length === 0) return 0;
  if (percentil < 0 || percentil > 100) return 0;
  
  const sorted = [...valores].sort((a, b) => a - b);
  const indice = (percentil / 100) * (sorted.length - 1);
  const inferior = Math.floor(indice);
  const superior = Math.ceil(indice);
  
  if (inferior === superior) {
    return sorted[inferior];
  }
  
  const peso = indice - inferior;
  return sorted[inferior] * (1 - peso) + sorted[superior] * peso;
}

/**
 * Calcula os quartis (Q1, Q2/Mediana, Q3)
 */
export function calcularQuartis(valores: number[]): { q1: number; q2: number; q3: number } {
  return {
    q1: calcularPercentil(valores, 25),
    q2: calcularPercentil(valores, 50),
    q3: calcularPercentil(valores, 75)
  };
}

/**
 * Calcula o intervalo interquartil (IQR)
 */
export function calcularIQR(valores: number[]): number {
  const { q1, q3 } = calcularQuartis(valores);
  return q3 - q1;
}

// ============================================================================
// OUTLIERS
// ============================================================================

/**
 * Identifica outliers usando método IQR
 */
export function identificarOutliers(valores: number[]): {
  inferior: number[];
  superior: number[];
  indices: { valor: number; indice: number; tipo: 'inferior' | 'superior' }[];
} {
  if (valores.length === 0) {
    return { inferior: [], superior: [], indices: [] };
  }
  
  const { q1, q3 } = calcularQuartis(valores);
  const iqr = q3 - q1;
  
  const limiteInferior = q1 - 1.5 * iqr;
  const limiteSuperior = q3 + 1.5 * iqr;
  
  const inferior: number[] = [];
  const superior: number[] = [];
  const indices: { valor: number; indice: number; tipo: 'inferior' | 'superior' }[] = [];
  
  valores.forEach((valor, indice) => {
    if (valor < limiteInferior) {
      inferior.push(valor);
      indices.push({ valor, indice, tipo: 'inferior' });
    } else if (valor > limiteSuperior) {
      superior.push(valor);
      indices.push({ valor, indice, tipo: 'superior' });
    }
  });
  
  return { inferior, superior, indices };
}

/**
 * Calcula Z-Score de cada valor
 */
export function calcularZScores(valores: number[]): number[] {
  if (valores.length === 0) return [];
  
  const media = calcularMedia(valores);
  const desvioPadrao = calcularDesvioPadrao(valores);
  
  if (desvioPadrao === 0) return valores.map(() => 0);
  
  return valores.map(valor => (valor - media) / desvioPadrao);
}

// ============================================================================
// CORRELAÇÃO E REGRESSÃO
// ============================================================================

/**
 * Calcula a correlação de Pearson entre duas séries
 */
export function calcularCorrelacao(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const mediaX = calcularMedia(x);
  const mediaY = calcularMedia(y);
  
  let numerador = 0;
  let denominadorX = 0;
  let denominadorY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - mediaX;
    const diffY = y[i] - mediaY;
    
    numerador += diffX * diffY;
    denominadorX += diffX * diffX;
    denominadorY += diffY * diffY;
  }
  
  const denominador = Math.sqrt(denominadorX * denominadorY);
  
  if (denominador === 0) return 0;
  
  return numerador / denominador;
}

/**
 * Calcula regressão linear simples (y = a + bx)
 */
export function calcularRegressaoLinear(x: number[], y: number[]): {
  a: number; // intercepto
  b: number; // coeficiente angular
  r2: number; // coeficiente de determinação
} {
  if (x.length !== y.length || x.length === 0) {
    return { a: 0, b: 0, r2: 0 };
  }
  
  const n = x.length;
  const mediaX = calcularMedia(x);
  const mediaY = calcularMedia(y);
  
  let numerador = 0;
  let denominador = 0;
  
  for (let i = 0; i < n; i++) {
    numerador += (x[i] - mediaX) * (y[i] - mediaY);
    denominador += (x[i] - mediaX) * (x[i] - mediaX);
  }
  
  const b = denominador === 0 ? 0 : numerador / denominador;
  const a = mediaY - b * mediaX;
  
  const r = calcularCorrelacao(x, y);
  const r2 = r * r;
  
  return { a, b, r2 };
}

/**
 * Faz previsão usando regressão linear
 */
export function preverRegressaoLinear(
  x: number[],
  y: number[],
  xPrevisao: number
): number {
  const { a, b } = calcularRegressaoLinear(x, y);
  return a + b * xPrevisao;
}

// ============================================================================
// CRESCIMENTO E TAXAS
// ============================================================================

/**
 * Calcula a taxa de crescimento entre dois valores
 */
export function calcularTaxaCrescimento(valorInicial: number, valorFinal: number): number {
  if (valorInicial === 0) return 0;
  return ((valorFinal - valorInicial) / valorInicial) * 100;
}

/**
 * Calcula CAGR (Compound Annual Growth Rate)
 */
export function calcularCAGR(valorInicial: number, valorFinal: number, periodos: number): number {
  if (valorInicial === 0 || periodos === 0) return 0;
  return (Math.pow(valorFinal / valorInicial, 1 / periodos) - 1) * 100;
}

/**
 * Calcula taxa de crescimento médio
 */
export function calcularTaxaCrescimentoMedio(valores: number[]): number {
  if (valores.length < 2) return 0;
  
  const taxas: number[] = [];
  
  for (let i = 1; i < valores.length; i++) {
    const taxa = calcularTaxaCrescimento(valores[i - 1], valores[i]);
    taxas.push(taxa);
  }
  
  return calcularMedia(taxas);
}

// ============================================================================
// MÉDIAS MÓVEIS E SUAVIZAÇÃO
// ============================================================================

/**
 * Calcula média móvel simples
 */
export function calcularMediaMovelSimples(valores: number[], janela: number): number[] {
  if (valores.length < janela) return [];
  
  const resultado: number[] = [];
  
  for (let i = janela - 1; i < valores.length; i++) {
    const subarray = valores.slice(i - janela + 1, i + 1);
    resultado.push(calcularMedia(subarray));
  }
  
  return resultado;
}

/**
 * Calcula média móvel exponencial (EMA)
 */
export function calcularMediaMovelExponencial(valores: number[], periodo: number): number[] {
  if (valores.length === 0 || periodo <= 0) return [];
  
  const multiplicador = 2 / (periodo + 1);
  const ema: number[] = [valores[0]];
  
  for (let i = 1; i < valores.length; i++) {
    const emaAtual = (valores[i] - ema[i - 1]) * multiplicador + ema[i - 1];
    ema.push(emaAtual);
  }
  
  return ema;
}

// ============================================================================
// NORMALIZAÇÃO E PADRONIZAÇÃO
// ============================================================================

/**
 * Normaliza valores para escala 0-1
 */
export function normalizarMinMax(valores: number[]): number[] {
  if (valores.length === 0) return [];
  
  const min = calcularMinimo(valores);
  const max = calcularMaximo(valores);
  const amplitude = max - min;
  
  if (amplitude === 0) return valores.map(() => 0.5);
  
  return valores.map(valor => (valor - min) / amplitude);
}

/**
 * Padroniza valores (Z-Score)
 */
export function padronizar(valores: number[]): number[] {
  return calcularZScores(valores);
}

// ============================================================================
// CLASSIFICAÇÃO E RANKING
// ============================================================================

/**
 * Classifica valor em relação à distribuição
 */
export function classificarValor(valor: number, valores: number[]): {
  posicao: 'muito_acima' | 'acima' | 'media' | 'abaixo' | 'muito_abaixo';
  desviosPadrao: number;
  percentil: number;
} {
  const media = calcularMedia(valores);
  const desvioPadrao = calcularDesvioPadrao(valores);
  
  const desviosPadrao = desvioPadrao === 0 ? 0 : (valor - media) / desvioPadrao;
  
  // Calcular percentil
  const sorted = [...valores].sort((a, b) => a - b);
  const indice = sorted.findIndex(v => v >= valor);
  const percentil = indice === -1 ? 100 : (indice / sorted.length) * 100;
  
  // Classificar
  let posicao: 'muito_acima' | 'acima' | 'media' | 'abaixo' | 'muito_abaixo';
  
  if (desviosPadrao >= 1.5) {
    posicao = 'muito_acima';
  } else if (desviosPadrao >= 0.5) {
    posicao = 'acima';
  } else if (desviosPadrao <= -1.5) {
    posicao = 'muito_abaixo';
  } else if (desviosPadrao <= -0.5) {
    posicao = 'abaixo';
  } else {
    posicao = 'media';
  }
  
  return { posicao, desviosPadrao, percentil };
}

// ============================================================================
// TENDÊNCIAS
// ============================================================================

/**
 * Identifica tendência em uma série temporal
 */
export function identificarTendencia(valores: number[]): {
  direcao: 'crescente' | 'decrescente' | 'estavel';
  intensidade: 'forte' | 'moderada' | 'fraca';
  confianca: number;
} {
  if (valores.length < 3) {
    return { direcao: 'estavel', intensidade: 'fraca', confianca: 0 };
  }
  
  // Usar regressão linear
  const x = valores.map((_, i) => i);
  const { b, r2 } = calcularRegressaoLinear(x, valores);
  
  // Determinar direção
  let direcao: 'crescente' | 'decrescente' | 'estavel';
  if (Math.abs(b) < 0.01) {
    direcao = 'estavel';
  } else if (b > 0) {
    direcao = 'crescente';
  } else {
    direcao = 'decrescente';
  }
  
  // Determinar intensidade
  let intensidade: 'forte' | 'moderada' | 'fraca';
  if (r2 > 0.7) {
    intensidade = 'forte';
  } else if (r2 > 0.4) {
    intensidade = 'moderada';
  } else {
    intensidade = 'fraca';
  }
  
  const confianca = Math.round(r2 * 100);
  
  return { direcao, intensidade, confianca };
}

// ============================================================================
// VOLATILIDADE
// ============================================================================

/**
 * Calcula volatilidade (desvio padrão dos retornos)
 */
export function calcularVolatilidade(valores: number[]): number {
  if (valores.length < 2) return 0;
  
  const retornos: number[] = [];
  
  for (let i = 1; i < valores.length; i++) {
    if (valores[i - 1] !== 0) {
      const retorno = (valores[i] - valores[i - 1]) / valores[i - 1];
      retornos.push(retorno);
    }
  }
  
  return calcularDesvioPadrao(retornos) * 100;
}

/**
 * Classifica volatilidade
 */
export function classificarVolatilidade(cv: number): 'muito_alta' | 'alta' | 'moderada' | 'baixa' | 'muito_baixa' {
  if (cv >= 30) return 'muito_alta';
  if (cv >= 20) return 'alta';
  if (cv >= 10) return 'moderada';
  if (cv >= 5) return 'baixa';
  return 'muito_baixa';
}

// ============================================================================
// EXPORT DEFAULT (HELPER OBJECT)
// ============================================================================

export const Estatistica = {
  // Básicas
  calcularMedia,
  calcularMediana,
  calcularModa,
  calcularSoma,
  calcularMinimo,
  calcularMaximo,
  calcularAmplitude,
  
  // Dispersão
  calcularVariancia,
  calcularDesvioPadrao,
  calcularCoeficienteVariacao,
  calcularDesvioPadraoAmostral,
  
  // Quartis
  calcularPercentil,
  calcularQuartis,
  calcularIQR,
  
  // Outliers
  identificarOutliers,
  calcularZScores,
  
  // Correlação
  calcularCorrelacao,
  calcularRegressaoLinear,
  preverRegressaoLinear,
  
  // Crescimento
  calcularTaxaCrescimento,
  calcularCAGR,
  calcularTaxaCrescimentoMedio,
  
  // Médias móveis
  calcularMediaMovelSimples,
  calcularMediaMovelExponencial,
  
  // Normalização
  normalizarMinMax,
  padronizar,
  
  // Classificação
  classificarValor,
  
  // Tendências
  identificarTendencia,
  
  // Volatilidade
  calcularVolatilidade,
  classificarVolatilidade,
};



