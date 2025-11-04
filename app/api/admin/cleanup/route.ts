import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/app/_utils/auth";
import { PrismaClient } from "@prisma/client";
import { hasRole } from "@/app/_services/permissions";
import { SystemRoles } from "@/app/_types/rbac";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


const prisma = new PrismaClient();

/**
 * Verifica se o usuário é um administrador usando RBAC
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    return await hasRole(userId, SystemRoles.ADMIN);
  } catch (error) {
    console.error('Erro ao verificar role de admin:', error);
    return false;
  }
}

/**
 * Função para extrair o externalId do metadata
 */
function getExternalId(tx: any): string | null {
  try {
    if (!tx.metadata) return null;
    
    // Verificar os possíveis caminhos para o ID
    const metadata = tx.metadata;
    const sourceExternalId = metadata.source?.externalId;
    
    if (sourceExternalId) {
      return sourceExternalId.toString();
    }
    
    const originalId = metadata.original?.id;
    if (originalId) {
      return originalId.toString();
    }
    
    const sourceDataId = metadata.source?.data?.id;
    if (sourceDataId) {
      return sourceDataId.toString();
    }
    
    return null;
  } catch (e) {
    console.error("Erro ao extrair externalId:", e);
    return null;
  }
}

/**
 * Função para remover carteiras duplicadas
 */
