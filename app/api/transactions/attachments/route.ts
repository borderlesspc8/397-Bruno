import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { TransactionAttachmentService } from "@/app/_services/transaction-attachment-service";

// API para listar anexos de uma transação
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const transactionId = searchParams.get("transactionId");

    // Se for para buscar um anexo específico
    if (id) {
      const attachment = await TransactionAttachmentService.getAttachmentById(id, session.user.id);
      
      if (!attachment) {
        return new NextResponse("Anexo não encontrado", { status: 404 });
      }
      
      return NextResponse.json(attachment);
    }
    
    // Se for para listar os anexos de uma transação
    if (transactionId) {
      const attachments = await TransactionAttachmentService.getTransactionAttachments(
        transactionId, 
        session.user.id
      );
      
      return NextResponse.json(attachments);
    }
    
    return new NextResponse("ID do anexo ou da transação não fornecido", { status: 400 });
  } catch (error) {
    console.error("Erro ao buscar anexos:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

// API para adicionar um anexo a uma transação
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const body = await request.json();
    
    // Validar campos obrigatórios
    if (!body.transactionId || !body.name || !body.fileKey || !body.fileUrl || !body.fileType || body.fileSize === undefined) {
      return new NextResponse("Campos obrigatórios: transactionId, name, fileKey, fileUrl, fileType, fileSize", { status: 400 });
    }

    // Criar anexo usando o serviço
    const result = await TransactionAttachmentService.addAttachment({
      userId: session.user.id,
      transactionId: body.transactionId,
      name: body.name,
      fileKey: body.fileKey,
      fileUrl: body.fileUrl,
      fileType: body.fileType,
      fileSize: body.fileSize,
      metadata: body.metadata
    });

    if (!result.success) {
      return new NextResponse(result.error || "Erro ao adicionar anexo", { status: 400 });
    }

    return NextResponse.json(result.attachment);
  } catch (error) {
    console.error("Erro ao adicionar anexo:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

// API para remover um anexo
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("ID não fornecido", { status: 400 });
    }

    // Excluir anexo usando o serviço
    const result = await TransactionAttachmentService.removeAttachment(id, session.user.id);

    if (!result.success) {
      return new NextResponse(result.error || "Erro ao excluir anexo", { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir anexo:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
} 