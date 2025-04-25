#!/usr/bin/env node

/**
 * Script para testar o parser de extrato do Banco do Brasil
 * Este script simula o processamento de um extrato real e imprime o resultado
 */

// Exemplo de extrato do BB (baseado na resposta real)
const extractoExemplo = {
  "numeroPaginaAtual": 1,
  "quantidadeRegistroPaginaAtual": 12,
  "numeroPaginaAnterior": 0,
  "numeroPaginaProximo": 0,
  "quantidadeTotalPagina": 1,
  "quantidadeTotalRegistro": 12,
  "listaLancamento": [
    {
      "indicadorTipoLancamento": "1",
      "dataLancamento": 28022025,
      "dataMovimento": 0,
      "codigoAgenciaOrigem": 0,
      "numeroLote": 0,
      "numeroDocumento": 0,
      "codigoHistorico": 0,
      "textoDescricaoHistorico": "SALDO ANTERIOR",
      "valorLancamento": 10552.99,
      "indicadorSinalLancamento": "C",
      "textoInformacaoComplementar": "",
      "numeroCpfCnpjContrapartida": 0,
      "indicadorTipoPessoaContrapartida": "",
      "codigoBancoContrapartida": 0,
      "codigoAgenciaContrapartida": 0,
      "numeroContaContrapartida": "00000000000000000000",
      "textoDvContaContrapartida": ""
    },
    {
      "indicadorTipoLancamento": "1",
      "dataLancamento": 5032025,
      "dataMovimento": 0,
      "codigoAgenciaOrigem": 0,
      "numeroLote": 13105,
      "numeroDocumento": 30501,
      "codigoHistorico": 144,
      "textoDescricaoHistorico": "Pix - Enviado",
      "valorLancamento": 10550.00,
      "indicadorSinalLancamento": "D",
      "textoInformacaoComplementar": "01/03 11:28 PERSONAL PRIME",
      "numeroCpfCnpjContrapartida": 53389312000103,
      "indicadorTipoPessoaContrapartida": "J",
      "codigoBancoContrapartida": 0,
      "codigoAgenciaContrapartida": 4525,
      "numeroContaContrapartida": "00000000000000096635",
      "textoDvContaContrapartida": "6"
    },
    {
      "indicadorTipoLancamento": "1",
      "dataLancamento": 5032025,
      "dataMovimento": 0,
      "codigoAgenciaOrigem": 0,
      "numeroLote": 0,
      "numeroDocumento": 0,
      "codigoHistorico": 0,
      "textoDescricaoHistorico": "Saldo do dia",
      "valorLancamento": 2.99,
      "indicadorSinalLancamento": "C",
      "textoInformacaoComplementar": "",
      "numeroCpfCnpjContrapartida": 0,
      "indicadorTipoPessoaContrapartida": "",
      "codigoBancoContrapartida": 0,
      "codigoAgenciaContrapartida": 0,
      "numeroContaContrapartida": "00000000000000000000",
      "textoDvContaContrapartida": ""
    },
    {
      "indicadorTipoLancamento": "1",
      "dataLancamento": 6032025,
      "dataMovimento": 0,
      "codigoAgenciaOrigem": 0,
      "numeroLote": 14175,
      "numeroDocumento": 33648913,
      "codigoHistorico": 976,
      "textoDescricaoHistorico": "TED-Crédito em Conta",
      "valorLancamento": 52.39,
      "indicadorSinalLancamento": "C",
      "textoInformacaoComplementar": "218 0001 28505126000137 LOGBANK SOLUCO",
      "numeroCpfCnpjContrapartida": 28505126000137,
      "indicadorTipoPessoaContrapartida": "J",
      "codigoBancoContrapartida": 0,
      "codigoAgenciaContrapartida": 1,
      "numeroContaContrapartida": "00000000000000040130",
      "textoDvContaContrapartida": "7"
    },
    {
      "indicadorTipoLancamento": "1",
      "dataLancamento": 6032025,
      "dataMovimento": 0,
      "codigoAgenciaOrigem": 0,
      "numeroLote": 0,
      "numeroDocumento": 0,
      "codigoHistorico": 0,
      "textoDescricaoHistorico": "Saldo do dia",
      "valorLancamento": 55.38,
      "indicadorSinalLancamento": "C",
      "textoInformacaoComplementar": "",
      "numeroCpfCnpjContrapartida": 0,
      "indicadorTipoPessoaContrapartida": "",
      "codigoBancoContrapartida": 0,
      "codigoAgenciaContrapartida": 0,
      "numeroContaContrapartida": "00000000000000000000",
      "textoDvContaContrapartida": ""
    },
    {
      "indicadorTipoLancamento": "1",
      "dataLancamento": 7032025,
      "dataMovimento": 0,
      "codigoAgenciaOrigem": 8392,
      "numeroLote": 17556,
      "numeroDocumento": 83921755600230,
      "codigoHistorico": 830,
      "textoDescricaoHistorico": "Dep dinheiro inter ag",
      "valorLancamento": 1412.00,
      "indicadorSinalLancamento": "C",
      "textoInformacaoComplementar": "8392-30-SOP-JER ALBUQUERQUE",
      "numeroCpfCnpjContrapartida": 0,
      "indicadorTipoPessoaContrapartida": "",
      "codigoBancoContrapartida": 0,
      "codigoAgenciaContrapartida": 0,
      "numeroContaContrapartida": "00000000000000000000",
      "textoDvContaContrapartida": ""
    },
    {
      "indicadorTipoLancamento": "1",
      "dataLancamento": 7032025,
      "dataMovimento": 0,
      "codigoAgenciaOrigem": 0,
      "numeroLote": 13113,
      "numeroDocumento": 890661200608523,
      "codigoHistorico": 435,
      "textoDescricaoHistorico": "Tarifa Pacote de Serviços",
      "valorLancamento": 99.10,
      "indicadorSinalLancamento": "D",
      "textoInformacaoComplementar": "Cobrança referente 07/03/2025",
      "numeroCpfCnpjContrapartida": 0,
      "indicadorTipoPessoaContrapartida": "",
      "codigoBancoContrapartida": 0,
      "codigoAgenciaContrapartida": 0,
      "numeroContaContrapartida": "00000000000000000000",
      "textoDvContaContrapartida": ""
    },
    {
      "indicadorTipoLancamento": "1",
      "dataLancamento": 7032025,
      "dataMovimento": 0,
      "codigoAgenciaOrigem": 0,
      "numeroLote": 0,
      "numeroDocumento": 0,
      "codigoHistorico": 0,
      "textoDescricaoHistorico": "Saldo do dia",
      "valorLancamento": 1368.28,
      "indicadorSinalLancamento": "C",
      "textoInformacaoComplementar": "",
      "numeroCpfCnpjContrapartida": 0,
      "indicadorTipoPessoaContrapartida": "",
      "codigoBancoContrapartida": 0,
      "codigoAgenciaContrapartida": 0,
      "numeroContaContrapartida": "00000000000000000000",
      "textoDvContaContrapartida": ""
    },
    {
      "indicadorTipoLancamento": "1",
      "dataLancamento": 10032025,
      "dataMovimento": 10032025,
      "codigoAgenciaOrigem": 9001,
      "numeroLote": 12020,
      "numeroDocumento": 145081163,
      "codigoHistorico": 624,
      "textoDescricaoHistorico": "Cobrança",
      "valorLancamento": 2000.00,
      "indicadorSinalLancamento": "C",
      "textoInformacaoComplementar": "",
      "numeroCpfCnpjContrapartida": 0,
      "indicadorTipoPessoaContrapartida": "",
      "codigoBancoContrapartida": 0,
      "codigoAgenciaContrapartida": 0,
      "numeroContaContrapartida": "00000000000000000000",
      "textoDvContaContrapartida": ""
    },
    {
      "indicadorTipoLancamento": "1",
      "dataLancamento": 10032025,
      "dataMovimento": 0,
      "codigoAgenciaOrigem": 5750,
      "numeroLote": 54,
      "numeroDocumento": 33822096,
      "codigoHistorico": 976,
      "textoDescricaoHistorico": "TED Transf.Eletr.Disponív",
      "valorLancamento": 870.72,
      "indicadorSinalLancamento": "C",
      "textoInformacaoComplementar": "218 0001 28505126000137 LOGBANK SOLUCO",
      "numeroCpfCnpjContrapartida": 0,
      "indicadorTipoPessoaContrapartida": "",
      "codigoBancoContrapartida": 0,
      "codigoAgenciaContrapartida": 0,
      "numeroContaContrapartida": "00000000000000000000",
      "textoDvContaContrapartida": ""
    },
    {
      "indicadorTipoLancamento": "1",
      "dataLancamento": 10032025,
      "dataMovimento": 0,
      "codigoAgenciaOrigem": 0,
      "numeroLote": 0,
      "numeroDocumento": 0,
      "codigoHistorico": 999,
      "textoDescricaoHistorico": "S A L D O",
      "valorLancamento": 4239.00,
      "indicadorSinalLancamento": "C",
      "textoInformacaoComplementar": "",
      "numeroCpfCnpjContrapartida": 0,
      "indicadorTipoPessoaContrapartida": "",
      "codigoBancoContrapartida": 0,
      "codigoAgenciaContrapartida": 0,
      "numeroContaContrapartida": "00000000000000000000",
      "textoDvContaContrapartida": ""
    },
    {
      "indicadorTipoLancamento": "D",
      "dataLancamento": 10032025,
      "dataMovimento": 0,
      "codigoAgenciaOrigem": 0,
      "numeroLote": 0,
      "numeroDocumento": 0,
      "codigoHistorico": 0,
      "textoDescricaoHistorico": "Saldo Disponivel",
      "valorLancamento": 4239.00,
      "indicadorSinalLancamento": "C",
      "textoInformacaoComplementar": "",
      "numeroCpfCnpjContrapartida": 0,
      "indicadorTipoPessoaContrapartida": "",
      "codigoBancoContrapartida": 0,
      "codigoAgenciaContrapartida": 0,
      "numeroContaContrapartida": "00000000000000000000",
      "textoDvContaContrapartida": ""
    }
  ]
};

