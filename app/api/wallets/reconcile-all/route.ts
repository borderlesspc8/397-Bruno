import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { fixAllUserWalletBalances } from "@/app/_utils/wallet-balance";

// Definir tipos para melhor segurança
type WalletReconcileResult = {
  walletId: string;
  storedBalance?: number;
  calculatedBalance?: number;
  isBalanceCorrect?: boolean;
  wasUpdated: boolean;
  wallet?: {
    name: string;
    id: string;
    type: string;
    userId: string;
    bankId: string | null;
  };
  error?: string;
};

/**
 * POST /api/wallets/reconcile-all
 * 
 * Endpoint para recalcular e corrigir os saldos de todas as carteiras do usuário
 * (Funciona como um alias para fix-balances para compatibilidade)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        message: "Não autorizado" 
      }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Usar a mesma função utilitária do endpoint fix-balances
    const resultsArray = await fixAllUserWalletBalances(userId);
    
    // Processar os resultados no formato esperado pela interface
    const updatedCount = resultsArray.filter(r => r.wasUpdated).length;
    const totalWallets = resultsArray.length;
    
    // Transformar os resultados para o formato esperado pela página de reconciliação
    const details = resultsArray.map((result: WalletReconcileResult) => {
      // Lidando com os diferentes formatos possíveis dos resultados
      if ('error' in result && result.error) {
        return {
          walletId: result.walletId,
          name: result.wallet?.name || 'Carteira desconhecida',
          oldBalance: 0,
          newBalance: 0,
          difference: 0,
          updated: false,
          error: result.error
        };
      }
      
      // Caso normal com valores corretos
      return {
        walletId: result.walletId,
        name: result.wallet?.name || 'Carteira desconhecida',
        oldBalance: result.storedBalance || 0,
        newBalance: result.calculatedBalance || 0,
        difference: (result.calculatedBalance || 0) - (result.storedBalance || 0),
        updated: result.wasUpdated
      };
    });
    
    // Estruturar a resposta no formato esperado
    return NextResponse.json({
      success: true,
      message: `Reconciliação concluída. ${updatedCount} de ${totalWallets} carteiras foram atualizadas.`,
      results: {
        total: totalWallets,
        updated: updatedCount,
        details
      }
    });
  } catch (error) {
    console.error("[RECONCILE_ALL] Erro ao reconciliar carteiras:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Erro interno ao reconciliar carteiras" 
    }, { status: 500 });
  }
} 