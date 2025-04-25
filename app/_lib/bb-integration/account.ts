import { Agent } from 'https';
import { BBExtractResponse, ExtractOptions } from './types';
import { makeRequest } from './api-client';
import { prepareCertificates } from './certificates';
import { formatarData } from './utils';
import axios from 'axios';

/**
 * Obtém o extrato bancário de uma conta
 * @param agencia Número da agência
 * @param conta Número da conta
 * @param accessToken Token de acesso
 * @param appKey Chave da aplicação
 * @param options Opções adicionais
 * @returns Extrato bancário e saldo
 */
export async function getExtractAndBalance(
  agencia: string,
  conta: string,
  accessToken: string,
  appKey: string,
  options: ExtractOptions
): Promise<{ extract: BBExtractResponse; balance: number }> {
  try {
    console.log('[BB_EXTRACT] Iniciando obtenção do extrato e saldo');
    
    const walletId = options.walletId;
    if (!walletId) {
      throw new Error('[BB_EXTRACT] ID da carteira é obrigatório');
    }
    
    // Validar parâmetros obrigatórios
    if (!agencia || !conta || !accessToken || !appKey) {
      throw new Error('[BB_EXTRACT] Parâmetros obrigatórios não fornecidos');
    }
    
    // Remover zeros à esquerda
    const agenciaFormatada = agencia.replace(/^0+/, '');
    const contaFormatada = conta.replace(/^0+/, '');
    
    // URL base da API
    const apiUrl = "https://api-extratos.bb.com.br/extratos/v1";
    
    // Preparar datas
    let dataInicio = '';
    let dataFim = '';
    
    if (options.useDatasJaFormatadas && options.dataInicioOriginal && options.dataFimOriginal) {
      dataInicio = options.dataInicioOriginal;
      dataFim = options.dataFimOriginal;
    } else if (options.dataInicio && options.dataFim) {
      dataInicio = formatarData(options.dataInicio);
      dataFim = formatarData(options.dataFim);
    } else {
      const hoje = new Date();
      const dia = hoje.getDate().toString();
      const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
      const ano = hoje.getFullYear();
      const dataFormatada = `${dia}${mes}${ano}`;
      dataInicio = dataFormatada;
      dataFim = dataFormatada;
    }

    try {
      // Preparar certificados
      const certPaths = await prepareCertificates('BB_EXTRACT', walletId);
      const agent = await createHttpsAgent(certPaths);
      
      // URL base para a requisição
      const baseUrl = `${apiUrl}/conta-corrente/agencia/${agenciaFormatada}/conta/${contaFormatada}`;
      
      // Parâmetros para extrato completo
      const paramsExtrato = new URLSearchParams({
        numeroPagina: (options?.numeroPagina || 1).toString(),
        quantidadeRegistros: (options?.quantidadeRegistros || 100).toString(),
        dataInicioSolicitacao: dataInicio,
        dataFimSolicitacao: dataFim
      });

      // Headers da requisição
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'gw-dev-app-key': appKey,
        'X-Application-Key': appKey
      };

      // Obter extrato completo
      console.log('[BB_EXTRACT] Obtendo extrato completo...');
      const extractResponse = await makeRequest<any>(
        'BB_EXTRACT',
        `${baseUrl}?${paramsExtrato.toString()}`,
        'GET',
        headers,
        agent
      );

      // Converter e processar o extrato
      const processedExtract = convertApiResponseToExtractResponse(extractResponse);
      
      // Extrair saldo do extrato
      const balance = extractBalanceFromResponse(extractResponse);
      
      console.log('[BB_EXTRACT] Extrato e saldo obtidos com sucesso');
      console.log('[BB_EXTRACT] Saldo:', balance);

      return {
        extract: processedExtract,
        balance
      };
    } catch (requestError) {
      console.error('[BB_EXTRACT_ERROR] Erro na requisição:', requestError);
      throw requestError;
    }
  } catch (error) {
    console.error('[BB_EXTRACT_ERROR]', error);
    throw error;
  }
}

/**
 * Obtém o extrato bancário de uma conta
 */
