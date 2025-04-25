import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { importGestaoClickTransactions } from "@/app/_lib/import/gestao-click";
import { NotificationType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth-options";
import { GestaoClickService } from "@/app/_services/gestao-click-service";
import { calculateImportDates, calculateNextRunDate } from "@/app/_lib/date-utils";

interface ImportResult {
  success: boolean;
  message: string;
  data?: {
    wallets: {
      total: number;
      created: number;
      existing: number;
    };
    transactions: {
      total: number;
      imported: number;
      skipped: number;
      details: Array<{
        walletId: string;
        walletName: string;
        newTransactions: number;
      }>;
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autorização - Esse endpoint deve ser chamado apenas por cron jobs ou com um secret token
    const authHeader = request.headers.get("authorization");
    const apiSecretKey = process.env.CRON_SECRET_KEY;
    
    if ((!authHeader || !authHeader.startsWith("Bearer ")) && request.nextUrl.searchParams.get("key") !== apiSecretKey) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      if (token !== apiSecretKey) {
        return NextResponse.json(
          { error: "Token inválido" },
          { status: 401 }
        );
      }
    }
    
    // Buscar todas as agendamentos de importação ativos
    const scheduledImports = await prisma.importSchedule.findMany({
      where: {
        active: true,
        source: "GESTAO_CLICK",
        nextRunAt: {
          lte: new Date(), // Apenas agendamentos que devem ser executados agora ou no passado
        },
      },
      include: {
        user: true,
      },
    });
    
    if (scheduledImports.length === 0) {
      return NextResponse.json(
        { message: "Nenhuma importação agendada para execução" },
        { status: 200 }
      );
    }
    
    // Array para armazenar os resultados de todas as importações
    const results: Array<{
      userId: string;
      email: string | null;
      success: boolean;
      message: string;
      importId: string;
    }> = [];
    
    // Executar as importações agendadas sequencialmente
    for (const schedule of scheduledImports) {
      try {
        // Atualizar o status do agendamento para "RUNNING"
        await prisma.importSchedule.update({
          where: { id: schedule.id },
          data: {
            status: "RUNNING",
            lastRunAt: new Date(),
          },
        });
        
        // Determinar as credenciais a serem utilizadas
        const useEnvCredentials = 
          schedule.credentials?.useEnvCredentials === true || 
          (!schedule.credentials?.apiKey && !schedule.credentials?.secretToken);
        
        let apiKey = "";
        let secretToken = "";
        let apiUrl = "";
        
        if (useEnvCredentials) {
          apiKey = process.env.GESTAO_CLICK_ACCESS_TOKEN || "";
          secretToken = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || "";
          apiUrl = process.env.GESTAO_CLICK_API_URL || "";
        } else {
          apiKey = schedule.credentials?.apiKey || "";
          secretToken = schedule.credentials?.secretToken || "";
          apiUrl = schedule.credentials?.apiUrl || "";
        }
        
        if (!apiKey || !secretToken || !apiUrl) {
          throw new Error("Credenciais incompletas para importação");
        }
        
        // Inicializar o serviço do Gestão Click
        const gestaoClickService = new GestaoClickService({
          apiKey,
          secretToken, 
          apiUrl,
          userId: schedule.userId
        });
        
        // Testar a conexão
        await gestaoClickService.testConnection();
        
        // Calcular datas de importação
        const { startDate, endDate } = calculateImportDates(schedule.frequency || "DAILY");
        
        // Executar a importação
        const importResult = await importGestaoClickTransactions({
          userId: schedule.userId,
          gestaoClickService,
          startDate,
          endDate,
        }) as ImportResult;
        
        // Criar registro de histórico de importação
        const importHistory = await prisma.importHistory.create({
          data: {
            userId: schedule.userId,
            source: "GESTAO_CLICK",
            status: importResult.success ? "SUCCESS" : "ERROR",
            transactionsProcessed: importResult.data?.transactions.total || 0,
            transactionsImported: importResult.data?.transactions.imported || 0,
            walletsProcessed: importResult.data?.wallets.total || 0,
            walletsCreated: importResult.data?.wallets.created || 0,
            details: {
              message: importResult.message,
              error: importResult.success ? null : importResult.message,
              walletDetails: importResult.data?.transactions.details || [],
            },
          },
        });
        
        // Atualizar o agendamento com o novo status e próxima execução
        const nextRunDate = calculateNextRunDate(schedule.frequency || "DAILY");
        
        await prisma.importSchedule.update({
          where: { id: schedule.id },
          data: {
            status: importResult.success ? "SUCCESS" : "ERROR",
            lastRunAt: new Date(),
            nextRunAt: nextRunDate,
            lastImportHistoryId: importHistory.id,
          },
        });
        
        // Criar notificação para o usuário
        await prisma.notification.create({
          data: {
            userId: schedule.userId,
            type: importResult.success 
              ? "IMPORT_SUCCESS" 
              : "IMPORT_ERROR",
            title: importResult.success 
              ? "Importação automática concluída" 
              : "Erro na importação automática",
            message: importResult.success
              ? `Importação automática do Gestão Click concluída com sucesso. Foram importadas ${importResult.data?.transactions.imported} transações.`
              : `Ocorreu um erro na importação automática do Gestão Click: ${importResult.message}`,
            read: false,
            data: {
              importHistoryId: importHistory.id,
              transactionsImported: importResult.data?.transactions.imported || 0,
              walletsCreated: importResult.data?.wallets.created || 0,
            },
          },
        });
        
        results.push({
          userId: schedule.userId,
          email: schedule.user?.email || null,
          success: importResult.success,
          message: importResult.message,
          importId: importHistory.id,
        });
        
      } catch (error) {
        console.error(`Erro ao executar importação agendada para o usuário ${schedule.userId}:`, error);
        
        // Atualizar o agendamento com o status de erro
        await prisma.importSchedule.update({
          where: { id: schedule.id },
          data: {
            status: "ERROR",
            lastRunAt: new Date(),
            nextRunAt: calculateNextRunDate(schedule.frequency || "DAILY"),
          },
        });
        
        // Criar notificação de erro para o usuário
        await prisma.notification.create({
          data: {
            userId: schedule.userId,
            type: "IMPORT_ERROR",
            title: "Erro na importação automática",
            message: `Ocorreu um erro na importação automática do Gestão Click: ${(error as Error).message}`,
            read: false,
            data: {
              error: (error as Error).message,
            },
          },
        });
        
        results.push({
          userId: schedule.userId,
          email: schedule.user?.email || null,
          success: false,
          message: (error as Error).message,
          importId: "",
        });
      }
    }
    
    return NextResponse.json({
      message: `Processadas ${results.length} importações agendadas`,
      results
    }, { status: 200 });
    
  } catch (error) {
    console.error("Erro ao processar importações agendadas:", error);
    return NextResponse.json(
      { error: "Erro ao processar importações agendadas", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Função para calcular a próxima data de execução com base na frequência
// Esta função foi movida para o arquivo lib/date-utils.ts
// function calculateNextRunDate(frequency: string): Date {
//   const now = new Date();
//   const nextRun = new Date(now);
//   
//   switch (frequency) {
//     case "HOURLY":
//       nextRun.setHours(now.getHours() + 1);
//       break;
//     case "DAILY":
//       nextRun.setDate(now.getDate() + 1);
//       nextRun.setHours(3, 0, 0, 0); // Executar às 3h da manhã
//       break;
//     case "WEEKLY":
//       nextRun.setDate(now.getDate() + 7);
//       nextRun.setHours(3, 0, 0, 0); // Executar às 3h da manhã
//       break;
//     case "MONTHLY":
//       nextRun.setMonth(now.getMonth() + 1);
//       nextRun.setDate(1); // Primeiro dia do mês
//       nextRun.setHours(3, 0, 0, 0); // Executar às 3h da manhã
//       break;
//     default:
//       nextRun.setDate(now.getDate() + 1);
//       nextRun.setHours(3, 0, 0, 0); // Executar às 3h da manhã (padrão diário)
//   }
//   
//   return nextRun;
// } 