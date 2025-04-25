import { NextResponse } from "next/server";
import { TransactionService } from "@/app/_services/transaction-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code, transactionIds } = body;

    if (!code || !transactionIds || !Array.isArray(transactionIds)) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    const result = await TransactionService.reconcileTransactionsByCode(
      session.user.id,
      code,
      transactionIds
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.transaction);
  } catch (error) {
    console.error("Erro ao conciliar transações:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 