export async function getExtract(
  agencia: string,
  conta: string,
  accessToken: string,
  appKey: string,
  options: ExtractOptions
): Promise<BBExtractResponse> {
  try {
    console.log('[BB_EXTRACT] Iniciando obtenção do extrato com parâmetros:', {
      agencia,
      conta,
      hasToken: !!accessToken,
      hasAppKey: !!appKey,
      dataInicio: options.dataInicio,
      dataFim: options.dataFim
    });
    
    // Validar parâmetros obrigatórios
    if (!agencia || !conta || !accessToken || !appKey) {
      throw new Error('[BB_EXTRACT] Parâmetros obrigatórios não fornecidos');
    }
    
    // Obter o período do extrato
    let dataInicio = options.dataInicio || '';
    let dataFim = options.dataFim || '';
    
    // Caso as datas não venham formatadas, formatar no padrão DDMMYYYY
    if (!options.useDatasJaFormatadas) {
      if (options.dataInicio) {
        const dataInicioObj = new Date(options.dataInicio);
        dataInicio = formatarDataDDMMAAAA(dataInicioObj);
      }
      
      if (options.dataFim) {
        const dataFimObj = new Date(options.dataFim);
        dataFim = formatarDataDDMMAAAA(dataFimObj);
      }
    }
    
    console.log('[BB_EXTRACT] Datas formatadas:', {
      dataInicio,
      dataFim
    });
    
    // Remover zeros à esquerda das informações de agência e conta
    const agenciaFormatada = agencia.replace(/^0+/, '');
    const contaFormatada = conta.replace(/^0+/, '');
    
    // URL base da API
    const apiUrl = "https://api-extratos.bb.com.br/extratos/v1";
    
    // Preparar certificados
    const certPaths = await prepareCertificates('BB_EXTRACT', options.walletId || 'default');
    const agent = await createHttpsAgent(certPaths);
    
    // URL base para a requisição
    const baseUrl = `${apiUrl}/conta-corrente/agencia/${agenciaFormatada}/conta/${contaFormatada}`;
    
    // Headers da requisição
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'gw-dev-app-key': appKey,
      'X-Application-Key': appKey
    };
    
    console.log('[BB_EXTRACT] Headers da requisição:', mascaraSensiveis(headers));
    
    // Parâmetros da primeira página
    const params = new URLSearchParams({
      numeroPagina: options.numeroPagina?.toString() || '1',
      quantidadeRegistros: options.quantidadeRegistros?.toString() || '100'
    });
    
    if (dataInicio) {
      params.append('dataInicioSolicitacao', dataInicio);
    }
    
    if (dataFim) {
      params.append('dataFimSolicitacao', dataFim);
    }
    
    // Fazer a requisição para a primeira página
    const primeiraPagina = await makeRequest<any>(
      'BB_EXTRACT',
      `${baseUrl}?${params.toString()}`,
      'GET',
      headers,
      agent
    );
    
    // Log para debug
    console.log('[BB_EXTRACT] Resposta recebida com status:', primeiraPagina ? 200 : 0);
    
    // Verificar informações de paginação
    const totalPaginas = primeiraPagina?.quantidadeTotalPagina || 1;
    const totalRegistros = primeiraPagina?.quantidadeTotalRegistro || 0;
    
    console.log('[BB_EXTRACT] Total de páginas:', totalPaginas);
    console.log('[BB_EXTRACT] Total de registros:', totalRegistros);

    // Armazenar todos os lançamentos obtidos
    let todosLancamentos: any[] = [];
    
    // Adicionar lançamentos da primeira página
    if (primeiraPagina?.listaLancamento) {
      todosLancamentos = todosLancamentos.concat(primeiraPagina.listaLancamento);
    }

    // Buscar páginas restantes
    for (let pagina = 2; pagina <= totalPaginas; pagina++) {
      console.log(`[BB_EXTRACT] Buscando página ${pagina} de ${totalPaginas}`);
      
      const response = await makeRequest<any>(
        'BB_EXTRACT',
        `${baseUrl}?numeroPagina=${pagina}&quantidadeRegistros=100&dataInicioSolicitacao=${dataInicio}&dataFimSolicitacao=${dataFim}`,
        'GET',
        headers,
        agent
      );

      if (response?.listaLancamento) {
        todosLancamentos = todosLancamentos.concat(response.listaLancamento);
      }
    }

    console.log('[BB_EXTRACT] Total de lançamentos obtidos:', todosLancamentos.length);
    
    // Log para debug
    if (todosLancamentos.length > 0) {
      console.log('[BB_EXTRACT] Tipos de lançamentos encontrados:', 
        [...new Set(todosLancamentos.map(lancamento => lancamento.textoDescricaoHistorico))].join(', ')
      );
    }

    // Converter e processar o extrato com todos os lançamentos
    const processedExtract = convertApiResponseToExtractResponse({
      ...primeiraPagina,
      listaLancamento: todosLancamentos
    });
    
    return processedExtract;
  } catch (error) {
    console.error('[BB_EXTRACT_ERROR]', error);
    throw error;
  }
}

