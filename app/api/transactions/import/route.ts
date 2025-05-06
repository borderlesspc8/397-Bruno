import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { 
  TransactionCategory, 
  TransactionType, 
  TransactionPaymentMethod 
} from "@/app/_types/transaction";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";

// Definir interface para erros de importação
interface ImportError {
  tx: any;
  error: string;
}

// Chave secreta para autenticação de serviços internos
const API_SECRET_KEY = process.env.API_SECRET_KEY || 'contarapida_internal_api_key';

// Função auxiliar para converter string para um valor de TransactionCategory válido
function ensureValidCategory(category: any): TransactionCategory {
  if (!category) return TransactionCategory.OTHER;
  
  // Se a categoria já for um valor do enum válido, retorne-a
  if (TransactionCategory && Object.values(TransactionCategory).includes(category as TransactionCategory)) {
    return category as TransactionCategory;
  }
  
  // Tentar fazer correspondência com valores do enum
  const upperCaseCategory = String(category).toUpperCase();
  
  // Procurar por correspondência direta
  const directMatch = TransactionCategory && Object.values(TransactionCategory).find(
    enumValue => enumValue === upperCaseCategory
  );
  
  if (directMatch) return directMatch;
  
  // Caso contrário, use o valor padrão
  return TransactionCategory.OTHER;
}

/**
 * Endpoint para importação de transações
 * Esta rota recebe transações de diferentes fontes (incluindo Gestão Click)
 * e as importa para a carteira especificada
 */
