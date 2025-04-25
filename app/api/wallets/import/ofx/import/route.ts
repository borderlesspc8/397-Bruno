import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/app/_lib/prisma";
import { TransactionCategory, TransactionType } from "@prisma/client";

interface OfxTransactionImport {
  id: string;
  date: string | Date;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  reference?: string;
  bank?: string;
}

/**
 * Registra transações importadas de um arquivo OFX
 */
export async function POST(request: NextRequest) {
  console.log(`[OFX_IMPORT] Iniciando processo de importação de transações OFX`);
  
  try {
    // Verificar autenticação
    const session = await getServerSession();
    if (!session?.user) {
      console.warn(`[OFX_IMPORT] Tentativa de acesso não autorizado`);
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter dados do corpo da requisição
    console.log(`[OFX_IMPORT] Processando dados da requisição...`);
    const data = await request.json();
    const { walletId, transactions, fileIdentifier, bankName } = data;
    
    console.log(`[OFX_IMPORT] Dados recebidos: 
      - Carteira: ${walletId}
      - Transações: ${transactions?.length || 0}
      - Banco: ${bankName || 'Não informado'}`);

    if (!walletId) {
      console.warn(`[OFX_IMPORT] Tentativa de importação sem ID da carteira`);
      return NextResponse.json(
        { error: "ID da carteira não fornecido" },
        { status: 400 }
      );
    }

    if (!Array.isArray(transactions) || transactions.length === 0) {
      console.warn(`[OFX_IMPORT] Lista de transações vazia ou inválida`);
      return NextResponse.json(
        { error: "Lista de transações vazia ou inválida" },
        { status: 400 }
      );
    }
    
    // Verificar se este arquivo já foi importado
    if (fileIdentifier) {
      console.log(`[OFX_IMPORT] Verificando se o arquivo já foi importado anteriormente...`);
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
        console.warn(`[OFX_IMPORT] Arquivo com identificador ${fileIdentifier} já foi importado anteriormente`);
        return NextResponse.json(
          { error: "Este extrato já foi importado anteriormente" },
          { status: 400 }
        );
      }
    }

    // Verificar se a carteira existe e pertence ao usuário
    console.log(`[OFX_IMPORT] Verificando carteira ${walletId}...`);
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId: session.user.id,
      },
    });

    if (!wallet) {
      console.warn(`[OFX_IMPORT] Carteira ${walletId} não encontrada ou não pertence ao usuário ${session.user.id}`);
      return NextResponse.json(
        { error: "Carteira não encontrada" },
        { status: 404 }
      );
    }
    
    console.log(`[OFX_IMPORT] Carteira encontrada: ${wallet.name} (Saldo atual: ${wallet.balance})`);

    // Verificar IDs de transações existentes para evitar duplicatas
    console.log(`[OFX_IMPORT] Verificando transações existentes para evitar duplicatas...`);
    const existingTransactionIds = new Set(
      (await prisma.transaction.findMany({
        where: {
          walletId,
          externalId: {
            in: transactions.map(t => t.id)
          }
        },
        select: {
          externalId: true
        }
      })).map(t => t.externalId).filter(Boolean)
    );
    
    console.log(`[OFX_IMPORT] Encontradas ${existingTransactionIds.size} transações já importadas anteriormente`);
    
    // Filtrar transações já existentes
    const newTransactions = transactions.filter(
      transaction => !existingTransactionIds.has(transaction.id)
    );
    
    console.log(`[OFX_IMPORT] ${newTransactions.length} novas transações para importar (${transactions.length - newTransactions.length} ignoradas por já existirem)`);
    
    // Analisar intervalos de tempo das transações
    if (newTransactions.length > 0) {
      let dataMinima = new Date(newTransactions[0].date);
      let dataMaxima = new Date(newTransactions[0].date);
      
      for (const tx of newTransactions) {
        const data = new Date(tx.date);
        if (data < dataMinima) dataMinima = data;
        if (data > dataMaxima) dataMaxima = data;
      }
      
      console.log(`[OFX_IMPORT] Período das transações a serem importadas: ${dataMinima.toISOString().split('T')[0]} a ${dataMaxima.toISOString().split('T')[0]}`);
    }
    
    // Criar transações uma a uma
    let importedCount = 0;
    let errors = [];
    let importedDeposits = 0;
    let importedExpenses = 0;
    let totalImportedAmount = 0;
    
    console.log(`[OFX_IMPORT] Iniciando importação de ${newTransactions.length} transações...`);
    
    for (const transaction of newTransactions) {
      try {
        // Converter data se for string
        const transactionDate = typeof transaction.date === 'string' 
          ? new Date(transaction.date) 
          : transaction.date;
        
        // Verificar se a data é válida, caso contrário usar a data atual
        const validDate = !isNaN(transactionDate.getTime()) 
          ? transactionDate 
          : new Date();
        
        // Mapear tipo para ENUM do Prisma
        const transactionType = transaction.type === 'EXPENSE' 
          ? TransactionType.EXPENSE 
          : TransactionType.INCOME;
        
        // Atualizar contadores
        if (transactionType === TransactionType.INCOME) {
          importedDeposits++;
          totalImportedAmount += Math.abs(transaction.amount);
        } else {
          importedExpenses++;
          totalImportedAmount -= Math.abs(transaction.amount);
        }
        
        // Criar transação no banco de dados
        console.log(`[OFX_IMPORT] Importando transação ${importedCount+1}/${newTransactions.length}: ${transaction.description.substring(0, 30)}... ${transaction.amount} (${transaction.date})`);
        
        await prisma.transaction.create({
          data: {
            name: transaction.description.trim().substring(0, 100),
            amount: Math.abs(transaction.amount),
            date: validDate,
            type: transactionType,
            category: "OTHER",
            paymentMethod: "OTHER",
            walletId: walletId,
            userId: wallet.userId,
            externalId: transaction.id,
            metadata: { 
              source: "ofx_import",
              reference: transaction.reference || null,
              ofxFileIdentifier: fileIdentifier || null,
              bankName: transaction.bank || null,
              importDate: new Date().toISOString()
            }
          }
        });
        
        importedCount++;
      } catch (err) {
        console.error(`[OFX_IMPORT] Erro ao importar transação ${transaction.id}:`, err);
        errors.push({
          id: transaction.id,
          description: transaction.description,
          error: err instanceof Error ? err.message : 'Erro desconhecido'
        });
      }
    }
    
    if (errors.length > 0) {
      console.warn(`[OFX_IMPORT] ${errors.length} transações não puderam ser importadas devido a erros`);
      errors.forEach((err, i) => {
        console.warn(`[OFX_IMPORT] Erro ${i+1}: ${err.id} - ${err.description} - ${err.error}`);
      });
    }
    
    // Estatísticas finais da importação
    console.log(`[OFX_IMPORT] Importação concluída:
      - Total importado: ${importedCount}/${newTransactions.length} transações
      - Receitas: ${importedDeposits}
      - Despesas: ${importedExpenses}
      - Impacto no saldo: ${totalImportedAmount.toFixed(2)}
      - Erros: ${errors.length}`);
    
    // Atualizar saldo da carteira
    const income = newTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expenses = newTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const balanceChange = income - expenses;
    
    let newBalance = wallet.balance;
    
    if (balanceChange !== 0) {
      console.log(`[OFX_IMPORT] Atualizando saldo da carteira: ${wallet.balance} -> ${wallet.balance + balanceChange}`);
      
      const updatedWallet = await prisma.wallet.update({
        where: {
          id: walletId
        },
        data: {
          balance: {
            increment: balanceChange
          }
        }
      });
      
      newBalance = updatedWallet.balance;
      console.log(`[OFX_IMPORT] Saldo da carteira atualizado para: ${newBalance}`);
    } else {
      console.log(`[OFX_IMPORT] Sem alteração no saldo da carteira`);
    }
    
    // Responder com sucesso
    console.log(`[OFX_IMPORT] Processo de importação finalizado com sucesso`);
    
    return NextResponse.json({
      success: true,
      imported: importedCount,
      skipped: transactions.length - importedCount,
      balance: newBalance,
      failedCount: errors.length,
      stats: {
        deposits: importedDeposits,
        expenses: importedExpenses,
        totalAmount: totalImportedAmount,
        startDate: newTransactions.length > 0 ? new Date(Math.min(...newTransactions.map(t => new Date(t.date).getTime()))).toISOString() : null,
        endDate: newTransactions.length > 0 ? new Date(Math.max(...newTransactions.map(t => new Date(t.date).getTime()))).toISOString() : null
      },
      wallet: await prisma.wallet.findUnique({
        where: { id: walletId },
        include: {
          transactions: {
            orderBy: { date: 'desc' },
            take: 10 // Retornar as 10 transações mais recentes
          }
        }
      })
    });
  } catch (error) {
    console.error(`[OFX_IMPORT] Erro fatal durante importação:`, error);
    
    return NextResponse.json(
      { error: "Erro ao processar a importação" },
      { status: 500 }
    );
  }
} 