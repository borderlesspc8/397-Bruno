import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/app/_lib/prisma";
import { z } from "zod";
// Precisamos instalar essa biblioteca com npm install ofx-js
// import { parse } from "ofx-js";

// Função para parsear OFX de forma simplificada até instalarmos a biblioteca
async function parseOfx(content: string): Promise<any> {
  // Implementação melhorada para parseamento do OFX do Banco do Brasil, C6 Bank e Safra
  
  // Identificar o banco de origem do arquivo OFX
  const bankIdentifier = identifyBank(content);
  console.log(`[OFX_PARSER] Banco identificado: ${bankIdentifier}`);
  
  // Extrair informações básicas do arquivo para logging
  const acctId = content.match(/<ACCTID>(.*?)<\/ACCTID>/i)?.[1] || 'desconhecido';
  const dtServer = content.match(/<DTSERVER>(.*?)<\/DTSERVER>/i)?.[1] || '';
  const dtStart = content.match(/<DTSTART>(.*?)<\/DTSTART>/i)?.[1] || '';
  const dtEnd = content.match(/<DTEND>(.*?)<\/DTEND>/i)?.[1] || '';
  
  console.log(`[OFX_PARSER] Processando arquivo OFX: Banco=${bankIdentifier}, Conta=${acctId}, Período=${dtStart || 'N/D'} a ${dtEnd || 'N/D'}`);
  
  // Tratar problemas de codificação comuns em arquivos OFX
  // Substitui caracteres que geralmente aparecem quebrados
  let fixedContent = content
    .replace(/Cobran.a/g, 'Cobranca')
    .replace(/I\.O\.F\./g, 'IOF')
    .replace(/Servi.o/g, 'Servico')
    .replace(/cr.dito/g, 'credito')
    .replace(/cart.o/g, 'cartao')
    .replace(/Dep.sito/g, 'Deposito')
    .replace(/Dep .+? dinheiro/g, 'Deposito em dinheiro')
    .replace(/Jos./g, 'Jose')
    .replace(/Leit.o/g, 'Leitao')
    .replace(/Tarifa .+? Servi.+?/g, 'Tarifa de Servicos');
    
  // Tratamentos específicos para o C6 Bank
  if (bankIdentifier === 'C6 BANK') {
    console.log(`[OFX_PARSER] Aplicando tratamentos específicos para C6 Bank`);
    fixedContent = fixedContent
      .replace(/PIX - ENVIADO/g, 'PIX ENVIADO')
      .replace(/PIX - RECEBIDO/g, 'PIX RECEBIDO')
      .replace(/TRANSF\. ENTRE CONTAS/g, 'TRANSFERENCIA ENTRE CONTAS')
      .replace(/PAGTO\./g, 'PAGAMENTO')
      .replace(/\?\?/g, '')  // Remover caracteres inválidos comuns no C6
      .replace(/\xC3[\x80-\xBF]/g, ''); // Remover códigos UTF-8 problemáticos
  }
  
  // Tratamentos específicos para o Safra
  if (bankIdentifier === 'SAFRA') {
    console.log(`[OFX_PARSER] Aplicando tratamentos específicos para Safra`);
    fixedContent = fixedContent
      .replace(/SAQ\./g, 'SAQUE')
      .replace(/PGTO\./g, 'PAGAMENTO')
      .replace(/DEP\./g, 'DEPOSITO')
      .replace(/--/g, '-')
      .replace(/\s{2,}/g, ' ') // Remover espaços múltiplos
      .replace(/\xC3[\x80-\xBF]/g, ''); // Remover códigos UTF-8 problemáticos
  }

  // Limpar o conteúdo para evitar erros de codificação
  fixedContent = fixedContent.replace(/[^\x00-\x7F]/g, '');
  
  const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let transactions = [];
  let match;
  
  console.log(`[OFX_PARSER] Iniciando extração de transações do arquivo`);
  
  // Estatísticas para log
  let totalTransactions = 0;
  let créditos = 0;
  let débitos = 0;
  let dataInicial = null;
  let dataFinal = null;
  
  while ((match = transactionRegex.exec(fixedContent)) !== null) {
    const transactionContent = match[1];
    
    const fitidMatch = /<FITID>(.*?)<\/FITID>/i.exec(transactionContent);
    const dateMatch = /<DTPOSTED>(.*?)<\/DTPOSTED>/i.exec(transactionContent);
    const amountMatch = /<TRNAMT>(.*?)<\/TRNAMT>/i.exec(transactionContent);
    const typeMatch = /<TRNTYPE>(.*?)<\/TRNTYPE>/i.exec(transactionContent);
    const memoMatch = /<MEMO>(.*?)<\/MEMO>/i.exec(transactionContent);
    const checknumMatch = /<CHECKNUM>(.*?)<\/CHECKNUM>/i.exec(transactionContent);
    const refnumMatch = /<REFNUM>(.*?)<\/REFNUM>/i.exec(transactionContent);
    const nameMatch = /<NAME>(.*?)<\/NAME>/i.exec(transactionContent);
    
    if (fitidMatch && dateMatch && amountMatch) {
      totalTransactions++;
      
      const id = fitidMatch[1];
      const dateStr = dateMatch[1];
      const amount = amountMatch[1]; // Mantemos como string para preservar o sinal
      const type = typeMatch ? typeMatch[1] : "";
      const memo = memoMatch ? memoMatch[1] : "";
      const checknum = checknumMatch ? checknumMatch[1] : "";
      const refnum = refnumMatch ? refnumMatch[1] : "";
      const name = nameMatch ? nameMatch[1] : "";
      
      // Estatísticas para log
      const valor = parseFloat(amount);
      if (valor > 0) créditos++;
      if (valor < 0) débitos++;
      
      // Monitorar período de transações
      const dataTransaction = parseOfxDate(dateStr);
      if (!dataInicial || dataTransaction < dataInicial) dataInicial = dataTransaction;
      if (!dataFinal || dataTransaction > dataFinal) dataFinal = dataTransaction;
      
      // Para o C6 e Safra, se houver NAME e não houver MEMO, usar NAME como MEMO
      let finalMemo = memo;
      if (bankIdentifier === 'C6 BANK' || bankIdentifier === 'SAFRA') {
        if (!memo && name) {
          finalMemo = name;
        } else if (memo && name && memo !== name) {
          finalMemo = `${name} - ${memo}`;
        }
      }
      
      transactions.push({
        FITID: id,
        DTPOSTED: dateStr,
        TRNAMT: amount,
        TRNTYPE: type,
        MEMO: finalMemo,
        NAME: name,
        CHECKNUM: checknum,
        REFNUM: refnum,
        BANK: bankIdentifier
      });
    }
  }
  
  // Log de estatísticas de transações
  console.log(`[OFX_PARSER] Estatísticas de extração: Total=${totalTransactions}, Créditos=${créditos}, Débitos=${débitos}`);
  
  if (dataInicial && dataFinal) {
    console.log(`[OFX_PARSER] Período das transações: ${dataInicial.toISOString().split('T')[0]} a ${dataFinal.toISOString().split('T')[0]}`);
  }
  
  // Log de alerta se não encontrar transações
  if (transactions.length === 0) {
    console.warn(`[OFX_PARSER] ALERTA: Nenhuma transação encontrada no arquivo do banco ${bankIdentifier}`);
  }
  
  return {
    OFX: {
      BANKMSGSRSV1: {
        STMTTRNRS: {
          STMTRS: {
            BANKTRANLIST: {
              STMTTRN: transactions
            },
            BANKID: bankIdentifier
          }
        }
      }
    }
  };
}

