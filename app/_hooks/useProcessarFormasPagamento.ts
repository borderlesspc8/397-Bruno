import { useMemo } from 'react';

// Interface para o resultado do processamento
export interface FormaPagamentoItem {
  formaPagamento: string;
  totalVendas: number;
  totalValor: number;
  percentual: number;
}

// Mapeamento para categorias específicas de forma de pagamento (mesmo da API)
const CATEGORIAS_PAGAMENTO: Record<string, string> = {
  'PIX - C6': 'PIX - C6',
  'PIX C6': 'PIX - C6',
  'PIX - BB': 'PIX - BB',
  'PIX - STONE': 'PIX - STONE',
  'PIX': 'PIX',
  'ELO CRÉDITO STONE': 'CRÉDITO - STONE',
  'MASTERCARD CRÉDITO STONE': 'CRÉDITO - STONE',
  'MASTER CRÉDITO': 'CRÉDITO - STONE',
  'VISA CRÉDITO STONE': 'CRÉDITO - STONE',
  'Cartão de Crédito Stone': 'CRÉDITO - STONE',
  'CRÉDITO - Stone': 'CRÉDITO - STONE',
  'CRÉDITO - STONE': 'CRÉDITO - STONE',
  'CRÉDITO - Itaú': 'CRÉDITO - STONE',
  'CRÉDITO - ITAÚ': 'CRÉDITO - STONE',
  'CRÉDITO - Slipay': 'CRÉDITO - STONE',
  'CRÉDITO - SLIPAY': 'CRÉDITO - STONE',
  'Cartão de Crédito': 'CRÉDITO - STONE',
  'Crédito': 'CRÉDITO - STONE',
  'DÉBITO - Slipay': 'DÉBITO - STONE',
  'DÉBITO - SLIPAY': 'DÉBITO - STONE',
  'DEBITO - Slipay': 'DÉBITO - STONE',
  'DEBITO - SLIPAY': 'DÉBITO - STONE',
  'DÉBITO - Stone': 'DÉBITO - STONE',
  'DÉBITO - STONE': 'DÉBITO - STONE',
  'DÉBITO - Itaú': 'DÉBITO - STONE',
  'DÉBITO - ITAÚ': 'DÉBITO - STONE',
  'DÉBITO - C6': 'DÉBITO - STONE',
  'Cartão de Débito': 'DÉBITO - STONE',
  'Débito': 'DÉBITO - STONE',
  'Dinheiro à Vista': 'ESPÉCIE - BB',
  'Dinheiro': 'ESPÉCIE - BB',
  'Especie': 'ESPÉCIE - BB',
  'ESPÉCIE - BB': 'ESPÉCIE - BB',
  'Moeda': 'ESPÉCIE - BB',
  'BOLETO': 'BOLETO - BB',
  'Boleto Bancário': 'BOLETO - BB',
  'Boleto': 'BOLETO - BB',
  'BOLETO - BB': 'BOLETO - BB',
  'A COMBINAR': 'A COMBINAR',
  'A Combinar': 'A COMBINAR',
  'A combinar': 'A COMBINAR'
};

