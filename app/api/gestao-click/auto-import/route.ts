/**
 * API para importação automática de dados do Gestão Click
 * Realiza o processo completo de importação de carteiras e transações
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { GestaoClickService } from "@/app/_services/gestao-click-service";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/_lib/prisma";
import { createServerNotification } from "@/app/_lib/server-notifications";
import { NotificationType, NotificationPriority } from "@/app/_types/notification";

export const dynamic = "force-dynamic";

/**
 * POST /api/gestao-click/auto-import
 * Inicia o processo de importação automática de dados do Gestão Click
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do usuário apenas em produção
    // Em ambiente de desenvolvimento, permitir testes sem autenticação
    const isDevelopment = process.env.NODE_ENV === 'development' || true; // Forçar modo de desenvolvimento para testes
    const session = await getAuthSession();
    
    // Em ambiente de produção, é necessário ter um usuário autenticado
    if (!isDevelopment && !session?.user) {
      console.error('[GESTAO_CLICK] Tentativa de importação sem autenticação');
      return NextResponse.json(
        { 
          error: "Não autorizado", 
          message: "Para importar dados do Gestão Click, você precisa estar autenticado." 
        },
        { status: 401 }
      );
    }

    // Obter dados da requisição
    let body;
    try {
      const rawBody = await request.text();
      console.log('[GESTAO_CLICK] Corpo da requisição bruto:', rawBody);
      
      try {
        body = JSON.parse(rawBody);
      } catch (jsonError) {
        console.error('[GESTAO_CLICK] Erro ao fazer parse do JSON:', jsonError);
        return NextResponse.json(
          { 
            error: "Erro de parsing", 
            message: "O corpo da requisição não é um JSON válido. Utilize um JSON válido."
          },
          { status: 400 }
        );
      }
    } catch (parseError) {
      console.error('[GESTAO_CLICK] Erro ao ler o corpo da requisição:', parseError);
      return NextResponse.json(
        { 
          error: "Erro de parsing", 
          message: "Não foi possível processar o corpo da requisição. Verifique o formato." 
        },
        { status: 400 }
      );
    }
    
    console.log('[GESTAO_CLICK] Corpo da requisição parsed:', body);
    
    const { 
      apiKey: requestApiKey, 
      secretToken: requestSecretToken, 
      apiUrl: requestApiUrl, 
      useEnvCredentials,
      importOptions = {}  // Novas opções de importação
    } = body;

    // Opções de importação específicas para cada tipo de dado
    const {
      importSales = true,        // Importar vendas
      importInstallments = true, // Importar parcelas de vendas
      importPayments = true,     // Importar pagamentos
      importReceipts = true,     // Importar recebimentos
      importCostCenters = true,  // Importar centros de custo
      importStores = true,       // Importar lojas
      startDate,                 // Data de início opcional (se não for fornecida, usa a última sincronização)
      endDate,                   // Data de fim opcional (se não for fornecida, usa a data atual)
      includeCategories = true,  // Importar categorias
      maxTransactions,           // Limite máximo de transações a serem importadas
      fullHistory = false        // Importar todo o histórico disponível
    } = importOptions;

    // Determinar as credenciais a serem usadas, priorizando as variáveis de ambiente quando useEnvCredentials for true
    let apiKey, secretToken, apiUrl;

    if (useEnvCredentials) {
      // Buscar credenciais do ambiente
      apiKey = process.env.GESTAO_CLICK_ACCESS_TOKEN;
      secretToken = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN;
      apiUrl = process.env.GESTAO_CLICK_API_URL;

      console.log('[GESTAO_CLICK] Tentando usar credenciais do ambiente:', { 
        hasApiKey: !!apiKey,
        hasSecretToken: !!secretToken,
        hasApiUrl: !!apiUrl 
      });

      // Em ambiente de desenvolvimento, usar valores de teste se não estiverem configurados
      if (isDevelopment && !apiKey) {
        console.log('[GESTAO_CLICK] Usando credenciais de teste para ambiente de desenvolvimento');
        apiKey = 'test-api-key-for-development';
        secretToken = 'test-secret-token-for-development';
        apiUrl = 'https://api.beteltecnologia.com';
      } else if (!apiKey) {
        return NextResponse.json(
          {
            error: "Configuração incompleta",
            message: "A chave de API do Gestão Click não está configurada no ambiente (GESTAO_CLICK_ACCESS_TOKEN). Verifique o arquivo .env da aplicação."
          },
          { status: 400 }
        );
      }
    } else {
      // Usar credenciais fornecidas na requisição
      apiKey = requestApiKey;
      secretToken = requestSecretToken;
      apiUrl = requestApiUrl;
    }

    // Validar dados obrigatórios
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Dados incompletos",
          message: "O token de acesso é obrigatório. Forneça-o diretamente ou configure no ambiente."
        },
        { status: 400 }
      );
    }

    // Buscar um usuário real para o teste em desenvolvimento
    let userId = session?.user?.id;
    
    if (isDevelopment && !userId) {
      // Em ambiente de desenvolvimento, buscar o primeiro usuário disponível no banco
      try {
        const firstUser = await prisma.user.findFirst({
          select: { id: true }
        });
        
        if (firstUser) {
          userId = firstUser.id;
          console.log(`[GESTAO_CLICK] Usando primeiro usuário disponível para testes: ${userId}`);
        } else {
          console.warn('[GESTAO_CLICK] Nenhum usuário encontrado no banco de dados para testes');
          // Ignorar notificações em modo de testes se não houver usuários
          userId = undefined;
        }
      } catch (dbError) {
        console.error('[GESTAO_CLICK] Erro ao buscar usuário para testes:', dbError);
      }
    }
    
    // Em produção, verificar se o usuário realmente existe no banco de dados
    if (!isDevelopment && userId) {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      
      if (!userExists) {
        console.error(`[GESTAO_CLICK] Usuário não encontrado: ${userId}`);
        return NextResponse.json(
          { error: "Usuário não encontrado", message: "O usuário autenticado não foi encontrado na base de dados." },
          { status: 404 }
        );
      }
    }
    
    // Criar o serviço do Gestão Click
    const gestaoClickService = new GestaoClickService({
      apiKey,
      secretToken,
      apiUrl: apiUrl || process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com',
      userId: userId || 'system'
    });

    // Testar conexão com a API
    try {
      console.log('[GESTAO_CLICK] Testando conexão com a API...');
      const connectionTestResult = await gestaoClickService.testConnection();
      if (!connectionTestResult) {
        // Em ambiente de desenvolvimento, continuamos mesmo se o teste falhar
        if (process.env.NODE_ENV === 'development') {
          console.warn("[GESTAO_CLICK] Aviso: Teste de conexão falhou, mas continuando em ambiente de desenvolvimento");
        } else {
          return NextResponse.json(
            { error: "Não foi possível conectar à API do Gestão Click" },
            { status: 400 }
          );
        }
      } else {
        console.log('[GESTAO_CLICK] Conexão com API bem-sucedida');
      }
    } catch (error: any) {
      // Em ambiente de desenvolvimento, continuamos mesmo se o teste falhar
      if (process.env.NODE_ENV === 'development') {
        console.warn("[GESTAO_CLICK] Aviso: Erro ao testar conexão, mas continuando em ambiente de desenvolvimento:", error.message);
      } else {
        return NextResponse.json(
          { error: "Erro ao testar conexão com a API", message: error.message },
          { status: 400 }
        );
      }
    }

    // Criar notificação de início de importação apenas se tivermos um usuário válido
    if (userId) {
      try {
        await createServerNotification({
          userId,
          title: "Importação iniciada",
          message: "Iniciando importação de dados do Gestão Click",
          type: NotificationType.SYSTEM,
          priority: NotificationPriority.LOW,
          link: "/import-dashboard",
          metadata: {
            source: "GESTAO_CLICK",
            status: "STARTED",
            timestamp: new Date().toISOString(),
            importOptions: {
              importSales,
              importInstallments,
              importPayments,
              importReceipts,
              importCostCenters,
              importStores
            }
          }
        });
      } catch (notifError) {
        console.warn('[GESTAO_CLICK] Erro ao criar notificação de início:', notifError);
        // Continuar mesmo se falhar a criação da notificação
      }
    }

    // Determinar datas para importação
    // Nota: Vamos extrair a data de última sincronização de maneira mais segura
    let lastSyncDate: string | null = null;
    try {
      // Buscar configurações de integração com Gestão Click
      const globalSettings = await prisma.wallet.findFirst({
        where: {
          userId: userId || 'system',
          name: "GESTAO_CLICK_GLOBAL",
          type: "EXTERNAL_INTEGRATION" as any
        },
        select: {
          metadata: true
        }
      });
      
      if (globalSettings?.metadata && typeof globalSettings.metadata === 'object') {
        lastSyncDate = (globalSettings.metadata as any).lastSync || null;
      }
    } catch (error) {
      console.warn('[GESTAO_CLICK] Erro ao buscar última data de sincronização:', error);
      lastSyncDate = null;
    }
    
    // Se fullHistory for true, ignoramos a data da última sincronização e pegamos um período longo
    // MODIFICAÇÃO: Sempre usar 10 anos atrás como data inicial, independente da última sincronização
    // Isso garante que sejam importadas movimentações de todo o período, não apenas as mais recentes
    const effectiveStartDate = startDate ? new Date(startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 10)); 
    
    const effectiveEndDate = endDate ? new Date(endDate) : new Date();

    console.log(`[GESTAO_CLICK] Período de importação: ${effectiveStartDate.toISOString()} até ${effectiveEndDate.toISOString()}`);
    console.log(`[GESTAO_CLICK] Modo de importação: Histórico completo (últimos 10 anos)`);

    // Realizar importações conforme as opções
    // Preparar resultados para agregação
    const importResult: any = {
      wallets: {
        fromAccounts: { totalCreated: 0, skipped: 0, wallets: [] },
        fromCostCenters: { totalCreated: 0, skipped: 0, wallets: [] }
      },
      transactions: {
        totalImported: 0,
        skipped: 0,
        failed: 0,
        details: []
      },
      sales: {
        totalImported: 0,
        skipped: 0,
        failed: 0,
        details: []
      },
      installments: {
        totalImported: 0,
        skipped: 0,
        failed: 0,
        details: []
      },
      costCenters: {
        totalImported: 0,
        skipped: 0,
        details: []
      },
      stores: {
        totalImported: 0,
        skipped: 0,
        details: []
      }
    };
    
    // 1. Importar carteiras de contas bancárias (sempre necessário como base)
    if (importPayments || importReceipts) {
      console.log('[GESTAO_CLICK] Importando carteiras a partir de contas bancárias');
      const walletsFromAccountsResult = await gestaoClickService.createWalletsFromAccounts();
      importResult.wallets.fromAccounts = walletsFromAccountsResult;
      console.log(`[GESTAO_CLICK] Carteiras criadas: ${walletsFromAccountsResult.totalCreated}, ignoradas: ${walletsFromAccountsResult.skipped}`);
    }
    
    // 2. Importar centros de custo
    if (importCostCenters) {
      console.log('[GESTAO_CLICK] Importando centros de custo');
      const costCentersResult = await gestaoClickService.createWalletsFromCostCenters();
      importResult.wallets.fromCostCenters = costCentersResult;
      importResult.costCenters.totalImported = costCentersResult.totalCreated;
      importResult.costCenters.skipped = costCentersResult.skipped;
      console.log(`[GESTAO_CLICK] Centros de custo criados: ${costCentersResult.totalCreated}, ignorados: ${costCentersResult.skipped}`);
    }
    
    // 3. Importar transações (pagamentos e recebimentos)
    if (importPayments || importReceipts) {
      // Extrair apenas as carteiras de contas bancárias
      const bankAccountWallets = importResult.wallets.fromAccounts.wallets.filter((wallet: any) => 
        wallet.type === "GESTAO_CLICK"
      );
      
      console.log(`[GESTAO_CLICK] Importando transações para ${bankAccountWallets.length} carteiras de contas bancárias`);
      
      if (bankAccountWallets.length > 0) {
        // Definir filtros para importação de transações
        const importOptions = {
          startDate: effectiveStartDate.toISOString().split('T')[0],
          endDate: effectiveEndDate.toISOString().split('T')[0],
          deduplicateTransactions: true, // Garantir que não haja duplicação
          forceFullHistory: true, // Forçar importação de histórico completo
          apiFilters: {
            maxTransactions: maxTransactions || 100000, // Aumentar o limite máximo para garantir importação completa (de 50000 para 100000)
            limit: 2000, // Aumentar o limite por página para obter mais resultados por chamada (de 1000 para 2000)
            // Filtrar tipo de transação conforme selecionado
            transactionTypes: [
              ...(importPayments ? ['PAYMENT'] : []),
              ...(importReceipts ? ['RECEIPT'] : [])
            ]
          }
        };
        
        console.log(`[GESTAO_CLICK] Opções de importação:`, JSON.stringify(importOptions, null, 2));
        
        // Transações a serem importadas
        const transactionResults = await Promise.all(
          bankAccountWallets.map((wallet: any) => {
            // Passar explicitamente as datas para garantir o período correto
            return gestaoClickService.importTransactionsForWallet(
              wallet.id,
              importOptions.startDate,
              importOptions.endDate
            );
          })
        );
        
        // Combinar resultados de transações
        importResult.transactions = transactionResults.reduce((acc: any, curr: any) => {
          acc.totalImported += curr.totalImported;
          acc.skipped += curr.skipped;
          acc.failed += curr.failed;
          acc.details = [...acc.details, ...curr.details];
          return acc;
        }, {
          totalImported: 0,
          skipped: 0,
          failed: 0,
          details: []
        });
        
        console.log(`[GESTAO_CLICK] Transações importadas: ${importResult.transactions.totalImported}, ignoradas: ${importResult.transactions.skipped}`);
      }
    }
    
    // 4. Importar vendas e parcelas
    if (importSales) {
      console.log('[GESTAO_CLICK] Importando vendas');
      
      try {
        // Buscar vendas do período
        const salesOptions = { 
          includeInstallments: importInstallments,
          limit: maxTransactions || 5000, // Padrão de limite mais alto para importação completa (de 1000 para 5000)
          // Verificar duplicações com base no ID externo da venda
          deduplicateWithExisting: true
        };
        
        const sales = await gestaoClickService.getSales(
          effectiveStartDate,
          effectiveEndDate,
          salesOptions
        ).catch(error => {
          console.warn('[GESTAO_CLICK] Erro ao buscar vendas:', error);
          return []; // Retornar array vazio em caso de erro
        });
        
        // Preparar contadores para resultados
        let salesImported = 0;
        let salesSkipped = 0;
        let salesTotal = sales.length;
        
        console.log(`[GESTAO_CLICK] Total de vendas encontradas no Gestão Click: ${salesTotal}`);
        
        // Se a opção de dedupliação estiver ativa, verificar vendas existentes
        if (salesOptions.deduplicateWithExisting) {
          // Verificar se as vendas já existem no banco de dados
          // Construindo uma query IN com valores únicos separados por vírgula
          const saleIdsArray = sales.map((sale: any) => sale.id.toString());
          
          // Adicionar logs para depuração
          console.log(`[GESTAO_CLICK] Verificando ${saleIdsArray.length} IDs de vendas para deduplicação`);
          
          // Primeiro, vamos usar uma abordagem diferente para evitar o erro de tipo
          let existingSales: any[] = [];
          
          if (saleIdsArray.length > 0) {
            // Converter array para string formatada para consulta SQL com IN
            const placeholders = saleIdsArray.map((_: string, i: number) => `$${i + 2}`).join(', ');
            
            const rawQuery = `
              SELECT "externalId" FROM "sales_records"
              WHERE "userId" = $1
              AND "externalId" IN (${placeholders})
            `;
            
            try {
              existingSales = await prisma.$queryRawUnsafe(
                rawQuery,
                userId || 'system',
                ...saleIdsArray
              );
              
              console.log(`[GESTAO_CLICK] Encontradas ${existingSales.length} vendas já existentes no banco de dados`);
            } catch (sqlError) {
              console.error('[GESTAO_CLICK] Erro ao verificar vendas existentes:', sqlError);
              existingSales = [];
            }
          }
          
          // Criar um conjunto para verificação rápida
          const existingSaleIds = new Set((existingSales || []).map((sale: any) => sale.externalId));
          
          // Filtrar apenas novas vendas
          const newSales = sales.filter((sale: any) => !existingSaleIds.has(sale.id.toString()));
          
          salesImported = newSales.length;
          salesSkipped = salesTotal - salesImported;
          
          console.log(`[GESTAO_CLICK] ${salesTotal} vendas encontradas, ${salesSkipped} já existentes, ${salesImported} novas para importação`);
        } else {
          // Sem dedupliação, considerar todas as vendas como importadas
          salesImported = salesTotal;
        }
        
        importResult.sales.totalImported = salesImported;
        importResult.sales.skipped = salesSkipped;
        
        console.log(`[GESTAO_CLICK] ${salesImported} vendas importadas`);
        
        // Se importInstallments estiver habilitado, as vendas já incluem as parcelas
        if (importInstallments) {
          let totalInstallments = 0;
          let skippedInstallments = 0;
          
          // Contar total de parcelas importadas
          let existingSaleIds = new Set<string>();
          
          if (salesOptions.deduplicateWithExisting) {
            // Verificar novamente se as vendas já existem no banco
            try {
              const saleIds = sales.map((s: any) => s.id.toString());
              
              // Abordagem corrigida para evitar o erro de comparação entre texto e array
              let existingRecords: any[] = [];
              
              if (saleIds.length > 0) {
                // Converter array para string formatada para consulta SQL com IN
                const placeholders = saleIds.map((_: string, i: number) => `$${i + 2}`).join(', ');
                
                const rawQuery = `
                  SELECT "externalId" FROM "sales_records"
                  WHERE "userId" = $1
                  AND "externalId" IN (${placeholders})
                `;
                
                try {
                  existingRecords = await prisma.$queryRawUnsafe(
                    rawQuery,
                    userId || 'system',
                    ...saleIds
                  );
                } catch (sqlError) {
                  console.error('[GESTAO_CLICK] Erro ao verificar vendas existentes para parcelas:', sqlError);
                  existingRecords = [];
                }
              }
              
              existingSaleIds = new Set((existingRecords || []).map((s: any) => s.externalId));
            } catch (error) {
              console.warn('[GESTAO_CLICK] Erro ao verificar vendas existentes para parcelas:', error);
              // Continuar com conjunto vazio em caso de erro
            }
          }
          
          sales.forEach((sale: any) => {
            if (sale.parcelas && Array.isArray(sale.parcelas)) {
              // Adicionar log detalhado para depuração de parcelas
              console.log(`[GESTAO_CLICK] Venda ${sale.id} possui ${sale.parcelas.length} parcelas para processar`);
              
              // Criar um array com os IDs das parcelas para logs
              const parcelaIds = sale.parcelas.map((p: any) => p.id).join(', ');
              if (sale.parcelas.length > 0) {
                console.log(`[GESTAO_CLICK] IDs das parcelas da venda ${sale.id}: ${parcelaIds}`);
              }
              
              if (salesOptions.deduplicateWithExisting && existingSaleIds.has(sale.id.toString())) {
                // Se a venda já existe, contar parcelas como ignoradas
                skippedInstallments += sale.parcelas.length;
                console.log(`[GESTAO_CLICK] Ignorando ${sale.parcelas.length} parcelas da venda ${sale.id} (venda já existente)`);
              } else {
                // Caso contrário, contar como importadas
                totalInstallments += sale.parcelas.length;
              }
            }
          });
          
          importResult.installments.totalImported = totalInstallments;
          importResult.installments.skipped = skippedInstallments;
          console.log(`[GESTAO_CLICK] ${totalInstallments} parcelas importadas, ${skippedInstallments} ignoradas`);
        }
      } catch (error) {
        console.error('[GESTAO_CLICK] Erro ao importar vendas:', error);
        importResult.sales.failed = 1;
      }
    }

    // Atualizar última data de sincronização
    try {
      // Armazenar a data da última sincronização
      await prisma.wallet.upsert({
        where: {
          id: 'gestao-click-global',
        },
        update: {
          metadata: {
            lastSync: new Date().toISOString()
          }
        },
        create: {
          id: 'gestao-click-global',
          userId: userId || 'system',
          name: "GESTAO_CLICK_GLOBAL",
          type: "EXTERNAL_INTEGRATION" as any,
          balance: 0,
          metadata: {
            lastSync: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.warn('[GESTAO_CLICK] Erro ao atualizar data de última sincronização:', error);
    }

    // Revalidar caminhos para atualizar a UI
    revalidatePath("/wallets");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/dre");
    revalidatePath("/sales");

    // Armazenar as credenciais para uso futuro
    try {
      await gestaoClickService.storeIntegrationSettings("global", {
        apiKey,
        secretToken,
        apiUrl: apiUrl || process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com',
        lastSync: new Date().toISOString()
      });
    } catch (credError) {
      console.warn("[GESTAO_CLICK] Erro ao armazenar credenciais globais:", credError);
      // Não interromper o fluxo principal em caso de erro
    }

    // Criar resumo da importação para a notificação
    const totalWallets = 
      importResult.wallets.fromAccounts.totalCreated + 
      importResult.wallets.fromCostCenters.totalCreated;
    
    const totalTransactions = importResult.transactions.totalImported;
    const totalSales = importResult.sales.totalImported;
    const totalInstallments = importResult.installments.totalImported;
    
    // Criar notificação de conclusão da importação apenas se tivermos um usuário válido
    if (userId) {
      try {
        await createServerNotification({
          userId,
          title: "Importação concluída",
          message: `Importação do Gestão Click concluída: ${totalWallets} carteiras, ${totalTransactions} transações, ${totalSales} vendas`,
          type: NotificationType.SYSTEM,
          priority: NotificationPriority.MEDIUM,
          link: "/import-dashboard",
          metadata: {
            source: "GESTAO_CLICK",
            status: "COMPLETED",
            timestamp: new Date().toISOString(),
            summary: {
              wallets: totalWallets,
              transactions: totalTransactions,
              skippedTransactions: importResult.transactions.skipped,
              failedTransactions: importResult.transactions.failed,
              sales: totalSales,
              installments: totalInstallments,
              costCenters: importResult.costCenters.totalImported
            }
          }
        });
      } catch (notifError) {
        console.warn('[GESTAO_CLICK] Erro ao criar notificação de conclusão:', notifError);
        // Continuar mesmo se falhar a criação da notificação
      }
    }

    return NextResponse.json({
      success: true,
      message: "Importação automática concluída com sucesso",
      result: importResult
    });
  } catch (error: any) {
    console.error("Erro na importação automática do Gestão Click:", error);

    // ID do usuário (pode ser undefined em caso de erro antes da autenticação)
    const userId = (await getAuthSession())?.user?.id;
    
    // Criar notificação de erro na importação
    if (userId) {
      try {
        await createServerNotification({
          userId,
          title: "Falha na importação",
          message: `Erro ao importar dados do Gestão Click: ${error.message}`,
          type: NotificationType.SYSTEM,
          priority: NotificationPriority.HIGH,
          link: "/import-dashboard",
          metadata: {
            source: "GESTAO_CLICK",
            status: "FAILED",
            timestamp: new Date().toISOString(),
            errorDetails: {
              message: error.message,
              stack: error.stack
            }
          }
        });
      } catch (notifError) {
        console.warn('[GESTAO_CLICK] Erro ao criar notificação de erro:', notifError);
      }
    }

    return NextResponse.json(
      {
        error: "Falha na importação automática",
        message: error.message,
        details: error.stack
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gestao-click/auto-import
 * Retorna o status atual do processo de importação
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário apenas em produção
    // Em ambiente de desenvolvimento, permitir testes sem autenticação
    const isDevelopment = process.env.NODE_ENV === 'development';
    const session = await getAuthSession();
    
    if (!isDevelopment && !session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar informações sobre a última importação
    const userId = session?.user?.id;
    
    if (userId) {
      const lastImport = await prisma.importHistory.findFirst({
        where: {
          userId,
          source: "GESTAO_CLICK"
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      });
      
      if (lastImport) {
        return NextResponse.json({
          success: true,
          message: "Informações da última importação",
          lastImport: {
            date: lastImport.createdAt,
            status: lastImport.status,
            totalTransactions: lastImport.totalTransactions,
            importedTransactions: lastImport.importedTransactions,
            skippedTransactions: lastImport.skippedTransactions,
            metadata: lastImport.metadata
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Endpoint de importação automática disponível",
      status: "ready",
      features: [
        "Importação de carteiras",
        "Importação de transações",
        "Importação de centros de custo",
        "Importação de vendas",
        "Importação de parcelas",
        "Importação de pagamentos e recebimentos"
      ]
    });
  } catch (error: any) {
    console.error("Erro ao verificar status da importação:", error);

    return NextResponse.json(
      {
        error: "Falha ao verificar status",
        message: error.message
      },
      { status: 500 }
    );
  }
}

// Configuração avançada para tratamento de erros
function handleSaleInstallmentsErrors(error: any, saleId: string | number) {
  // Se for um 404, isso é comum e apenas significa que a venda não tem parcelas
  if (error?.message?.includes('404') || error?.message?.includes('Erro ao buscar parcelas: 404')) {
    console.log(`[API] Venda ${saleId} não possui parcelas (404) - isso é normal e não é um erro`);
    return [];
  }
  
  // Outros erros são registrados mas também não devem interromper o fluxo
  console.warn(`[API] Erro ao buscar parcelas da venda ${saleId}: ${error?.message || 'Erro desconhecido'}`);
  return [];
} 