// Nova função para identificar o banco de origem
function identifyBank(content: string): string {
  const bankMarkers = {
    'C6 BANK': ['C6 BANK', '<FI>C6 BANK</FI>', 'c6bank', 'C6BANK'],
    'SAFRA': ['SAFRA', '<FI>SAFRA</FI>', 'BANCO SAFRA', 'BANCOSAFRA'],
    'BANCO DO BRASIL': ['BANCO DO BRASIL', '<FI>BANCO DO BRASIL</FI>']
  };
  
  // Verificar cada banco pelos seus marcadores
  for (const [bank, markers] of Object.entries(bankMarkers)) {
    for (const marker of markers) {
      if (content.includes(marker)) {
        console.log(`[OFX_PARSER] Banco identificado através do marcador: "${marker}"`);
        return bank;
      }
    }
  }
  
  // Tentar encontrar um identificador de banco baseado no conteúdo
  const fiMatch = content.match(/<FI>(.*?)<\/FI>/i);
  const bankIdMatch = content.match(/<BANKID>(.*?)<\/BANKID>/i);
  const orgMatch = content.match(/<ORG>(.*?)<\/ORG>/i);
  
  if (fiMatch) {
    console.log(`[OFX_PARSER] Banco identificado via tag FI: ${fiMatch[1]}`);
    return fiMatch[1];
  }
  if (bankIdMatch) {
    console.log(`[OFX_PARSER] Banco identificado via tag BANKID: ${bankIdMatch[1]}`);
    return bankIdMatch[1];
  }
  if (orgMatch) {
    console.log(`[OFX_PARSER] Banco identificado via tag ORG: ${orgMatch[1]}`);
    return orgMatch[1];
  }
  
  console.warn('[OFX_PARSER] ALERTA: Não foi possível identificar o banco de origem');
  return 'DESCONHECIDO';
}

