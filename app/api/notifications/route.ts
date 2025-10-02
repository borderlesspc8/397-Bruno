import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/app/_utils/auth";
import { NotificationService } from "@/app/_services/notification-service";
import { z } from "zod";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


// Schema para validação na criação de notificações
const createNotificationSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  message: z.string().min(1, "Mensagem é obrigatória"),
  type: z.enum(["TRANSACTION", "BUDGET", "GOAL", "SECURITY", "SYSTEM", "SUBSCRIPTION", "IMPORT", "OTHER"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  link: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.string().datetime().optional(),
});

// GET /api/notifications - Buscar notificações do usuário
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parâmetros de consulta
    const isRead = searchParams.has("isRead") 
      ? searchParams.get("isRead") === "true" 
      : undefined;
    
    const isArchived = searchParams.has("isArchived") 
      ? searchParams.get("isArchived") === "true" 
      : undefined;
    
    const type = searchParams.get("type") as any;
    const limit = searchParams.has("limit") 
      ? parseInt(searchParams.get("limit") as string) 
      : 20;
    
    const cursor = searchParams.get("cursor") || undefined;

    // Buscar notificações
    const result = await NotificationService.getNotifications({
      userId: session.user.id,
      isRead,
      isArchived,
      type,
      limit,
      cursor,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Falha ao buscar notificações" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notifications: result.notifications,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error("Erro na rota GET /api/notifications:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Criar nova notificação (admin ou sistema)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado - apenas administradores podem criar notificações" },
        { status: 403 }
      );
    }

    // Validar dados
    const body = await request.json();
    const validationResult = createNotificationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    
    // Se o destino for um usuário específico
    const targetUserId = body.userId || session.user.id;
    
    // Criar notificação
    const result = await NotificationService.createNotification({
      userId: targetUserId,
      title: data.title,
      message: data.message,
      type: data.type as any,
      priority: data.priority as any,
      link: data.link,
      metadata: data.metadata,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Falha ao criar notificação" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { notification: result.notification },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro na rota POST /api/notifications:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Limpar todas as notificações do usuário
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Se for "read=true", marca todas como lidas
    if (searchParams.get("action") === "markAllRead") {
      const type = searchParams.get("type") as any;
      const result = await NotificationService.markAllAsRead(
        session.user.id,
        type
      );

      if (!result.success) {
        return NextResponse.json(
          { error: "Falha ao marcar notificações como lidas" },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        message: `${result.count} notificações marcadas como lidas` 
      });
    }

    // Caso contrário, não permitimos a exclusão em massa por segurança
    return NextResponse.json(
      { error: "Operação não suportada" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro na rota DELETE /api/notifications:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 
