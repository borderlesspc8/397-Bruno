import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { WalletService } from "@/app/_services/wallet-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const body = await request.json();
    
    // Validar campos obrigatórios
    if (!body.sourceWalletId || !body.targetWalletId || !body.amount) {
      return new NextResponse("Campos obrigatórios: sourceWalletId, targetWalletId, amount", { status: 400 });
    }

    // Verificar se as carteiras são diferentes
    if (body.sourceWalletId === body.targetWalletId) {
      return new NextResponse("Não é possível transferir para a mesma carteira", { status: 400 });
    }

    // Converter valores
    const amount = parseFloat(body.amount);
    
    // Validar valores
    if (isNaN(amount) || amount <= 0) {
      return new NextResponse("Valor inválido", { status: 400 });
    }

    // Realizar a transferência
    const result = await WalletService.transferBetweenWallets(
      session.user.id,
      body.sourceWalletId,
      body.targetWalletId,
      amount,
      body.description || "Transferência entre carteiras"
    );

    if (!result.success) {
      return new NextResponse(result.error || "Erro ao realizar transferência", { status: 400 });
    }

    return NextResponse.json({
      success: true,
      sourceTransaction: result.sourceTransaction,
      targetTransaction: result.targetTransaction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erro ao realizar transferência:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
} 