// Função para parsear data no formato do Banco do Brasil: 'YYYYMMDDHHMMSS[-3:BRT]'
function parseOfxDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  try {
    // Tratar o formato do Banco do Brasil com timezone
    if (dateString.includes('[')) {
      dateString = dateString.split('[')[0];
    }
    
    // Formatos específicos para C6 e Safra
    // C6 Bank: 20240329120000[-03:BRT]
    // Safra: YYYYMMDD
    
    // Vamos tratar formatos comuns em arquivos OFX
    if (dateString.length >= 8) {
      // YYYYMMDD ou YYYYMMDDHHMMSS
      const year = parseInt(dateString.slice(0, 4));
      const month = parseInt(dateString.slice(4, 6)) - 1; // Mês em JS é 0-indexed
      const day = parseInt(dateString.slice(6, 8));
      
      // Verificar se os valores são válidos
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        console.warn(`Data inválida: ${dateString}, usando data atual como fallback`);
        return new Date();
      }
      
      if (dateString.length >= 14) {
        // YYYYMMDDHHmmSS
        const hour = parseInt(dateString.slice(8, 10));
        const min = parseInt(dateString.slice(10, 12));
        const sec = parseInt(dateString.slice(12, 14));
        
        if (isNaN(hour) || isNaN(min) || isNaN(sec)) {
          // Se a hora for inválida, usar apenas data
          return new Date(year, month, day);
        }
        
        return new Date(year, month, day, hour, min, sec);
      }
      
      return new Date(year, month, day);
    }
    
    // Tentar parsear como formato ISO ou outro formato reconhecido pelo JS
    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
    
    // Se não conseguirmos parsear, retornar data atual
    console.warn(`Não foi possível parsear a data: ${dateString}, usando data atual como fallback`);
    return new Date();
  } catch (error) {
    console.error(`Erro ao parsear data: ${dateString}`, error);
    return new Date();
  }
}

// Função para normalizar texto com caracteres especiais
function normalizeText(text: string, bank?: string): string {
  if (!text) return '';
  
  // Substituir caracteres específicos conhecidos
  const specificReplacements: Record<string, string> = {
    'NANQUIM': 'NANQUIM', // Cartão Elo Nanquim
    'SOP NOVA IMPERATRIZ': 'SOP NOVA IMPERATRIZ',
    'Clube de beneficios': 'Clube de beneficios',
    'Pix - Enviado': 'Pix - Enviado',
    'Pix - Recebido': 'Pix - Recebido',
    'Dep dinheiro ATM': 'Depósito dinheiro ATM',
    'IOF Saldo Devedor': 'IOF Saldo Devedor',
    'Juros Saldo Devedor': 'Juros Saldo Devedor'
  };
  
  // Adições específicas para C6 Bank
  if (bank === 'C6 BANK') {
    specificReplacements['PIX ENVIADO'] = 'PIX ENVIADO';
    specificReplacements['PIX RECEBIDO'] = 'PIX RECEBIDO';
    specificReplacements['TRANSFERENCIA ENTRE CONTAS'] = 'TRANSFERENCIA ENTRE CONTAS';
    specificReplacements['PAGAMENTO DE CONTA'] = 'PAGAMENTO DE CONTA';
  }
  
  // Adições específicas para Safra
  if (bank === 'SAFRA') {
    specificReplacements['SAQUE CAIXA'] = 'SAQUE CAIXA';
    specificReplacements['PAGAMENTO CONTA'] = 'PAGAMENTO CONTA';
    specificReplacements['DEPOSITO'] = 'DEPOSITO';
    specificReplacements['TRANSFERENCIA PIX'] = 'TRANSFERENCIA PIX';
  }
  
  // Procurar por substituições específicas
  for (const [pattern, replacement] of Object.entries(specificReplacements)) {
    if (text.includes(pattern)) {
      text = text.replace(pattern, replacement);
    }
  }
  
  // Substituir caracteres problemáticos
  let normalized = text
    .replace(/[^\x20-\x7E]/g, '') // Remove caracteres não-ASCII
    .replace(/\s+/g, ' ') // Remove espaços extras
    .trim();
  
  return normalized;
}