/**
 * Obtém o saldo atual da conta
 */
export async function getBalance(
  agencia: string,
  conta: string,
  accessToken: string,
  appKey: string,
  walletId: string
): Promise<number> {
  try {
    console.log('[BB_BALANCE] Iniciando obtenção do saldo');
    
    // Validar parâmetros obrigatórios
    if (!agencia || !conta || !accessToken || !appKey) {
      throw new Error('[BB_BALANCE] Parâmetros obrigatórios não fornecidos');
    }
    
    // Remover zeros à esquerda
    const agenciaFormatada = agencia.replace(/^0+/, '');
    const contaFormatada = conta.replace(/^0+/, '');
    
    // URL base da API
    const apiUrl = "https://api-extratos.bb.com.br/extratos/v1";
    
    // Preparar certificados
    const certPaths = await prepareCertificates('BB_BALANCE', walletId);
    const agent = await createHttpsAgent(certPaths);
    
    // URL base para a requisição
    const baseUrl = `${apiUrl}/conta-corrente/agencia/${agenciaFormatada}/conta/${contaFormatada}`;
    
    // Headers da requisição
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'gw-dev-app-key': appKey,
      'X-Application-Key': appKey
    };

    // Obter extrato com apenas um registro para pegar o saldo
    const extractResponse = await makeRequest<any>(
      'BB_BALANCE',
      `${baseUrl}?numeroPagina=1&quantidadeRegistros=1`,
      'GET',
      headers,
      agent
    );

    // Extrair saldo do extrato
    const balance = extractBalanceFromResponse(extractResponse);
    
    console.log('[BB_BALANCE] Saldo obtido:', balance);
    return balance;
  } catch (error) {
    console.error('[BB_BALANCE_ERROR]', error);
    throw error;
  }
}

/**
 * Extrai o saldo da resposta do extrato
 */
function extractBalanceFromResponse(data: any): number {
  // Verificar onde estão os lançamentos (podem estar em diferentes estruturas)
  let lancamentos = [];
  
  if (data?.listaLancamento && Array.isArray(data.listaLancamento)) {
    lancamentos = data.listaLancamento;
  } else if (data?.lancamentos && Array.isArray(data.lancamentos)) {
    lancamentos = data.lancamentos;
  } else if (data?.data?.listaLancamento && Array.isArray(data.data.listaLancamento)) {
    lancamentos = data.data.listaLancamento;
  } else if (data?.data?.lancamentos && Array.isArray(data.data.lancamentos)) {
    lancamentos = data.data.lancamentos;
  }
  
  if (!lancamentos.length) {
    console.warn('[BB_EXTRACT] Sem lançamentos para extrair saldo');
    return 0;
  }

  // Procurar por diferentes tipos de lançamentos de saldo
  const saldoTypes = ['Saldo Atual', 'Saldo Disponivel', 'S A L D O', 'SALDO ANTERIOR'];
  
  for (const saldoType of saldoTypes) {
    const saldoLancamento = lancamentos.find((item: any) => 
      item.textoDescricaoHistorico === saldoType
    );
    
    if (saldoLancamento) {
      console.log(`[BB_EXTRACT] Saldo encontrado (${saldoType}):`, saldoLancamento.valorLancamento);
      return saldoLancamento.valorLancamento;
    }
  }

  // Se não encontrou por texto exato, tentar buscar lançamentos que contenham a palavra "saldo"
  const saldoLancamento = lancamentos.find((item: any) => 
    item.textoDescricaoHistorico?.toLowerCase().includes('saldo')
  );
  
  if (saldoLancamento) {
    console.log(`[BB_EXTRACT] Saldo encontrado (contém palavra saldo):`, saldoLancamento.valorLancamento);
    return saldoLancamento.valorLancamento;
  }

  console.warn('[BB_EXTRACT] Nenhum tipo de saldo encontrado');
  console.log('[BB_EXTRACT] Lançamentos disponíveis:', lancamentos.map((item: any) => item.textoDescricaoHistorico || '').join(', '));
  return 0;
}

