import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { getAuthSession } from "@/app/_lib/auth";
import { startOfMonth, endOfMonth, format, parseISO, isAfter, isBefore, isEqual } from "date-fns";
import { BBIntegrationService } from "@/app/_lib/bb-integration";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthSession();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Extrair parâmetros da URL
    const searchParams = request.nextUrl.searchParams;
    
    // Definir datas padrão (primeiro e último dia do mês atual)
    const now = new Date();
    const defaultStartDate = startOfMonth(now);
    const defaultEndDate = endOfMonth(now);

    // Extrair e validar parâmetros de busca
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : defaultStartDate;
    
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : defaultEndDate;
    
    const searchQuery = searchParams.get('query') || '';
    const transactionType = searchParams.get('type') || '';
    const walletId = searchParams.get('walletId') || '';
    const forceExtract = searchParams.get('forceExtract') === 'true';
    const forceAll = searchParams.get('forceAll') === 'true';
    
    console.log('[SMART_SEARCH] Parâmetros recebidos:', {
      urlParams: Array.from(searchParams.entries()),
      processedParams: {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        searchQuery,
        transactionType,
        walletId,
        forceExtract,
        forceAll
      }
    });

    // Criar filtro para o Prisma
    const baseFilter: any = {
      userId: user.id
    };
    
    // Adicionar filtros de data apenas se não estiver forçando busca de todas as transações
    if (!forceAll) {
      baseFilter.date = {
        gte: startDate,
        lte: endDate
      };
    }

    // Adicionar filtro de carteira se especificado
    if (walletId && walletId !== 'all') {
      baseFilter.walletId = walletId;
    }

    // Adicionar filtro de tipo se especificado
    if (transactionType && ['DEPOSIT', 'EXPENSE', 'INVESTMENT'].includes(transactionType)) {
      baseFilter.type = transactionType;
    }

    // Adicionar busca por nome se houver uma consulta
    if (searchQuery) {
      baseFilter.name = {
        contains: searchQuery,
        mode: 'insensitive'
      };
    }

    // Buscar transações do banco de dados
    const dbTransactions = await db.transaction.findMany({
      where: baseFilter,
      orderBy: {
        date: 'desc'
      },
      include: {
        wallet: true,
      },
      // Adicionar limitação apenas se não estiver buscando todas
      ...(forceAll ? {} : { take: 100 })
    });
    
    console.log(`[SMART_SEARCH] Encontradas ${dbTransactions.length} transações no banco de dados local`);
    
    // Verificar se precisamos buscar mais dados do extrato bancário
    // Se não encontramos transações no banco de dados local para o período solicitado
    // E se o período solicitado está dentro dos últimos 3 meses (limite típico de extratos bancários)
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);
    
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    
    // Se não encontramos transações E o período é recente (últimos 3 meses)
    // OU se o usuário forçou a busca no extrato
    const needsExtractSearch = (dbTransactions.length === 0 && 
                               (isAfter(startDate, threeMonthsAgo) || isEqual(startDate, threeMonthsAgo)))
                               || forceExtract;
    
    console.log(`[SMART_SEARCH] Necessita busca no extrato: ${needsExtractSearch}`);
    
    // Se precisamos buscar do extrato bancário
    let extractTransactions: any[] = [];
    let isSearchingExtract = false;
    
    if (needsExtractSearch && walletId && walletId !== 'all') {
      try {
        console.log(`[SMART_SEARCH] Iniciando busca no extrato bancário para a carteira: ${walletId}`);
        isSearchingExtract = true;
        
        // Buscar a carteira para verificar se é uma carteira do Banco do Brasil
        const wallet = await db.wallet.findUnique({
          where: { id: walletId },
          include: {
            bank: true
          }
        });
        
        if (!wallet) {
          throw new Error("Carteira não encontrada");
        }
        
        const isBancoDoBrasil = wallet.bank?.name?.toLowerCase().includes('brasil');
        const walletMetadata = wallet.metadata as Record<string, any> || {};
        
        // Se for uma carteira do Banco do Brasil, buscar o extrato
        if (isBancoDoBrasil && (wallet.type as string) === "BANK_INTEGRATION") {
          console.log(`[SMART_SEARCH] Carteira do Banco do Brasil identificada`);
          
          // Verificar se temos os dados necessários para autenticação
          if (!walletMetadata.clientBasic || !walletMetadata.applicationKey || !walletMetadata.agencia || !walletMetadata.conta) {
            throw new Error("Dados de conexão bancária insuficientes");
          }
          
          // Formatar as datas para o formato esperado pelo BB (DDMMYYYY)
          const startDateFormatted = format(startDate, 'ddMMyyyy');
          const endDateFormatted = format(endDate, 'ddMMyyyy');
          
          console.log(`[SMART_SEARCH] Buscando extrato para o período: ${startDateFormatted} a ${endDateFormatted}`);
          
          // Usar o serviço de integração para buscar o extrato
          const bbService = BBIntegrationService.getInstance();
          
          // Buscar o extrato
          const extract = await bbService.getExtract(
            walletMetadata.agencia,
            walletMetadata.conta,
            walletMetadata.clientBasic,
            walletMetadata.applicationKey,
            {
              dataInicio: startDateFormatted,
              dataFim: endDateFormatted,
              walletId: walletId,
              useDatasJaFormatadas: true
            }
          );
          
          console.log(`[SMART_SEARCH] Extrato recebido, processando...`);
          
          // Processar o extrato para extrair transações
          const transacoes = extract.listaLancamento || [];
          
          // Filtrar transações reais (ignorar registros de saldo)
          const transacoesReais = transacoes.filter(item => {
            const descricao = item.lancamentoContaCorrenteCliente?.nomeTipoOperacao || 
                           item.textoDescricaoHistorico || "";
            return !shouldHideTransaction(descricao);
          });
          
          console.log(`[SMART_SEARCH] Transações reais encontradas: ${transacoesReais.length}`);
          
          if (transacoesReais.length > 0) {
            // Processar as transações para o formato esperado
            const processedTransactions = await processAndSaveTransactions(transacoesReais, wallet, user.id);
            
            // Adicionar às transações encontradas
            extractTransactions = processedTransactions;
            
            console.log(`[SMART_SEARCH] Transações processadas e salvas: ${processedTransactions.length}`);
          }
        }
      } catch (error) {
        console.error('[SMART_SEARCH_ERROR] Erro ao buscar extrato:', error);
        // Continuar com as transações do banco de dados local mesmo em caso de erro
      } finally {
        isSearchingExtract = false;
      }
    }
    
    // Combinar transações do banco de dados com as do extrato
    const allTransactions = [...dbTransactions, ...extractTransactions];
    
    // Remover possíveis duplicatas
    const uniqueTransactions = removeDuplicates(allTransactions);
    
    // Ordenar por data (mais recente primeiro)
    uniqueTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Converter para o formato esperado
    const transactions = uniqueTransactions.map(mapTransactionData);
    
    // Buscar o saldo total das carteiras
    const wallets = await db.wallet.findMany({
      where: {
        userId: user.id,
      },
      select: {
        balance: true,
      }
    });
    
    const walletsBalance = wallets.reduce((total, wallet) => total + wallet.balance, 0);

    // Construir cabeçalhos da resposta
    const headers = new Headers();
    headers.set('X-Searching-Extract', isSearchingExtract ? 'true' : 'false');

    console.log('[SMART_SEARCH] Enviando resposta:', {
      transactionsCount: transactions.length,
      walletsBalance,
      fromExtract: extractTransactions.length > 0
    });

    return NextResponse.json(
      {
        transactions,
        walletsBalance,
        count: transactions.length,
        fromExtract: extractTransactions.length > 0
      },
      { 
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error('[SMART_SEARCH_ERROR]', error);
    return NextResponse.json({ error: "Erro ao buscar transações" }, { status: 500 });
  }
}