async function cleanupDuplicateWallets(userId: string, dryRun = false): Promise<{
  removidas: number;
  preservadas: number;
  detalhes: any[];
}> {
  console.log('🧹 Iniciando limpeza de carteiras duplicadas...');
  
  // Resultado da operação
  const result = {
    removidas: 0,
    preservadas: 0,
    detalhes: [] as any[]
  };
  
  // 1. Buscar todas as carteiras do tipo GESTAO_CLICK
  const wallets = await prisma.wallet.findMany({
    where: {
      userId,
      type: "GESTAO_CLICK",
    },
    orderBy: {
      createdAt: 'asc' // As mais antigas primeiro (vamos preservar as mais recentes)
    },
    include: {
      _count: {
        select: {
          transactions: true,
        }
      }
    }
  });
  
  console.log(`Encontradas ${wallets.length} carteiras do tipo GESTAO_CLICK`);
  
  if (wallets.length <= 1) {
    console.log("Nenhuma duplicata detectada para carteiras.");
    return result;
  }
  
  // 2. Agrupar por nome para identificar duplicatas
  const walletsByName = new Map<string, typeof wallets>();
  
  for (const wallet of wallets) {
    const name = wallet.name.trim().toLowerCase();
    if (!walletsByName.has(name)) {
      walletsByName.set(name, []);
    }
    walletsByName.get(name)!.push(wallet);
  }
  
  // 3. Processar cada grupo de carteiras com o mesmo nome
  for (const [name, duplicates] of walletsByName.entries()) {
    if (duplicates.length <= 1) {
      result.preservadas++;
      continue; // Não é duplicata
    }
    
    console.log(`Encontradas ${duplicates.length} carteiras com o nome: ${name}`);
    
    // Ordenar por quantidade de transações (decrescente) e então por data (mais recente primeiro)
    duplicates.sort((a, b) => {
      // Primeiro critério: mais transações
      if (b._count.transactions !== a._count.transactions) {
        return b._count.transactions - a._count.transactions;
      }
      // Segundo critério: mais recente
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // A primeira carteira será preservada
    const keepWallet = duplicates[0];
    result.preservadas++;
    
    console.log(`✅ Preservando carteira: ${keepWallet.id} (${keepWallet.name}) - ${keepWallet._count.transactions} transações`);
    
    // Todas as outras serão removidas
    const removeWallets = duplicates.slice(1);
    
    for (const wallet of removeWallets) {
      try {
        console.log(`🗑️ Removendo carteira duplicada: ${wallet.id} (${wallet.name}) - ${wallet._count.transactions} transações`);
        
        if (!dryRun) {
          // Buscar todas as transações desta carteira
          const transactions = await prisma.transaction.findMany({
            where: { walletId: wallet.id },
            select: { id: true }
          });
          
          console.log(`Transferindo ${transactions.length} transações para a carteira principal: ${keepWallet.id}`);
          
          // Transferir transações para a carteira que será mantida
          await prisma.transaction.updateMany({
            where: { walletId: wallet.id },
            data: { walletId: keepWallet.id }
          });
          
          // Remover a carteira duplicada
          await prisma.wallet.delete({
            where: { id: wallet.id }
          });
        }
        
        result.removidas++;
        result.detalhes.push({
          acao: "removida",
          id: wallet.id,
          nome: wallet.name,
          transacoes: wallet._count.transactions,
          destinoId: keepWallet.id,
          destinoNome: keepWallet.name
        });
        
        console.log(`${dryRun ? '[SIMULAÇÃO]' : ''} Carteira processada com sucesso: ${wallet.id}`);
      } catch (error) {
        console.error(`❌ Erro ao remover carteira duplicada ${wallet.id}:`, error);
        result.detalhes.push({
          acao: "erro",
          id: wallet.id,
          nome: wallet.name,
          erro: String(error)
        });
      }
    }
  }
  
  return result;
}

/**
 * Função para remover transações duplicadas
 */
async function cleanupDuplicateTransactions(userId: string, dryRun = false): Promise<{
  removidas: number;
  preservadas: number;
  detalhes: any[];
}> {
  console.log('🧹 Iniciando limpeza de transações duplicadas...');
  
  // Resultado da operação
  const result = {
    removidas: 0,
    preservadas: 0,
    detalhes: [] as any[]
  };

  // 1. Buscar todas as transações com source.name = GESTAO_CLICK
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      metadata: {
        path: ['source', 'name'],
        equals: 'GESTAO_CLICK'
      }
    },
    orderBy: {
      createdAt: 'asc' // As mais antigas primeiro
    }
  });
  
  console.log(`Encontradas ${transactions.length} transações do Gestão Click`);
  
  if (transactions.length === 0) {
    return result;
  }
  
  // 2. Agrupar transações pelo externalId
  const transactionsByExternalId = new Map<string, any[]>();
  
  for (const tx of transactions) {
    const externalId = getExternalId(tx);
    if (!externalId) {
      result.preservadas++;
      continue; // Não tem ID externo, não podemos determinar se é duplicata
    }
    
    if (!transactionsByExternalId.has(externalId)) {
      transactionsByExternalId.set(externalId, []);
    }
    
    transactionsByExternalId.get(externalId)!.push(tx);
  }
  
  console.log(`${transactionsByExternalId.size} grupos de transações encontrados por ID externo`);
  
  // 3. Processar cada grupo de transações com o mesmo externalId
  let groupsProcessed = 0;
  for (const [externalId, duplicates] of transactionsByExternalId.entries()) {
    if (duplicates.length <= 1) {
      result.preservadas += duplicates.length;
      continue; // Não é duplicata
    }
    
    groupsProcessed++;
    if (groupsProcessed % 100 === 0) {
      console.log(`Processando grupo ${groupsProcessed}/${transactionsByExternalId.size}...`);
    }
    
    // Ordenar por data de criação (a mais recente primeiro)
    duplicates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // A primeira transação será preservada (a mais recente)
    const keepTransaction = duplicates[0];
    result.preservadas++;
    
    // Todas as outras serão removidas
    const removeTransactions = duplicates.slice(1);
    
    // Remover as transações duplicadas
    for (const tx of removeTransactions) {
      try {
        if (!dryRun) {
          await prisma.transaction.delete({
            where: { id: tx.id }
          });
        }
        
        result.removidas++;
        result.detalhes.push({
          acao: "removida",
          id: tx.id,
          nome: tx.name,
          valor: tx.amount,
          data: tx.date,
          externalId: externalId,
          preservadaId: keepTransaction.id
        });
      } catch (error) {
        console.error(`❌ Erro ao remover transação duplicada ${tx.id}:`, error);
        result.detalhes.push({
          acao: "erro",
          id: tx.id,
          nome: tx.name,
          erro: String(error)
        });
      }
    }
  }
  
  // 4. Procurar por duplicatas sem externalId (mesmo valor, data e descrição no mesmo wallet)
  console.log('🔍 Buscando por duplicatas sem ID externo...');
  
  // Agrupar transações por 'fingerprint': walletId + date + amount + name
  const transactionsByFingerprint = new Map<string, any[]>();
  
  // Considerar apenas transações sem externalId ou aquelas que já foram processadas
  const processedExternalIds = new Set(transactionsByExternalId.keys());
  
  const transactionsWithoutExternalId = transactions.filter(tx => {
    const externalId = getExternalId(tx);
    return !externalId || !processedExternalIds.has(externalId);
  });
  
  console.log(`Analisando ${transactionsWithoutExternalId.length} transações sem ID externo...`);
  
  for (const tx of transactionsWithoutExternalId) {
    // Criar uma impressão digital única da transação
    const date = new Date(tx.date).toISOString().split('T')[0]; // YYYY-MM-DD
    const fingerprint = `${tx.walletId}|${date}|${tx.amount}|${tx.name}`;
    
    if (!transactionsByFingerprint.has(fingerprint)) {
      transactionsByFingerprint.set(fingerprint, []);
    }
    
    transactionsByFingerprint.get(fingerprint)!.push(tx);
  }
  
  console.log(`${transactionsByFingerprint.size} grupos de transações encontrados por fingerprint`);
  
  // Processar cada grupo de transações com a mesma impressão digital
  groupsProcessed = 0;
  for (const [fingerprint, duplicates] of transactionsByFingerprint.entries()) {
    if (duplicates.length <= 1) {
      result.preservadas += duplicates.length;
      continue; // Não é duplicata
    }
    
    groupsProcessed++;
    if (groupsProcessed % 100 === 0) {
      console.log(`Processando grupo por fingerprint ${groupsProcessed}/${transactionsByFingerprint.size}...`);
    }
    
    // Ordenar por data de criação (a mais recente primeiro)
    duplicates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // A primeira transação será preservada (a mais recente)
    const keepTransaction = duplicates[0];
    result.preservadas++;
    
    // Todas as outras serão removidas
    const removeTransactions = duplicates.slice(1);
    
    // Remover as transações duplicadas
    for (const tx of removeTransactions) {
      try {
        if (!dryRun) {
          await prisma.transaction.delete({
            where: { id: tx.id }
          });
        }
        
        result.removidas++;
        result.detalhes.push({
          acao: "removida_fingerprint",
          id: tx.id,
          nome: tx.name,
          valor: tx.amount,
          data: tx.date,
          fingerprint: fingerprint,
          preservadaId: keepTransaction.id
        });
      } catch (error) {
        console.error(`❌ Erro ao remover transação duplicada por fingerprint ${tx.id}:`, error);
        result.detalhes.push({
          acao: "erro_fingerprint",
          id: tx.id,
          nome: tx.name,
          erro: String(error)
        });
      }
    }
  }
  
  return result;
}