// Define a interface para uma transação OFX
interface OfxTransaction {
  FITID: string;
  DTPOSTED: string;
  TRNAMT: string;
  TRNTYPE?: string;
  MEMO?: string;
  CHECKNUM?: string;
  REFNUM?: string;
  NAME?: string;
  BANK?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession();
    if (!session?.user) {
      console.warn('[OFX_PARSER] Tentativa de acesso não autorizado');
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Processar os dados do form
    const formData = await request.formData();
    const walletId = formData.get("walletId") as string;
    const file = formData.get("file") as File;

    console.log(`[OFX_PARSER] Iniciando processamento de arquivo OFX: Wallet=${walletId}, Arquivo=${file?.name}, Tamanho=${file?.size} bytes`);

    if (!walletId) {
      console.warn('[OFX_PARSER] Tentativa de upload sem ID da carteira');
      return NextResponse.json(
        { error: "ID da carteira não fornecido" },
        { status: 400 }
      );
    }

    if (!file) {
      console.warn('[OFX_PARSER] Tentativa de upload sem arquivo');
      return NextResponse.json(
        { error: "Nenhum arquivo fornecido" },
        { status: 400 }
      );
    }

    // Verificar tipo de arquivo
    if (!file.name.toLowerCase().endsWith(".ofx")) {
      console.warn(`[OFX_PARSER] Tipo de arquivo inválido: ${file.name}`);
      return NextResponse.json(
        { error: "O arquivo deve ser do tipo OFX" },
        { status: 400 }
      );
    }

    // Limite de tamanho (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      console.warn(`[OFX_PARSER] Arquivo muito grande: ${file.size} bytes`);
      return NextResponse.json(
        { error: "O arquivo excede o tamanho máximo permitido (10MB)" },
        { status: 400 }
      );
    }

    // Ler o conteúdo do arquivo
    console.log('[OFX_PARSER] Lendo conteúdo do arquivo...');
    const fileContent = await file.text();
    console.log(`[OFX_PARSER] Arquivo lido: ${fileContent.length} caracteres`);

