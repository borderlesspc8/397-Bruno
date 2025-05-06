/**
 * API de Conciliação Automática de Parcelas com Machine Learning
 * 
 * Este endpoint é chamado automaticamente após a importação de transações
 * para identificar e conciliar grupos de transações que representam parcelas
 * da mesma venda. O processo utiliza Machine Learning para determinar com
 * alta confiança quais transações devem ser agrupadas e vinculadas.
 * 
 * Funcionalidades:
 * - Detecção automática de grupos de transações relacionadas (parcelas)
 * - Identificação de padrões como valores similares, mesma origem, datas próximas
 * - Vinculação automática à venda correspondente no Gestão Click
 * - Suporte a casos como parcelamentos antecipados onde múltiplos lançamentos
 *   correspondem à mesma venda
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { MLReconciliationService } from "@/app/_services/ml-reconciliation-service";
import { logger } from "@/app/_services/logger";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


// Chave secreta para autenticação de serviços internos
const API_SECRET_KEY = process.env.API_SECRET_KEY || 'contarapida_internal_api_key';

/**
 * POST /api/reconciliation/ml/auto
 * 
 * Realiza a conciliação automática de parcelas após importação de transações
 * Este endpoint é chamado internamente pelo sistema quando novas transações são importadas
 */
export async function POST(request: NextRequest) {
  try {
    let isAuthenticated = false;
    let userId: string | null = null;
    
    // Verificar autenticação usando a sessão do servidor
    const session = await getServerSession(authOptions);
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
              { success: false, error: "ID do usuário não fornecido na requisição do serviço" },
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
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter dados do corpo da requisição
    const data = await request.json();
    const { startDate, endDate, walletId } = data;
    
    // Converter datas se fornecidas
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    
    // Definir período padrão se não fornecido (últimos 30 dias)
    const effectiveStartDate = parsedStartDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const effectiveEndDate = parsedEndDate || new Date();
    
    logger.info(`[AUTO_ML_RECONCILIATION] Iniciando conciliação automática de parcelas`, {
      userId,
      startDate: effectiveStartDate.toISOString(),
      endDate: effectiveEndDate.toISOString(),
      walletId: walletId || 'all'
    });
    
    // Verificar se o modelo está pronto
    const modelReady = await MLReconciliationService["isModelReady"](userId);
    
    if (!modelReady) {
      logger.info(`[AUTO_ML_RECONCILIATION] Modelo não está pronto para o usuário ${userId}. Ignorando reconciliação automática.`);
      return NextResponse.json({
        success: true,
        data: {
          matched: 0,
          modelReady: false,
          message: "O modelo de ML ainda não está pronto. Continue conciliando manualmente para treinar o sistema."
        }
      });
    }
    
    // Executar reconciliação de parcelas
    const reconciliationResult = await MLReconciliationService.reconcileInstallments(
      userId,
      effectiveStartDate,
      effectiveEndDate,
      walletId
    );
    
    logger.info(`[AUTO_ML_RECONCILIATION] Conciliação concluída`, {
      userId,
      result: reconciliationResult
    });
    
    return NextResponse.json({
      success: true,
      data: reconciliationResult
    });
  } catch (error: any) {
    logger.error(`[AUTO_ML_RECONCILIATION] Erro ao conciliar parcelas:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Erro ao realizar conciliação automática de parcelas" 
      },
      { status: 500 }
    );
  }
} 