/**
 * Rota POST para realizar a sanitização
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    
    // Verificar se o usuário é um administrador
    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
    }
    
    // Obter parâmetros
    const body = await request.json();
    const targetUserId = body.userId || session.user.id;
    const dryRun = body.dryRun === true;
    
    // Verificar se o usuário alvo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true }
    });
    
    if (!targetUser) {
      return NextResponse.json({ error: "Usuário alvo não encontrado" }, { status: 404 });
    }
    
    // Executar sanitização
    const walletsResult = await cleanupDuplicateWallets(targetUserId, dryRun);
    const transactionsResult = await cleanupDuplicateTransactions(targetUserId, dryRun);
    
    // Criar notificação para o administrador
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: `Sanitização de dados ${dryRun ? "(Simulação)" : ""}`,
        message: `Sanitização executada para o usuário ${targetUser.email}. ${walletsResult.removidas} carteiras e ${transactionsResult.removidas} transações removidas.`,
        type: "SYSTEM",
        priority: "MEDIUM",
        isRead: false
      }
    });
    
    // Retornar resultados
    return NextResponse.json({
      success: true,
      modo: dryRun ? "simulação" : "produção",
      usuarioAlvo: {
        id: targetUser.id,
        email: targetUser.email
      },
      resultados: {
        carteiras: {
          removidas: walletsResult.removidas,
          preservadas: walletsResult.preservadas,
          detalhes: walletsResult.detalhes.slice(0, 50) // Limitar para os primeiros 50 para evitar resposta muito grande
        },
        transacoes: {
          removidas: transactionsResult.removidas,
          preservadas: transactionsResult.preservadas,
          detalhes: transactionsResult.detalhes.slice(0, 50) // Limitar para os primeiros 50
        }
      }
    });
    
  } catch (error) {
    console.error("Erro na sanitização:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * Rota GET para analisar duplicatas sem removê-las
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    
    // Verificar se o usuário é um administrador
    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
    }
    
    // Obter parâmetros da URL
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get("userId") || session.user.id;
    
    // Verificar se o usuário alvo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true }
    });
    
    if (!targetUser) {
      return NextResponse.json({ error: "Usuário alvo não encontrado" }, { status: 404 });
    }
    
    // Executar análise (modo simulação)
    const walletsResult = await cleanupDuplicateWallets(targetUserId, true);
    const transactionsResult = await cleanupDuplicateTransactions(targetUserId, true);
    
    // Retornar resultados
    return NextResponse.json({
      success: true,
      modo: "análise",
      usuarioAlvo: {
        id: targetUser.id,
        email: targetUser.email
      },
      resultados: {
        carteiras: {
          duplicatas: walletsResult.removidas,
          unicas: walletsResult.preservadas,
          detalhes: walletsResult.detalhes
        },
        transacoes: {
          duplicatas: transactionsResult.removidas,
          unicas: transactionsResult.preservadas,
          detalhes: transactionsResult.detalhes.slice(0, 50) // Limitar para os primeiros 50
        }
      }
    });
    
  } catch (error) {
    console.error("Erro na análise:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 