export async function POST(request: NextRequest) {
  try {
    let isAuthenticated = false;
    let userId: string | null = null;
    
    // Verificar autenticação usando a função helper do aplicativo
    const session = await getAuthSession();
    if (session?.user) {
      isAuthenticated = true;
      userId = session.user.id;
    } else {
      // Verificar autenticação alternativa via API key para serviços internos
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // Verificar se o token de API é válido
        if (token === API_SECRET_KEY) {
          isAuthenticated = true;
          
          // Extrair userId do corpo da requisição para chamadas de serviço
          const body = await request.json();
          userId = body.userId;
          
          if (!userId) {
            return NextResponse.json(
              { error: "ID do usuário não fornecido na requisição do serviço" },
              { status: 400 }
            );
          }
          
          // Clone da requisição para poder reutilizar o corpo JSON
          request = new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(body),
          });
        }
      }
    }
    
    if (!isAuthenticated || !userId) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter dados do corpo da requisição
    const data = await request.json();
    const { walletId, transactions, source } = data;

    if (!walletId) {
      return NextResponse.json(
        { error: "ID da carteira não fornecido" },
        { status: 400 }
      );
    }

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: "Lista de transações vazia ou inválida" },
        { status: 400 }
      );
    }

    // Verificar se a carteira existe e pertence ao usuário
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId: userId,
      },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Carteira não encontrada" },
        { status: 404 }
      );
    }

    // Verificar transações existentes para evitar duplicatas
    // Se a fonte for GESTAO_CLICK, verificamos pelo externalId na metadata
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        walletId,
        metadata: source === 'GESTAO_CLICK' ? {
          path: ['source', 'name'],
          equals: 'GESTAO_CLICK'
        } : undefined
      },
      select: {
        metadata: true
      }
    });

    // Criar um conjunto de IDs externos já existentes
    const existingExternalIds = new Set();
    
    if (source === 'GESTAO_CLICK') {
      existingTransactions.forEach(tx => {
        try {
          // @ts-ignore Acessando propriedades dinâmicas do JSON
          if (tx.metadata?.source?.externalId) {
            // @ts-ignore Acessando propriedades dinâmicas do JSON
            existingExternalIds.add(tx.metadata.source.externalId.toString());
          }
        } catch (err) {
          console.warn("Erro ao processar metadados:", err);
        }
      });
    }

    console.log(`[IMPORT] ${existingExternalIds.size} transações já existentes na carteira ${walletId} da fonte ${source || 'desconhecida'}`);

    // Filtrar apenas transações novas
    const newTransactions = transactions.filter(tx => {
      if (source === 'GESTAO_CLICK' && tx.source?.externalId) {
        return !existingExternalIds.has(tx.source.externalId.toString());
      }
      return true; // Se não for GESTAO_CLICK ou não tiver ID externo, importar
    });

    console.log(`[IMPORT] ${newTransactions.length} novas transações para importar (${transactions.length - newTransactions.length} ignoradas)`);

    // Criar transações em lote
    let importedCount = 0;
    let errors: ImportError[] = [];
    
    // Preparar dados para criação em lote
    const transactionsToCreate = newTransactions.map(tx => {
      try {
        // Validar data
        let validDate: Date;
        if (!tx.date) {
          validDate = new Date();
        } else if (typeof tx.date === 'string') {
          validDate = new Date(tx.date);
          if (isNaN(validDate.getTime())) {
            validDate = new Date();
          }
        } else {
          validDate = new Date(tx.date);
        }
        
        // Validar tipo de transação
        let transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'INVESTMENT';
        if (tx.type === 'DESPESA' || tx.type === 'EXPENSE' || tx.amount < 0) {
          transactionType = 'EXPENSE';
        } else if (tx.type === 'RECEITA' || tx.type === 'INCOME' || tx.amount > 0) {
          transactionType = 'INCOME';
        } else if (tx.type === 'TRANSFER') {
          transactionType = 'TRANSFER';
        } else if (tx.type === 'INVESTMENT') {
          transactionType = 'INVESTMENT';
        } else {
          transactionType = tx.amount < 0 ? 'EXPENSE' : 'INCOME';
        }
        
        // Converter e validar a categoria para garantir que seja um valor válido do enum
        const validCategory = ensureValidCategory(tx.category);
        
        // Converter e validar o método de pagamento
        let validPaymentMethod: TransactionPaymentMethod = TransactionPaymentMethod.OTHER;
        if (tx.paymentMethod && TransactionPaymentMethod && Object.values(TransactionPaymentMethod).includes(tx.paymentMethod as TransactionPaymentMethod)) {
          validPaymentMethod = tx.paymentMethod as TransactionPaymentMethod;
        }
        
        return {
          name: tx.description || tx.name || 'Transação importada',
          amount: Math.abs(tx.amount),
          date: validDate,
          type: transactionType,
          category: validCategory,
          paymentMethod: validPaymentMethod,
          walletId,
          userId: userId,
          metadata: {
            source: source || 'import',
            ...tx.source
          }
        };
      } catch (error) {
        errors.push({
          tx,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        return null;
      }
    }).filter(Boolean);
    
    // Criar as transações
    if (transactionsToCreate.length > 0) {
      const result = await prisma.transaction.createMany({
        data: transactionsToCreate as any[],
        skipDuplicates: true
      });
      
      importedCount = result.count;
      console.log(`[IMPORT] ${importedCount} transações importadas com sucesso`);
    }
    
    // Calcular alteração no saldo
    const balanceChange = newTransactions.reduce((sum, tx) => {
      const amount = Math.abs(tx.amount);
      if (tx.type === 'DESPESA' || tx.type === 'EXPENSE' || tx.amount < 0) {
        return sum - amount;
      } else {
        return sum + amount;
      }
    }, 0);
    
    // Atualizar saldo da carteira
    let newBalance = wallet.balance;
    if (balanceChange !== 0) {
      const updatedWallet = await prisma.wallet.update({
        where: { id: walletId },
        data: {
          balance: {
            increment: balanceChange
          }
        }
      });
      
      newBalance = updatedWallet.balance;
    }
    
    // Retornar sucesso com as estatísticas
    const response = {
      count: importedCount,
      skipped: transactions.length - importedCount,
      errors: errors.length > 0 ? errors : undefined,
      balanceChange: balanceChange
    };
    
    // Se importamos transações com sucesso, acionar a conciliação automática de parcelas
    if (importedCount > 0) {
      try {
        // Definir período com base nas datas das transações importadas
        const dates = transactionsToCreate
          .map((tx: any) => tx.date instanceof Date ? tx.date : new Date(tx.date))
          .filter((date: Date) => !isNaN(date.getTime()));
        
        // Definir período para a conciliação automática
        let startDate = new Date();
        let endDate = new Date();
        
        if (dates.length > 0) {
          // Encontrar a data mais antiga e mais recente nas transações importadas
          startDate = new Date(Math.min(...dates.map(d => d.getTime())));
          endDate = new Date(Math.max(...dates.map(d => d.getTime())));
          
          // Expandir o período 15 dias para trás e para frente
          startDate.setDate(startDate.getDate() - 15);
          endDate.setDate(endDate.getDate() + 15);
        } else {
          // Usar um período padrão se não houver datas válidas
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          endDate = new Date();
        }
        
        // Construir URL absoluta para a API
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
        const apiUrl = `${baseUrl}/api/reconciliation/ml/auto`;
        
        // Obter a chave de API para autenticação entre serviços
        const apiKey = process.env.API_SECRET_KEY || 'contarapida_internal_api_key';
        
        // Chamar API de conciliação automática de parcelas
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            userId,
            walletId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          })
        }).then(res => {
          if (!res.ok) {
            console.error(`[IMPORT] Erro ao acionar conciliação automática: ${res.status}`);
          } else {
            console.log('[IMPORT] Conciliação automática acionada com sucesso');
          }
        }).catch(err => {
          console.error('[IMPORT] Erro ao acionar conciliação automática:', err);
        });
      } catch (error) {
        console.error('[IMPORT] Erro ao preparar conciliação automática:', error);
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao importar transações:", error);
    
    return NextResponse.json(
      { error: "Erro ao processar a importação", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