// Função para normalizar a forma de pagamento
const normalizarFormaPagamento = (forma: string): string => {
  if (!forma) {
    console.log('Forma de pagamento vazia, retornando A COMBINAR');
    return 'A COMBINAR';
  }
  
  console.log(`Normalizando forma de pagamento: "${forma}"`);
  
  if (CATEGORIAS_PAGAMENTO[forma]) {
    console.log(`Encontrado no mapeamento direto: "${forma}" -> "${CATEGORIAS_PAGAMENTO[forma]}"`);
    return CATEGORIAS_PAGAMENTO[forma];
  }
  
  const formaNormalizada = forma.trim();
  console.log(`Forma normalizada: "${formaNormalizada}"`);
  
  if (formaNormalizada.includes('PIX')) {
    if (formaNormalizada.includes('C6')) {
      console.log('Detectado PIX - C6');
      return 'PIX - C6';
    } else if (formaNormalizada.includes('BB')) {
      console.log('Detectado PIX - BB');
      return 'PIX - BB';
    } else if (formaNormalizada.includes('STONE')) {
      console.log('Detectado PIX - STONE');
      return 'PIX - STONE';
    } else {
      console.log('Detectado PIX genérico');
      return 'PIX';
    }
  }
  if (formaNormalizada.includes('BOLETO') || formaNormalizada.includes('Boleto')) return 'BOLETO - BB';
  if (formaNormalizada.toLowerCase().includes('dinheiro') || formaNormalizada.toLowerCase().includes('à vista') || 
      formaNormalizada.toLowerCase().includes('especie') || formaNormalizada.toLowerCase().includes('moeda')) return 'ESPÉCIE - BB';
  
  if (formaNormalizada.includes('CRÉDIT') || formaNormalizada.includes('Crédit') || 
      formaNormalizada.includes('CREDIT') || formaNormalizada.includes('Credit')) {
    console.log('Detectado CRÉDITO');
    return 'CRÉDITO - STONE';
  }
  
  if (formaNormalizada.includes('DÉBIT') || formaNormalizada.includes('Débit') ||
      formaNormalizada.includes('DEBIT') || formaNormalizada.includes('Debit')) {
    console.log('Detectado DÉBITO');
    return 'DÉBITO - STONE';
  }
  
  console.log(`Forma não reconhecida: "${formaNormalizada}", retornando A COMBINAR`);
  return 'A COMBINAR';
};

