import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/app/_utils/auth";
import { NotificationService } from "@/app/_services/notification-service";
import { prisma } from "@/app/_lib/prisma";

// GET /api/notifications/[id] - Buscar uma notificação específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar notificação específica no banco de dados
    const notificationId = params.id;
    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
        userId: session.user.id, // Garante que o usuário só veja suas próprias notificações
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error(`Erro na rota GET /api/notifications/${params.id}:`, error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/[id] - Atualizar status da notificação (marcar como lida/arquivada)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const notificationId = params.id;
    const body = await request.json();
    const { action } = body;

    // Verificar ação solicitada
    if (action === "markAsRead") {
      const result = await NotificationService.markAsRead(
        notificationId,
        session.user.id
      );

      if (!result.success) {
        return NextResponse.json(
          { error: "Falha ao marcar notificação como lida" },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        message: "Notificação marcada como lida",
        notification: result.notification
      });
    } 
    else if (action === "archive") {
      const result = await NotificationService.archiveNotification(
        notificationId,
        session.user.id
      );

      if (!result.success) {
        return NextResponse.json(
          { error: "Falha ao arquivar notificação" },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        message: "Notificação arquivada",
        notification: result.notification
      });
    }
    
    return NextResponse.json(
      { error: "Ação não suportada" },
      { status: 400 }
    );
  } catch (error) {
    console.error(`Erro na rota PATCH /api/notifications/${params.id}:`, error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Excluir uma notificação
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const notificationId = params.id;
    
    // Excluir notificação
    const result = await NotificationService.deleteNotification(
      notificationId,
      session.user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Falha ao excluir notificação" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Notificação excluída com sucesso" 
    });
  } catch (error) {
    console.error(`Erro na rota DELETE /api/notifications/${params.id}:`, error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 