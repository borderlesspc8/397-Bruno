import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { fixAllUserWalletBalances } from "@/app/_utils/wallet-balance";

/**
 * POST - Corrigir saldos de todas as carteiras do usuário
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }
    
    // Chamar a função utilitária para corrigir saldos
    const resultsArray = await fixAllUserWalletBalances(session.user.id);
    
    // Processando os resultados para o formato esperado
    const updatedCount = resultsArray.filter(r => r.wasUpdated).length;
    const totalWallets = resultsArray.length;
    
    // Formatar os resultados
    const results = {
      updatedCount,
      totalWallets,
      details: resultsArray
    };
    
    return NextResponse.json({
      success: true,
      message: `${updatedCount} de ${totalWallets} carteiras atualizadas.`,
      results
    });
  } catch (error) {
    console.error("[FIX_BALANCES] Erro:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Erro ao processar solicitação"
    }, { status: 500 });
  }
} 