/**
 * Determina se um lançamento é débito ou crédito
 */
function determinarTipoLancamento(item: any): "D" | "C" {
  // Log detalhado para debug
  const itemProps = {
    indicadorSinal: item.indicadorSinalLancamento,
    indicadorTipo: item.indicadorTipoLancamento,
    descricao: item.textoDescricaoHistorico || item.descricaoLancamento || '',
    valor: item.valorLancamento,
    tipoOperacao: item.nomeTipoOperacao || '',
    complemento: item.complementoHistorico || item.textoInformacaoComplementar || ''
  };
  
  console.log('[BB_EXTRACT] Determinando tipo de lançamento:', itemProps);

  // Se já tiver o indicador de sinal explícito, usar ele
  if (item.indicadorSinalLancamento) {
    return item.indicadorSinalLancamento === "D" ? "D" : "C";
  }

  // Se tiver o indicador de tipo explícito
  if (item.indicadorTipoLancamento) {
    // Alguns sistemas usam "1" para débito e "2" para crédito
    if (item.indicadorTipoLancamento === "1") return "D";
    if (item.indicadorTipoLancamento === "2") return "C";
    
    // Outros usam "D" e "C" diretamente
    return item.indicadorTipoLancamento === "D" ? "D" : "C";
  }

  // Verificar na descrição
  const desc = (itemProps.descricao + " " + itemProps.tipoOperacao + " " + itemProps.complemento).toLowerCase();
  if (desc.includes("debito") || desc.includes("pagamento") || desc.includes("saque") || 
      desc.includes("compra") || desc.includes("envio") || desc.includes("transferencia enviada")) {
    return "D";
  }
  
  if (desc.includes("credito") || desc.includes("deposito") || desc.includes("recebimento") || 
      desc.includes("transferencia recebida") || desc.includes("salario")) {
    return "C";
  }

  // Se tiver valor negativo, considerar como débito
  if (item.valorLancamento !== undefined && item.valorLancamento < 0) {
    return "D";
  }

  // Por padrão, considerar como crédito (caso mais comum na API do BB)
  return "C";
}

/**
 * Converte a resposta da API para o formato BBExtractResponse
 */