// FUNÇÃO SIMPLIFICADA PARA ENCONTRAR FORMA DE PAGAMENTO
const analiseForenseFormaPagamento = (venda: any): { forma: string; fonte: string; detalhes: any } => {
  console.log(`🔍 === ANÁLISE FORENSE VENDA ${venda.id} ===`);
  
  // 1. VERIFICAR CAMPOS DIRETOS MAIS PROVÁVEIS
  const camposDiretos = ['forma_pagamento', 'metodo_pagamento', 'forma_pagamento_original', 'tipo_pagamento'];
  
  for (const campo of camposDiretos) {
    if (venda[campo] && typeof venda[campo] === 'string' && venda[campo].trim() !== '') {
      console.log(`✅ Campo direto "${campo}": "${venda[campo]}"`);
      return { forma: venda[campo].trim(), fonte: `campo_direto.${campo}`, detalhes: { campo, valor: venda[campo] } };
    }
  }
  
  // 2. VERIFICAR ARRAY DE PAGAMENTOS (mais provável)
  if (venda.pagamentos && Array.isArray(venda.pagamentos) && venda.pagamentos.length > 0) {
    console.log(`📋 Array de pagamentos encontrado com ${venda.pagamentos.length} elementos`);
    
    for (let i = 0; i < venda.pagamentos.length; i++) {
      const pagamento = venda.pagamentos[i];
      console.log(`  📋 Pagamento ${i}:`, pagamento);
      
      // Verificar campo direto no pagamento
      if (pagamento.forma_pagamento && typeof pagamento.forma_pagamento === 'string' && pagamento.forma_pagamento.trim() !== '') {
        console.log(`    ✅ forma_pagamento direto: "${pagamento.forma_pagamento}"`);
        return { forma: pagamento.forma_pagamento.trim(), fonte: `array.pagamentos[${i}].forma_pagamento`, detalhes: { indice: i, valor: pagamento.forma_pagamento } };
      }
      
      // Verificar objeto pagamento aninhado
      if (pagamento.pagamento && typeof pagamento.pagamento === 'object') {
        console.log(`    📦 Objeto pagamento aninhado:`, pagamento.pagamento);
        
        const camposPagamento = ['nome_forma_pagamento', 'forma_pagamento', 'tipo_pagamento', 'metodo_pagamento'];
        for (const campo of camposPagamento) {
          if (pagamento.pagamento[campo] && typeof pagamento.pagamento[campo] === 'string' && pagamento.pagamento[campo].trim() !== '') {
            console.log(`      ✅ ${campo}: "${pagamento.pagamento[campo]}"`);
            return { forma: pagamento.pagamento[campo].trim(), fonte: `array.pagamentos[${i}].pagamento.${campo}`, detalhes: { indice: i, subcampo: campo, valor: pagamento.pagamento[campo] } };
          }
        }
      }
      
      // Verificar campo nome direto
      if (pagamento.nome && typeof pagamento.nome === 'string' && pagamento.nome.trim() !== '') {
        console.log(`    ✅ nome direto: "${pagamento.nome}"`);
        return { forma: pagamento.nome.trim(), fonte: `array.pagamentos[${i}].nome`, detalhes: { indice: i, valor: pagamento.nome } };
      }
    }
  }
  
  // 3. VERIFICAR OUTROS CAMPOS ESPECÍFICOS
  const outrosCampos = ['payment_method', 'payment_type', 'payment_form', 'pagamento_tipo', 'pagamento_metodo', 'pagamento_forma'];
  
  for (const campo of outrosCampos) {
    if (venda[campo] && venda[campo].toString().trim() !== '') {
      console.log(`✅ Campo específico "${campo}": "${venda[campo]}"`);
      return { forma: venda[campo].toString().trim(), fonte: `campo_especifico.${campo}`, detalhes: { campo, valor: venda[campo] } };
    }
  }
  
  // 4. VERIFICAR METADATA
  if (venda.metadata && typeof venda.metadata === 'object') {
    console.log(`📦 Metadata encontrada:`, Object.keys(venda.metadata));
    
    const camposMeta = Object.keys(venda.metadata).filter(key => 
      key.toLowerCase().includes('pag') || 
      key.toLowerCase().includes('pay') || 
      key.toLowerCase().includes('form') || 
      key.toLowerCase().includes('method')
    );
    
    for (const campo of camposMeta) {
      const valor = venda.metadata[campo];
      if (valor && valor.toString().trim() !== '') {
        console.log(`✅ Metadata.${campo}: "${valor}"`);
        return { forma: valor.toString().trim(), fonte: `metadata.${campo}`, detalhes: { campo, valor } };
      }
    }
  }
  
  // 5. VERIFICAR OBSERVAÇÕES E NOTAS
  const camposTexto = ['observacoes', 'notas', 'info_pagamento', 'payment_info', 'transaction_details', 'detalhes_pagamento'];
  
  for (const campo of camposTexto) {
    if (venda[campo] && typeof venda[campo] === 'string' && venda[campo].trim() !== '') {
      const texto = venda[campo].toLowerCase();
      console.log(`🔍 Analisando texto "${campo}": "${venda[campo]}"`);
      
      // Buscar palavras-chave de formas de pagamento no texto
      const palavrasChave = [
        { palavra: 'pix', resultado: 'PIX' },
        { palavra: 'credito', resultado: 'CRÉDITO' },
        { palavra: 'crédito', resultado: 'CRÉDITO' },
        { palavra: 'debito', resultado: 'DÉBITO' },
        { palavra: 'débito', resultado: 'DÉBITO' },
        { palavra: 'dinheiro', resultado: 'ESPÉCIE' },
        { palavra: 'especie', resultado: 'ESPÉCIE' },
        { palavra: 'boleto', resultado: 'BOLETO' },
        { palavra: 'cartao', resultado: 'CRÉDITO' },
        { palavra: 'cartão', resultado: 'CRÉDITO' }
      ];
      
      for (const palavra of palavrasChave) {
        if (texto.includes(palavra.palavra)) {
          console.log(`✅ Palavra-chave "${palavra.palavra}" encontrada em "${campo}"`);
          return { forma: palavra.resultado, fonte: `texto.${campo}`, detalhes: { campo, palavra: palavra.palavra, texto: venda[campo] } };
        }
      }
    }
  }
  
  console.log(`❌ NENHUMA FORMA DE PAGAMENTO ENCONTRADA na venda ${venda.id}`);
  console.log('🔍 === FIM ANÁLISE FORENSE ===');
  
  return { forma: 'A COMBINAR', fonte: 'nao_encontrado', detalhes: { motivo: 'Nenhum campo de forma de pagamento identificado' } };
};