// Constantes para identificar tipos de transações
const HIDDEN_TRANSACTION_KEYWORDS = [
  "SALDO DO DIA", 
  "SALDO ANTERIOR", 
  "S A L D O", 
  "SALDO FINAL", 
  "SALDO INICIAL",
  "SALDO DISPONIVEL",
  "SALDO ATUAL",
  "SALDO"
];

// Mapeamento de códigos históricos para categorias
const CODIGO_HISTORICO_PARA_CATEGORIA = {
  144: "PIX",         // PIX
  976: "BANK_TRANSFER", // TED
  830: "DEPOSIT",      // Depósito
  435: "UTILITY",      // Tarifa
  624: "BANK_TRANSFER", // Cobrança
  999: "OTHER"         // Saldo
};

// Função para verificar se é uma transação de saldo
function ehTransacaoSaldo(descricao) {
  if (!descricao) return false;
  
  const upperDesc = descricao.toUpperCase();
  return HIDDEN_TRANSACTION_KEYWORDS.some(keyword => upperDesc.includes(keyword));
}

// Função para processar data do formato DDMMAAAA
function processarData(dataNumero) {
  if (!dataNumero) return new Date();
  
  // Converter para string
  let dataStr = dataNumero.toString();
  
  // Verificar se tem 7 dígitos (dia sem zero à esquerda)
  if (dataStr.length === 7) {
    dataStr = '0' + dataStr;
  }
  
  // Extrair componentes
  const dia = parseInt(dataStr.substring(0, 2));
  const mes = parseInt(dataStr.substring(2, 4)) - 1; // 0-11 em JS
  const ano = parseInt(dataStr.substring(4, 8));
  
  return new Date(ano, mes, dia);
}