function convertApiResponseToExtractResponse(data: any): BBExtractResponse {
  console.log('[BB_EXTRACT] Processando resposta da API:', {
    temData: !!data,
    temLancamentos: !!data?.lancamentos,
    temListaLancamento: !!data?.listaLancamento,
    estrutura: Object.keys(data || {})
  });

  // Verificar diferentes estruturas possíveis da resposta
  let lancamentos = [];
  
  if (data?.listaLancamento && Array.isArray(data.listaLancamento)) {
    lancamentos = data.listaLancamento;
  } else if (data?.lancamentos && Array.isArray(data.lancamentos)) {
    lancamentos = data.lancamentos;
  } else if (data?.data?.listaLancamento && Array.isArray(data.data.listaLancamento)) {
    lancamentos = data.data.listaLancamento;
  } else if (data?.data?.lancamentos && Array.isArray(data.data.lancamentos)) {
    lancamentos = data.data.lancamentos;
  }

  if (!lancamentos.length) {
    console.warn('[BB_EXTRACT] Nenhum lançamento encontrado na resposta');
    return {
      quantidadeTotalPagina: data?.quantidadeTotalPagina || 1,
      quantidadeTotalRegistro: data?.quantidadeTotalRegistro || 0,
      listaLancamento: []
    };
  }

  // Log dos primeiros lançamentos para debug
  console.log('[BB_EXTRACT] Primeiros lançamentos:', lancamentos.slice(0, 3));

  return {
    quantidadeTotalPagina: data?.quantidadeTotalPagina || 1,
    quantidadeTotalRegistro: data?.quantidadeTotalRegistro || lancamentos.length,
    listaLancamento: lancamentos.map((lancamento: any) => {
      const tipoLancamento = determinarTipoLancamento(lancamento);
      
      // Formatar CPF/CNPJ se existir
      let cpfCnpjFormatado = '';
      if (lancamento.numeroCpfCnpjContrapartida) {
        const cpfCnpj = lancamento.numeroCpfCnpjContrapartida.toString().padStart(11, '0');
        if (cpfCnpj.length === 11) {
          // CPF
          cpfCnpjFormatado = cpfCnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (cpfCnpj.length === 14) {
          // CNPJ
          cpfCnpjFormatado = cpfCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
      }
      
      // Construir descrição completa na ordem correta
      const descricaoCompleta = [
        lancamento.textoDescricaoHistorico,
        lancamento.textoInformacaoComplementar,
        cpfCnpjFormatado
      ]
        .filter(Boolean) // Remove valores nulos/undefined
        .join(' - ');

      console.log('[BB_EXTRACT] Processando lançamento:', {
        data: lancamento.dataLancamento || lancamento.dataMovimento,
        valor: lancamento.valorLancamento,
        tipo: tipoLancamento,
        descricao: descricaoCompleta
      });

      return {
        indicadorSinalLancamento: tipoLancamento,
        dataMovimento: lancamento.dataMovimento || lancamento.dataLancamento || '',
        lancamentoContaCorrenteCliente: {
          numeroRemessaBanco: lancamento.numeroRemessaBanco || lancamento.codigoBancoContrapartida || 0,
          nomeTipoOperacao: descricaoCompleta || lancamento.nomeTipoOperacao || '',
          valorLancamentoRemessa: lancamento.valorLancamentoRemessa || lancamento.valorLancamento || 0,
          descricaoGrupoPagamento: lancamento.descricaoGrupoPagamento || '',
          codigoHistorico: lancamento.codigoHistorico || 0,
          lancamentoContaCorrenteCliente: lancamento.lancamentoContaCorrenteCliente || lancamento.numeroLancamento || 0,
          nomeBanco: lancamento.nomeBanco || 'BANCO DO BRASIL',
          numeroEvento: lancamento.numeroEvento || 0,
          complementoHistorico: lancamento.complementoHistorico || ''
        }
      };
    })
  };
}

/**
 * Cria um agente HTTPS com os certificados necessários
 */
async function createHttpsAgent(certPaths: { ca: string; cert: string; key: string }): Promise<Agent> {
  const { createHttpsAgent: createAgent } = await import('./certificates');
  return createAgent(certPaths);
}

// Formata uma data para DD/MM/YYYY
function formatarDataDDMMAAAA(data: Date): string {
  const dia = data.getDate().toString().padStart(2, '0');
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}${mes}${ano}`;
}

// Mascara informações sensíveis para logs
function mascaraSensiveis(obj: Record<string, any>): Record<string, any> {
  const result = { ...obj };
  
  // Mascara o token de autorização
  if (result.Authorization) {
    result.Authorization = result.Authorization.startsWith('Bearer ')
      ? 'Bearer [REDACTED]'
      : '[REDACTED]';
  }
  
  // Mascara chaves de aplicação
  if (result['gw-dev-app-key']) {
    result['gw-dev-app-key'] = '[REDACTED]';
  }
  
  if (result['X-Application-Key']) {
    result['X-Application-Key'] = '[REDACTED]';
  }
  
  return result;
} 