// Hook principal para processar formas de pagamento
export const useProcessarFormasPagamento = (vendas: any[]): FormaPagamentoItem[] => {
  return useMemo(() => {
    if (!vendas || !Array.isArray(vendas) || vendas.length === 0) {
      console.log('useProcessarFormasPagamento: Nenhuma venda para processar');
      return [];
    }

    console.log('=== PROCESSAMENTO DADOS FRESCOS (HOOK) ===');
    console.log('Vendas recebidas:', vendas.length, 'vendas');
    console.log('Timestamp:', new Date().toISOString());

    // Agrupar vendas por forma de pagamento
    const formasPagamentoMap = new Map<string, { totalVendas: number; totalValor: number }>();
    let valorTotal = 0;
    
    console.log('=== CÁLCULO DE VALORES ===');
    let vendasComValorZero = 0;
    let vendasComValorInvalido = 0;
    
    vendas.forEach((venda: any, index: number) => {
      const valorVenda = typeof venda.valor_total === 'string' 
        ? parseFloat(venda.valor_total) 
        : Number(venda.valor_total) || 0;
      
      // Log das primeiras 5 vendas para debug de valores
      if (index < 5) {
        console.log(`Venda ${index + 1} (ID: ${venda.id}):`, {
          valor_total_original: venda.valor_total,
          valor_total_processado: valorVenda,
          tipo_valor: typeof venda.valor_total
        });
      }
      
      if (valorVenda === 0) {
        vendasComValorZero++;
        if (index < 10) {
          console.log(`⚠️ Venda ${venda.id} com valor zero:`, venda.valor_total);
        }
      }
      
      if (isNaN(valorVenda)) {
        vendasComValorInvalido++;
        console.log(`❌ Venda ${venda.id} com valor inválido:`, venda.valor_total);
      }
      
      valorTotal += valorVenda;
      
      // Determinar a forma de pagamento da venda usando análise forense
      let formaPagamento = 'A COMBINAR';
      
      // Debug: log da venda para entender a estrutura COMPLETA
      if (index < 3) { // Log apenas das primeiras 3 vendas para debug
        console.log(`=== ESTRUTURA COMPLETA DA VENDA ${index + 1} (ID: ${venda.id}) ===`);
        console.log('Todos os campos da venda:', Object.keys(venda));
        console.log('Valores dos campos de pagamento:', {
          forma_pagamento: venda.forma_pagamento,
          metodo_pagamento: venda.metodo_pagamento,
          forma_pagamento_original: venda.forma_pagamento_original,
          tipo_pagamento: venda.tipo_pagamento,
          payment_method: venda.payment_method,
          payment_type: venda.payment_type,
          payment_form: venda.payment_form,
          forma_pagamento_id: venda.forma_pagamento_id,
          pagamento_id: venda.pagamento_id,
          pagamento_tipo: venda.pagamento_tipo,
          pagamento_metodo: venda.pagamento_metodo,
          pagamento_forma: venda.pagamento_forma
        });
        console.log('Array pagamentos:', venda.pagamentos);
        if (venda.pagamentos && Array.isArray(venda.pagamentos)) {
          console.log('Detalhes dos pagamentos:', venda.pagamentos.map((p: any, pIndex: number) => ({
            indice: pIndex,
            pagamento_completo: p,
            pagamento_objeto: p.pagamento,
            campos_pagamento: p.pagamento ? Object.keys(p.pagamento) : 'N/A',
            nome_forma_pagamento: p.pagamento?.nome_forma_pagamento,
            tipo_pagamento: p.pagamento?.tipo_pagamento,
            metodo_pagamento: p.pagamento?.metodo_pagamento,
            forma_pagamento: p.pagamento?.forma_pagamento,
            valor: p.valor,
            status: p.status
          })));
        }
        console.log('Outros campos relacionados:', {
          metadata: venda.metadata,
          observacoes: venda.observacoes,
          notas: venda.notas,
          info_pagamento: venda.info_pagamento,
          payment_info: venda.payment_info,
          transaction_details: venda.transaction_details,
          detalhes_pagamento: venda.detalhes_pagamento
        });
        console.log('=== FIM DA ESTRUTURA DA VENDA ===');
      }
      
      // Buscar a forma de pagamento usando a análise forense
      const resultadoAnalise = analiseForenseFormaPagamento(venda);
      const formaOriginal = resultadoAnalise.forma;
      formaPagamento = normalizarFormaPagamento(formaOriginal);
      
      if (index < 3) {
        console.log(`🎯 Venda ${index + 1} (ID: ${venda.id}):`);
        console.log(`   📍 Fonte: ${resultadoAnalise.fonte}`);
        console.log(`   🔍 Forma encontrada: "${formaOriginal}"`);
        console.log(`   ✅ Forma normalizada: "${formaPagamento}"`);
        console.log(`   📊 Detalhes:`, resultadoAnalise.detalhes);
      }
      
      // Adicionar à contagem
      if (formasPagamentoMap.has(formaPagamento)) {
        const dadosExistentes = formasPagamentoMap.get(formaPagamento)!;
        formasPagamentoMap.set(formaPagamento, {
          totalVendas: dadosExistentes.totalVendas + 1,
          totalValor: dadosExistentes.totalValor + valorVenda
        });
      } else {
        formasPagamentoMap.set(formaPagamento, {
          totalVendas: 1,
          totalValor: valorVenda
        });
      }
    });
    
    // Converter o Map para um array e calcular percentuais
    const formasPagamentoProcessadas = Array.from(formasPagamentoMap.entries()).map(([formaPagamento, dados]) => ({
      formaPagamento,
      totalVendas: dados.totalVendas,
      totalValor: dados.totalValor,
      percentual: valorTotal > 0 ? (dados.totalValor / valorTotal) * 100 : 0
    }));
    
    // Ordenar por valor total (decrescente)
    formasPagamentoProcessadas.sort((a, b) => b.totalValor - a.totalValor);
    
    console.log('=== RESUMO FINAL (HOOK) ===');
    console.log('Dados processados localmente para formas de pagamento:', {
      totalVendasOriginais: vendas.length,
      vendasComValorZero: vendasComValorZero,
      vendasComValorInvalido: vendasComValorInvalido,
      formasPagamento: formasPagamentoProcessadas.length,
      valorTotal: valorTotal,
      valorTotalFormatado: `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      formas: formasPagamentoProcessadas.map(f => ({ 
        forma: f.formaPagamento, 
        valor: f.totalValor, 
        vendas: f.totalVendas,
        percentual: f.percentual.toFixed(2) + '%'
      }))
    });
    
    // RELATÓRIO DE ANÁLISE FORENSE COMPLETA
    console.log('🔍 === RELATÓRIO DE ANÁLISE FORENSE COMPLETA (HOOK) ===');
    console.log('📊 Resumo da investigação:');
    console.log(`   • Total de vendas analisadas: ${vendas.length}`);
    console.log(`   • Vendas com valor zero: ${vendasComValorZero}`);
    console.log(`   • Vendas com valor inválido: ${vendasComValorInvalido}`);
    console.log(`   • Formas de pagamento identificadas: ${formasPagamentoProcessadas.length}`);
    
    // Análise das fontes dos dados encontrados
    const fontesEncontradas = new Map<string, number>();
    const formasEncontradas = new Map<string, number>();
    
    // Simular análise das primeiras vendas para identificar padrões
    const amostraVendas = vendas.slice(0, Math.min(10, vendas.length));
    amostraVendas.forEach((venda, index) => {
      const resultado = analiseForenseFormaPagamento(venda);
      const fonte = resultado.fonte;
      const forma = resultado.forma;
      
      fontesEncontradas.set(fonte, (fontesEncontradas.get(fonte) || 0) + 1);
      formasEncontradas.set(forma, (formasEncontradas.get(forma) || 0) + 1);
    });
    
    console.log('📍 Fontes dos dados encontradas (amostra de 10 vendas):');
    fontesEncontradas.forEach((count, fonte) => {
      console.log(`   • ${fonte}: ${count} vendas`);
    });
    
    console.log('🎯 Formas de pagamento encontradas (amostra de 10 vendas):');
    formasEncontradas.forEach((count, forma) => {
      console.log(`   • ${forma}: ${count} vendas`);
    });
    
    // Log detalhado das formas de pagamento encontradas
    console.log('=== ANÁLISE DAS FORMAS DE PAGAMENTO (HOOK) ===');
    formasPagamentoProcessadas.forEach((forma, index) => {
      console.log(`${index + 1}. ${forma.formaPagamento}:`, {
        vendas: forma.totalVendas,
        valor: `R$ ${forma.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        percentual: `${forma.percentual.toFixed(2)}%`
      });
    });
    
    // Verificar se ainda há muitas vendas como "A COMBINAR"
    const vendasACombinar = formasPagamentoProcessadas.find(f => f.formaPagamento === 'A COMBINAR');
    if (vendasACombinar && vendasACombinar.totalVendas > 0) {
      console.log('⚠️ ATENÇÃO: Ainda há vendas classificadas como "A COMBINAR"');
      console.log(`Vendas "A COMBINAR": ${vendasACombinar.totalVendas} (${vendasACombinar.percentual.toFixed(2)}%)`);
      console.log('Isso indica que os dados de forma de pagamento podem estar em campos não identificados');
      console.log('Verifique os logs detalhados acima para identificar onde estão os dados reais');
      
      // Análise adicional das vendas "A COMBINAR"
      console.log('🔍 === ANÁLISE DETALHADA DAS VENDAS "A COMBINAR" (HOOK) ===');
      const vendasACombinarList = vendas.filter(venda => {
        const resultado = analiseForenseFormaPagamento(venda);
        return resultado.forma === 'A COMBINAR';
      }).slice(0, 5); // Analisar apenas as primeiras 5
      
      vendasACombinarList.forEach((venda, index) => {
        console.log(`🔍 Venda "A COMBINAR" ${index + 1} (ID: ${venda.id}):`);
        console.log('   📊 Campos disponíveis:', Object.keys(venda));
        console.log('   📊 Campos com "pag":', Object.keys(venda).filter(k => k.toLowerCase().includes('pag')));
        console.log('   📊 Campos com "pay":', Object.keys(venda).filter(k => k.toLowerCase().includes('pay')));
        console.log('   📊 Campos com "form":', Object.keys(venda).filter(k => k.toLowerCase().includes('form')));
        console.log('   📊 Campos com "method":', Object.keys(venda).filter(k => k.toLowerCase().includes('method')));
        
        // Mostrar alguns campos específicos para debug
        const camposDebug = ['forma_pagamento', 'metodo_pagamento', 'pagamentos', 'metadata', 'observacoes'];
        camposDebug.forEach(campo => {
          if (venda[campo] !== undefined) {
            console.log(`   🔍 ${campo}:`, venda[campo]);
          }
        });
      });
    } else {
      console.log('✅ Todas as vendas foram classificadas com formas de pagamento específicas');
    }
    
    return formasPagamentoProcessadas;
  }, [vendas]);
};
