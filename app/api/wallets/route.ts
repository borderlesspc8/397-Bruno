import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/db";
import { getAuthSession } from "@/app/_lib/auth";
import { WalletService } from "@/app/_services/wallet-service";
import { Wallet } from "@prisma/client";
import { calculateSimpleWalletBalance } from "@/app/_utils/wallet-balance";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { 
          error: "Não autorizado",
          wallets: [], 
          totalBalance: 0,
          stats: getDefaultStats()
        }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const includeBalance = searchParams.get("includeBalance") === "true";
    const recalculateBalances = searchParams.get("recalculateBalances") === "true";

    // Se um ID específico for fornecido
    if (id) {
      const wallet = await WalletService.getWalletById(id, session.user.id);
      
      if (!wallet) {
        return NextResponse.json({ 
          error: "Carteira não encontrada",
          wallet: null
        }, { status: 404 });
      }
      
      return NextResponse.json({ wallet });
    }

    try {
      // Listar todas as carteiras do usuário
      const walletsData = includeBalance 
        ? await WalletService.getWalletsWithBalance(session.user.id)
        : await WalletService.getUserWallets(session.user.id);
      
      // Garantir que wallets é um array
      const wallets = Array.isArray(walletsData) ? walletsData : [];
      
      // Se solicitado, recalcular os saldos de todas as carteiras
      let correctedWallets = [...wallets];
      if (recalculateBalances && session.user?.id) {
        correctedWallets = await Promise.all(
          wallets.map(async (wallet) => {
            try {
              const userId = session.user?.id;
              if (!userId) {
                return wallet; // Se não houver ID de usuário, retornar a carteira original
              }
              
              // Calcular o saldo correto baseado nas transações
              const calculatedBalance = await calculateSimpleWalletBalance(wallet.id, userId);
              
              console.log(`[API_WALLETS] Carteira: ${wallet.name}, Saldo armazenado: ${wallet.balance}, Saldo calculado: ${calculatedBalance}`);
              
              // Atualizar o saldo no banco de dados se necessário
              if (Math.abs(wallet.balance - calculatedBalance) > 0.01) {
                await db.wallet.update({
                  where: { id: wallet.id },
                  data: { balance: calculatedBalance }
                });
              }
              
              // Retornar o wallet com o saldo correto
              return { ...wallet, balance: calculatedBalance };
            } catch (error) {
              console.error(`[API_WALLETS] Erro ao recalcular saldo da carteira ${wallet.id}:`, error);
              return wallet; // Retornar a carteira original em caso de erro
            }
          })
        );
      }
      
      // Calcular saldo total com os valores corretos
      const totalBalance = correctedWallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
      
      // Calcular estatísticas
      const stats = {
        totalWallets: correctedWallets.length,
        bankWallets: correctedWallets.filter(w => ["BANK", "BANK_INTEGRATION"].includes(w.type as string)).length,
        cashWallets: correctedWallets.filter(w => w.type === "CASH").length,
        otherWallets: correctedWallets.filter(w => !["BANK", "BANK_INTEGRATION", "CASH"].includes(w.type as string)).length,
        positiveBalanceWallets: correctedWallets.filter(w => (w.balance || 0) > 0).length,
        negativeBalanceWallets: correctedWallets.filter(w => (w.balance || 0) < 0).length
      };
      
      // Retornar dados estruturados
      return NextResponse.json({
        wallets: correctedWallets,
        totalBalance,
        stats
      });
    } catch (error) {
      console.error("Erro ao processar dados das carteiras:", error);
      return NextResponse.json({ 
        error: "Erro ao processar dados",
        wallets: [], 
        totalBalance: 0,
        stats: getDefaultStats()
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Erro ao buscar carteiras:", error);
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      wallets: [], 
      totalBalance: 0,
      stats: getDefaultStats()
    }, { status: 500 });
  }
}

// Função para gerar estatísticas padrão
function getDefaultStats() {
  return {
    totalWallets: 0,
    bankWallets: 0,
    cashWallets: 0,
    otherWallets: 0,
    positiveBalanceWallets: 0,
    negativeBalanceWallets: 0
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const body = await request.json();
    
    // Validar campos obrigatórios
    if (!body.name) {
      return new NextResponse("Nome da carteira é obrigatório", { status: 400 });
    }

    // Validar tipo de carteira
    const validTypes = ["CHECKING", "SAVINGS", "CREDIT_CARD", "INVESTMENT", "CASH", "DIGITAL", "OTHER"];
    const walletType = body.type && validTypes.includes(body.type) ? body.type : "CHECKING";

    // Criar carteira usando o serviço
    const result = await WalletService.createWallet({
      userId: session.user.id,
      name: body.name,
      initialBalance: body.balance ? parseFloat(body.balance) : 0,
      type: walletType,
      isActive: body.isActive !== undefined ? body.isActive : true,
      allowNegative: body.allowNegative !== undefined ? body.allowNegative : false,
      creditLimit: body.creditLimit ? parseFloat(body.creditLimit) : undefined,
      dueDay: body.dueDay ? parseInt(body.dueDay) : undefined,
      closingDay: body.closingDay ? parseInt(body.closingDay) : undefined,
      icon: body.icon,
      color: body.color,
      metadata: body.metadata
    });

    if (!result.success) {
      return new NextResponse(result.error || "Erro ao criar carteira", { status: 400 });
    }

    return NextResponse.json(result.wallet);
  } catch (error) {
    console.error("Erro ao criar carteira:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    
    // Preparar dados para atualização
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.allowNegative !== undefined) updateData.allowNegative = body.allowNegative;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    
    // Validar campos numéricos
    if (body.balance !== undefined) updateData.balance = parseFloat(body.balance);
    if (body.creditLimit !== undefined) updateData.creditLimit = parseFloat(body.creditLimit);
    if (body.dueDay !== undefined) updateData.dueDay = parseInt(body.dueDay);
    if (body.closingDay !== undefined) updateData.closingDay = parseInt(body.closingDay);
    
    // Validar tipo de carteira
    const validTypes = ["CHECKING", "SAVINGS", "CREDIT_CARD", "INVESTMENT", "CASH", "DIGITAL", "OTHER"];
    if (body.type && validTypes.includes(body.type)) {
      updateData.type = body.type;
    }

    // Atualizar carteira usando o serviço
    const result = await WalletService.updateWallet(id, session.user.id, updateData);

    if (!result || !result.success) {
      return new NextResponse(result?.error || "Erro ao atualizar carteira", { status: 400 });
    }

    return NextResponse.json(result.wallet);
  } catch (error) {
    console.error("Erro ao atualizar carteira:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const transferTo = searchParams.get("transferTo");

    if (!id) {
      return new NextResponse("ID não fornecido", { status: 400 });
    }

    // Excluir carteira usando o serviço
    const result = await WalletService.deleteWallet(id, session.user.id, transferTo || undefined);

    if (!result.success) {
      return new NextResponse(result.error || "Erro ao excluir carteira", { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir carteira:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
} 