// Função para processar e salvar transações do extrato no banco de dados
async function processAndSaveTransactions(transacoes: any[], wallet: any, userId: string) {
  const bbService = BBIntegrationService.getInstance();
  const savedTransactions = [];
  
  try {
    // Processamos cada transação
    for (const transaction of transacoes) {
      try {
        // Extrair dados da transação
        const dados = extrairDadosTransacao(transaction);
        
        // Determinar se é uma transação de débito
        const isDebit = (bbService as any).isDebit({
          textoDescricaoHistorico: dados.textoDescricaoHistorico,
          indicadorSinalLancamento: dados.indicadorSinalLancamento,
          codigoHistorico: dados.codigoHistorico
        });
        
        // Definir o valor com o sinal correto baseado no tipo de transação
        let amount = dados.valorLancamento || 0;
        if (isDebit) {
          amount = -Math.abs(amount);
        }
        
        // Processar a data
        let transactionDate;
        try {
          const dataStr = dados.dataLancamento.toString();
          const day = dataStr.substring(0, 2);
          const month = dataStr.substring(2, 4);
          const year = dataStr.substring(4);
          transactionDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
        } catch (e) {
          console.error(`[SMART_SEARCH] Erro ao processar data: ${dados.dataLancamento}`, e);
          transactionDate = new Date();
        }
        
        // Construir nome amigável
        const description = dados.textoDescricaoHistorico || '';
        const complementInfo = dados.textoInformacaoComplementar || '';
        let name = description;
        
        if (complementInfo && !name.includes(complementInfo)) {
          name = `${name} - ${complementInfo}`;
        }
        
        // Gerar ID externo
        const dataParaId = dados.dataMovimento > 0 ? dados.dataMovimento : dados.dataLancamento;
        const dataFormatada = dataParaId.toString().padStart(8, '0');
        const descricaoHash = hashString(
          (dados.textoDescricaoHistorico || '') + 
          (dados.textoInformacaoComplementar || '') + 
          (dados.valorLancamento?.toString() || '0')
        );
        
        const externalId = `bb-${wallet.id}-${dataFormatada}-${dados.numeroDocumento || '0'}-${dados.numeroLote || '0'}-${descricaoHash}`;
        
        // Determinar categoria e tipo
        const type = isDebit ? 'EXPENSE' : 'DEPOSIT';
        const category = 'OTHER'; // Simplificado, pode-se implementar lógica de categorização
        
        // Construir objeto de transação
        const newTransaction = {
          name,
          amount,
          date: transactionDate,
          type: type as any, // Forçar tipo para corresponder ao enum TransactionType
          category: category as any, // Forçar tipo para corresponder ao enum TransactionCategory
          paymentMethod: 'OTHER' as any,
          metadata: {
            source: 'banco-do-brasil',
            valorOriginal: dados.valorLancamento,
            dataOriginal: dados.dataLancamento,
            indicadorSinalLancamento: dados.indicadorSinalLancamento,
            descricaoOriginal: dados.textoDescricaoHistorico,
            complementoOriginal: dados.textoInformacaoComplementar,
            codigoHistorico: dados.codigoHistorico,
            numeroDocumento: dados.numeroDocumento,
            numeroLote: dados.numeroLote,
            tipoCategorizado: isDebit ? 'EXPENSE' : 'INCOME',
            isDebit
          },
          externalId,
          userId,
          walletId: wallet.id
        };
        
        // Verificar se já existe
        const existing = await db.transaction.findUnique({
          where: { externalId }
        });
        
        if (!existing) {
          // Salvar no banco de dados
          const saved = await db.transaction.create({
            data: newTransaction
          });
          
          savedTransactions.push(saved);
        }
      } catch (e) {
        console.error('[SMART_SEARCH] Erro ao processar transação individual:', e);
        // Continuar com a próxima transação
      }
    }
  } catch (error) {
    console.error('[SMART_SEARCH] Erro ao processar e salvar transações:', error);
  }
  
  return savedTransactions;
}

