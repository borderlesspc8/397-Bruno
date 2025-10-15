import { redirect } from "next/navigation";
import { getAuthSession } from "@/app/_lib/auth";
import { DREPageClient } from "./_components/dre-page-client";
import { prisma } from "@/app/_lib/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Página de Demonstrativo de Resultado do Exercício (DRE)
 * 
 * Exibe relatórios financeiros consolidados, permitindo análise de receitas,
 * despesas e resultados por categorias, centros de custo e períodos.
 */
export default async function DRE({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Verificar autenticação
  const { user } = await getAuthSession();
  
  if (!user) {
    return redirect("/login");
  }

  // Extrair parâmetros da URL
  const period = searchParams.period?.toString() || "month";
  const dateParam = searchParams.date?.toString() || format(new Date(), "yyyy-MM-dd");
  const includeEstimates = searchParams.includeEstimates === "true";
  const compareWithPrevious = searchParams.compareWithPrevious === "true";
  const includeGestaoClick = searchParams.includeGestaoClick !== "false"; // default: true
  
  // Verificar integração com Gestão Click
  const hasGestaoClickIntegration = await checkGestaoClickIntegration(user.id);
  
  // Obter carteiras para filtros
  const wallets = await prisma.wallet.findMany({
    where: {
      userId: user.id,
      isActive: true,
      type: { not: "EXTERNAL_INTEGRATION" }
    },
    select: {
      id: true,
      name: true,
      type: true
    },
    orderBy: { name: "asc" }
  });
  
  // Obter centros de custo para filtros
  const costCenters = await prisma.costCenter.findMany({
    where: { 
      userId: user.id,
      active: true
    },
    select: {
      id: true,
      name: true
    },
    orderBy: { name: "asc" }
  });

  return (
    <DREPageClient
      period={period}
      date={dateParam}
      includeEstimates={includeEstimates}
      compareWithPrevious={compareWithPrevious}
      includeGestaoClick={includeGestaoClick}
      hasGestaoClickIntegration={hasGestaoClickIntegration}
      wallets={wallets}
      costCenters={costCenters}
    />
  );
}

/**
 * Verifica se o usuário tem integração com o Gestão Click configurada
 */
async function checkGestaoClickIntegration(userId: string): Promise<boolean> {
  // Verificar se há configurações de integração salvas
  const settingsCount = await prisma.wallet.count({
    where: {
      userId,
      name: "GESTAO_CLICK_GLOBAL",
      type: "EXTERNAL_INTEGRATION"
    }
  });

  return settingsCount > 0;
} 
