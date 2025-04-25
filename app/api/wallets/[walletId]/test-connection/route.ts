import { NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { testBankConnection } from "@/app/_lib/bank-utils";

export async function POST(
  request: Request,
  { params }: { params: { walletId: string } }
) {
  try {
    console.log("[TEST_CONNECTION_API] Iniciando teste para carteira:", params.walletId);
    
    // Verificar autenticação do usuário
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter a carteira pelo ID
    const wallet = await prisma.wallet.findUnique({
      where: {
        id: params.walletId,
        userId: session.user.id,
      }
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Carteira não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se a carteira é do tipo integração bancária
    if (wallet.type !== "BANK_INTEGRATION") {
      return NextResponse.json(
        { error: "Esta carteira não é do tipo integração bancária" },
        { status: 400 }
      );
    }

    // Obter o ID da conexão dos metadados da carteira
    const metadata = wallet.metadata as Record<string, any> || {};
    const connectionId = metadata.connectionId;

    if (!connectionId) {
      return NextResponse.json(
        { error: "ID da conexão não encontrado na carteira" },
        { status: 400 }
      );
    }

    // Usar nossa função utilitária para testar a conexão
    const result = await testBankConnection(connectionId, wallet.id);
    
    // Retornar o resultado com o status HTTP apropriado
    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        data: result.data,
        error: result.error
      },
      { status: result.statusCode || (result.success ? 200 : 400) }
    );
  } catch (error) {
    console.error("[TEST_CONNECTION_API_ERROR]", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Erro interno ao processar a requisição",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 