// Função auxiliar para extrair dados da transação
function extrairDadosTransacao(item: any): any {
  // Verificar se estamos recebendo a estrutura já mapeada ou a original da API
  if (item.lancamentoContaCorrenteCliente) {
    return {
      dataLancamento: item.dataMovimento || 0,
      dataMovimento: item.dataMovimento || 0,
      indicadorSinalLancamento: item.indicadorSinalLancamento || '',
      indicadorTipoLancamento: item.indicadorTipoLancamento || '',
      textoInformacaoComplementar: '',
      valorLancamento: item.lancamentoContaCorrenteCliente.valorLancamentoRemessa || 0,
      textoDescricaoHistorico: item.lancamentoContaCorrenteCliente.nomeTipoOperacao || '',
      codigoHistorico: item.lancamentoContaCorrenteCliente.codigoHistorico || 0,
      numeroLote: item.lancamentoContaCorrenteCliente.numeroLote || 0,
      numeroDocumento: item.lancamentoContaCorrenteCliente.numeroDocumento || 0,
      numeroCpfCnpjContrapartida: 0,
      indicadorTipoPessoaContrapartida: '',
      codigoBancoContrapartida: 0,
      codigoAgenciaContrapartida: 0,
      numeroContaContrapartida: '',
      textoDvContaContrapartida: ''
    };
  }
  
  // Estrutura original da API
  return {
    dataLancamento: item.dataLancamento || 0,
    dataMovimento: item.dataMovimento || 0,
    indicadorSinalLancamento: item.indicadorSinalLancamento || '',
    indicadorTipoLancamento: item.indicadorTipoLancamento || '',
    textoInformacaoComplementar: item.textoInformacaoComplementar || '',
    valorLancamento: item.valorLancamento || 0,
    textoDescricaoHistorico: item.textoDescricaoHistorico || '',
    codigoHistorico: item.codigoHistorico || 0,
    numeroLote: item.numeroLote || 0,
    numeroDocumento: item.numeroDocumento || 0,
    numeroCpfCnpjContrapartida: item.numeroCpfCnpjContrapartida || 0,
    indicadorTipoPessoaContrapartida: item.indicadorTipoPessoaContrapartida || '',
    codigoBancoContrapartida: item.codigoBancoContrapartida || 0,
    codigoAgenciaContrapartida: item.codigoAgenciaContrapartida || 0,
    numeroContaContrapartida: item.numeroContaContrapartida || '',
    textoDvContaContrapartida: item.textoDvContaContrapartida || ''
  };
}

