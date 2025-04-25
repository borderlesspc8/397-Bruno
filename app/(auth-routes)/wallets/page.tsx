import { getAuthSession } from "@/app/_lib/auth";
import { redirect } from "next/navigation";
import { WalletsPageClient } from "./_components/wallets-page-client";
import { db } from "@/app/_lib/db";
import { headers } from "next/headers";

export default async function WalletsPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/auth");
  }

  try {
    console.log("[WALLETS_PAGE] Buscando carteiras através da API com recálculo de saldos");
    
    // Em Server Components, precisamos usar URLs absolutas
    // Obtendo a URL base atual da solicitação
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = headers().get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    
    // Buscar carteiras através da API para garantir consistência com outras partes da aplicação
    const response = await fetch(`${baseUrl}/api/wallets?recalculateBalances=true`, {
      next: { revalidate: 0 }, // Não armazenar em cache, sempre revalidar
      headers: {
        Cookie: `${headers().get('cookie') || ''}`
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar carteiras: ${response.status}`);
    }
    
    const data = await response.json();
    const wallets = data.wallets || [];
    const totalBalance = data.totalBalance || 0;
    const stats = data.stats || getDefaultStats();
    
    console.log(`[WALLETS_PAGE] Total de carteiras: ${wallets.length}, Saldo total: ${totalBalance}`);

    // Buscar os bancos para exibição
    const banks = await db.bank.findMany({
      orderBy: {
        name: "asc",
      },
    });

    // Passar todos os dados para o componente cliente
    return (
      <WalletsPageClient 
        totalBalance={totalBalance}
        wallets={wallets as any[]}
        banks={banks as any[]}
        stats={stats}
      />
    );
  } catch (error) {
    console.error("[WALLETS_PAGE] Erro ao buscar carteiras:", error);
    
    // Em caso de erro crítico, retorne valores vazios, mas válidos
    return (
      <WalletsPageClient 
        totalBalance={0}
        wallets={[]}
        banks={[]}
        stats={getDefaultStats()}
      />
    );
  }
}

// Função para obter estatísticas padrão
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