    // Parsear o arquivo OFX
    try {
      console.log('[OFX_PARSER] Iniciando parseamento do arquivo OFX...');
      const parsedOfx = await parseOfx(fileContent);
      
      // Detectar o banco de origem
      const detectedBank = identifyBank(fileContent);
      console.log(`[OFX_PARSER] Banco identificado: ${detectedBank}`);
      
      // Tentar extrair identificadores únicos do arquivo
      let fileIdentifier = "";
      try {
        // Tente encontrar o DTSERVER (data do servidor) ou DTASOF (data de referência)
        const dtServer = fileContent.match(/<DTSERVER>(.*?)<\/DTSERVER>/i)?.[1];
        const dtAsOf = fileContent.match(/<DTASOF>(.*?)<\/DTASOF>/i)?.[1];
        const bankId = fileContent.match(/<BANKID>(.*?)<\/BANKID>/i)?.[1];
        const acctId = fileContent.match(/<ACCTID>(.*?)<\/ACCTID>/i)?.[1];
        
        // Criar um identificador combinando esses valores
        fileIdentifier = [
          bankId || "",
          acctId || "",
          dtServer || dtAsOf || "",
        ].filter(Boolean).join("_");
        
        // Se não conseguir extrair nenhum ID, use um hash básico do conteúdo
        if (!fileIdentifier) {
          fileIdentifier = Buffer.from(fileContent).toString('base64').substring(0, 50);
        }
        
        console.log(`[OFX_PARSER] Identificador do arquivo: ${fileIdentifier}`);
      } catch (error) {
        console.warn(`[OFX_PARSER] Erro ao extrair identificador único: ${error}`);
        fileIdentifier = Buffer.from(fileContent).toString('base64').substring(0, 50);
      }
      
      // Extrair transações
      let transactions: any[] = [];
      
      // Verificar se o OFX tem a estrutura esperada
      if (parsedOfx && 
          parsedOfx.OFX && 
          parsedOfx.OFX.BANKMSGSRSV1 && 
          parsedOfx.OFX.BANKMSGSRSV1.STMTTRNRS && 
          parsedOfx.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS && 
          parsedOfx.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST) {
          
        const bankTranList = parsedOfx.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST;
        
        if (bankTranList.STMTTRN) {
          // Converter para array se for um objeto único
          const stmtTrn = Array.isArray(bankTranList.STMTTRN) 
            ? bankTranList.STMTTRN 
            : [bankTranList.STMTTRN];
          
          // Obter o identificador do banco da resposta parseada ou da detecção inicial
          const bankIdentifier = 
            parsedOfx.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKID || 
            detectedBank;
          
          console.log(`[OFX_PARSER] Processando ${stmtTrn.length} transações do banco ${bankIdentifier}`);
          
          transactions = stmtTrn.map((transaction: OfxTransaction) => {
            const amount = parseFloat(transaction.TRNAMT);
            const rawDescription = transaction.MEMO || 
                            `Transação ${transaction.REFNUM || transaction.CHECKNUM || transaction.FITID}`;
            
            // Limpar e normalizar a descrição
            const description = normalizeText(
              rawDescription, 
              'BANK' in transaction ? transaction.BANK : undefined
            );
            
            // Converter para objeto Date e então para string ISO para garantir compatibilidade
            const transactionDate = parseOfxDate(transaction.DTPOSTED);
            
            return {
              id: transaction.FITID,
              date: transactionDate.toISOString(),
              description: description,
              amount: Math.abs(amount),
              type: amount < 0 ? 'EXPENSE' : 'INCOME',
              // Incluir campos adicionais que podem ser úteis
              reference: transaction.REFNUM || transaction.CHECKNUM || "",
              bank: 'BANK' in transaction ? transaction.BANK : bankIdentifier || "DESCONHECIDO"
            };
          });
        }
      }
      
      // Verificar se encontrou transações
      if (transactions.length === 0) {
        console.warn(`[OFX_PARSER] Nenhuma transação encontrada no arquivo ${file.name}`);
        return NextResponse.json(
          { error: "Nenhuma transação encontrada no arquivo OFX" },
          { status: 400 }
        );
      }
      
      console.log(`[OFX_PARSER] Verificando se o arquivo já foi importado anteriormente...`);
      // Verificar se este arquivo já foi importado
      const existingImport = await prisma.transaction.findFirst({
        where: {
          walletId,
          metadata: {
            path: ['ofxFileIdentifier'],
            equals: fileIdentifier
          }
        }
      });

      if (existingImport) {
        console.warn(`[OFX_PARSER] Arquivo ${file.name} já foi importado anteriormente`);
        return NextResponse.json(
          { error: "Este extrato já foi importado anteriormente", alreadyImported: true },
          { status: 400 }
        );
      }

      console.log(`[OFX_PARSER] Arquivo processado com sucesso: ${transactions.length} transações encontradas`);
      
      // Calcular estatísticas para log
      const depositCount = transactions.filter(t => t.type === 'DEPOSIT').length;
      const expenseCount = transactions.filter(t => t.type === 'EXPENSE').length;
      const totalAmount = transactions.reduce((acc, t) => acc + (t.type === 'DEPOSIT' ? t.amount : -t.amount), 0);
      
      console.log(`[OFX_PARSER] Estatísticas das transações processadas: 
        - Total: ${transactions.length}
        - Depósitos: ${depositCount} (${((depositCount / transactions.length) * 100).toFixed(2)}%)
        - Despesas: ${expenseCount} (${((expenseCount / transactions.length) * 100).toFixed(2)}%)
        - Saldo: ${totalAmount.toFixed(2)}`);

      return NextResponse.json({
        success: true,
        transactions,
        fileIdentifier,
        source: detectedBank || "OFX Import",
        bankName: detectedBank,
        stats: {
          total: transactions.length,
          deposits: depositCount,
          expenses: expenseCount,
          balance: totalAmount
        }
      });
    } catch (error) {
      console.error(`[OFX_PARSER] Erro ao parsear arquivo OFX:`, error);
      return NextResponse.json(
        { error: "Não foi possível processar o arquivo OFX" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`[OFX_PARSER] Erro não tratado:`, error);
    return NextResponse.json(
      { error: "Erro ao processar a requisição" },
      { status: 500 }
    );
  }
} 