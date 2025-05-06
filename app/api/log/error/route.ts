/**
 * API para registrar erros do cliente no servidor
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  try {
    // Obter a sessão do usuário (opcional)
    const session = await getAuthSession();
    const userId = session?.user?.id;
    
    // Obter o corpo da requisição
    const body = await request.json();
    
    // Validar que temos ao menos uma mensagem de erro
    if (!body.message) {
      return NextResponse.json(
        { error: "Detalhes do erro são obrigatórios" },
        { status: 400 }
      );
    }
    
    // Extrair informações relevantes
    const {
      message,
      code = 'UNKNOWN_ERROR',
      stack,
      context,
      url,
      userAgent,
      timestamp = new Date().toISOString()
    } = body;
    
    // Obter informações adicionais da requisição
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const referer = request.headers.get('referer') || 'unknown';
    
    // Criar objeto de erro completo
    const errorLog = {
      userId,
      message,
      code,
      stack,
      context,
      url,
      userAgent,
      timestamp,
      ip,
      referer,
      environment: process.env.NODE_ENV || 'development'
    };
    
    // Log do erro no console
    console.error('[Client Error]', JSON.stringify(errorLog, null, 2));
    
    // Em produção, podemos enviar para um serviço de monitoramento como Sentry
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implementar integração com serviço de monitoramento
      // await sendToMonitoringService(errorLog);
      
      // Ou salvar no banco de dados
      // await prisma.errorLog.create({
      //   data: {
      //     userId,
      //     message,
      //     code,
      //     metadata: {
      //       stack,
      //       context,
      //       url,
      //       userAgent,
      //       ip,
      //       referer
      //     }
      //   }
      // });
    }
    
    // Retornar sucesso
    return NextResponse.json({
      success: true,
      message: "Erro registrado com sucesso"
    });
  } catch (error: any) {
    console.error("Erro ao registrar erro do cliente:", error);
    
    return NextResponse.json(
      {
        error: "Falha ao registrar erro",
        message: error.message
      },
      { status: 500 }
    );
  }
} 