// Funções auxiliares
function removeDuplicates(transactions: any[]): any[] {
  const uniqueIds = new Set();
  return transactions.filter(tx => {
    // Se não há ID externo, manter a transação
    if (!tx.externalId) return true;
    
    // Se o ID já foi visto, remover (é duplicata)
    if (uniqueIds.has(tx.externalId)) return false;
    
    // Caso contrário, adicionar o ID ao conjunto e manter a transação
    uniqueIds.add(tx.externalId);
    return true;
  });
}

function mapTransactionData(transaction: any) {
  // Copiar metadata com segurança
  let metadata = transaction.metadata || {};
  
  // Extrair categoria mapeada se existir
  let category = transaction.category || "OTHER";
  if (transaction.categoryObj && transaction.categoryObj.name) {
    category = transaction.categoryObj.name;
  }
  
  // Extrair método de pagamento do metadata
  let paymentMethod = "OTHER";
  if (metadata && typeof metadata === 'object' && 'paymentMethod' in metadata) {
    paymentMethod = metadata.paymentMethod;
  }
  
  return {
    id: transaction.id,
    name: transaction.name,
    amount: transaction.amount,
    date: transaction.date,
    type: transaction.type,
    category: category,
    paymentMethod,
    metadata,
    wallet: transaction.wallet
  };
}

// Função para verificar se uma transação deve ser ocultada (é um registro de saldo)
function shouldHideTransaction(description: string): boolean {
  if (!description) return false;
  
  const saldoPatterns = [
    'SALDO ', 'Saldo ', 'saldo ',
    'S A L D O', 'SALDO DO DIA', 'SALDO ANTERIOR',
    'SALDO ATUAL', 'SALDO DISPONÍVEL'
  ];
  
  return saldoPatterns.some(pattern => description.includes(pattern));
}

function hashString(str: string): string {
  // Implementação simples de hash para strings
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converter para 32bit integer
  }
  
  return Math.abs(hash).toString().padStart(8, '0');
}

// Configuração de rota dinâmica já declarada no topo do arquivo