// Função para determinar se é débito
function ehDebito(transacao) {
  return transacao.indicadorSinalLancamento === "D" || 
         transacao.indicadorTipoLancamento === "D" ||
         (transacao.textoDescricaoHistorico || "").toLowerCase().includes("debito");
}

// Função para determinar categoria
function determinarCategoria(codigoHistorico, descricao) {
  // Verificar pelo código histórico
  if (codigoHistorico && CODIGO_HISTORICO_PARA_CATEGORIA[codigoHistorico]) {
    return CODIGO_HISTORICO_PARA_CATEGORIA[codigoHistorico];
  }
  
  // Verificar pela descrição
  const desc = descricao.toLowerCase();
  
  if (desc.includes("pix")) return "PIX";
  if (desc.includes("ted") || desc.includes("transf")) return "BANK_TRANSFER";
  if (desc.includes("dep") || desc.includes("dinheiro")) return "DEPOSIT";
  if (desc.includes("tarifa")) return "UTILITY";
  if (desc.includes("cobran")) return "BANK_TRANSFER";
  
  return "OTHER";
}

// Função principal para processar o extrato
function processarExtrato(extrato) {
  console.log("=== PROCESSANDO EXTRATO BANCÁRIO ===");
  console.log(`Total de lançamentos: ${extrato.listaLancamento.length}`);
  
  // Filtrar transações de saldo
  const transacoesReais = extrato.listaLancamento.filter(item => 
    !ehTransacaoSaldo(item.textoDescricaoHistorico)
  );
  
  console.log(`Transações reais (não-saldo): ${transacoesReais.length}`);
  
  // Processar transações
  const transacoesProcessadas = transacoesReais.map(tx => {
    // Determinar se é débito
    const isDebit = ehDebito(tx);
    
    // Calcular valor com sinal correto
    let valor = tx.valorLancamento || 0;
    if (isDebit) {
      valor = -Math.abs(valor);
    } else {
      valor = Math.abs(valor);
    }
    
    // Processar data
    const data = processarData(tx.dataLancamento);
    
    // Determinar categoria
    const categoria = determinarCategoria(tx.codigoHistorico, tx.textoDescricaoHistorico);
    
    // Criar ID externo
    let dataFormatada = tx.dataLancamento.toString();
    if (dataFormatada.length === 7) {
      dataFormatada = '0' + dataFormatada;
    }
    const externalId = `bb-wallet-${dataFormatada}-${tx.numeroDocumento || 0}-${tx.numeroLote || 0}`;
    
    // Construir nome amigável
    let nome = tx.textoDescricaoHistorico || '';
    if (tx.textoInformacaoComplementar) {
      nome = `${nome} - ${tx.textoInformacaoComplementar}`;
    }
    
    return {
      nome,
      valor,
      data: data.toISOString().split('T')[0],
      categoria,
      isDebito: isDebit,
      codigoHistorico: tx.codigoHistorico,
      externalId
    };
  });
  
  // Calcular somatório
  const totalDebitos = transacoesProcessadas
    .filter(tx => tx.valor < 0)
    .reduce((sum, tx) => sum + tx.valor, 0);
    
  const totalCreditos = transacoesProcessadas
    .filter(tx => tx.valor > 0)
    .reduce((sum, tx) => sum + tx.valor, 0);
  
  const saldoLiquido = totalCreditos + totalDebitos;
  
  console.log("=== RESUMO DO PROCESSAMENTO ===");
  console.log(`Total de débitos: R$ ${totalDebitos.toFixed(2)}`);
  console.log(`Total de créditos: R$ ${totalCreditos.toFixed(2)}`);
  console.log(`Saldo líquido: R$ ${saldoLiquido.toFixed(2)}`);
  console.log(`Saldo final extrato: R$ 4239.00`);
  
  console.log("\n=== TRANSAÇÕES PROCESSADAS ===");
  transacoesProcessadas.forEach((tx, index) => {
    console.log(`\n[${index + 1}] ${tx.nome}`);
    console.log(`  Valor: R$ ${tx.valor.toFixed(2)}`);
    console.log(`  Data: ${tx.data}`);
    console.log(`  Categoria: ${tx.categoria}`);
    console.log(`  É débito: ${tx.isDebito}`);
    console.log(`  ID Externo: ${tx.externalId}`);
  });
  
  return {
    transacoes: transacoesProcessadas,
    resumo: {
      totalDebitos,
      totalCreditos,
      saldoLiquido
    }
  };
}

// Executar o processamento
processarExtrato(extractoExemplo);