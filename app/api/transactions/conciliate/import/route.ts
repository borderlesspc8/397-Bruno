import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { GestaoClickClientService } from "@/app/_services/gestao-click-client-service";
import { ReconciliationService } from "@/app/_services/reconciliation-service";
import { parseISO } from "date-fns";
import { importVendasToDatabase } from "@/app/_services/gestao-click-client-service-updated";

// Marcar como rota dinâmica
export const dynamic = "force-dynamic";

/**
 * POST /api/transactions/conciliate/import
 * Importa vendas do Gestão Click para o banco de dados para conciliação
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Extrair dados do request
    const data = await req.json();
    const { startDate, endDate, situationId, autoReconcile = false } = data;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Datas de início e fim são obrigatórias" },
        { status: 400 }
      );
    }

    // Configurar o serviço do Gestão Click
    const accessToken = process.env.GESTAO_CLICK_ACCESS_TOKEN || '';
    const secretAccessToken = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || '';
    const apiUrl = process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';

    if (!accessToken) {
      return NextResponse.json(
        { error: "Credenciais do Gestão Click não configuradas" },
        { status: 500 }
      );
    }

    // Inicializar o serviço
    const gestaoClickService = new GestaoClickClientService({
      apiKey: accessToken,
      secretToken: secretAccessToken,
      apiUrl,
      userId: session.user.id,
    });

    // Definir filtros para a importação
    const filtros: any = {};
    if (situationId) {
      filtros.situacao_id = situationId;
    } else {
      // Buscar IDs das situações "Atrasado" e "Confirmado"
      try {
        const situacoes = await gestaoClickService.getSituacoesVendas();
        const situacoesRelevantes = situacoes.data.filter(s => 
          s.nome.toLowerCase() === "atrasado" || 
          s.nome.toLowerCase() === "confirmado" ||
          s.nome.toLowerCase() === "atrasada" || 
          s.nome.toLowerCase() === "confirmada"
        );
        
        if (situacoesRelevantes.length > 0) {
          // Obter os IDs das situações relevantes
          const ids = situacoesRelevantes.map(s => s.id);
          console.log(`[DEBUG] Importando situações específicas: ${JSON.stringify(situacoesRelevantes.map(s => s.nome))}`);
          filtros.situacao_id = ids.join(',');
        }
      } catch (error) {
        console.warn("[WARNING] Não foi possível obter situações de vendas, continuando sem filtro:", error);
      }
    }

    // Buscar vendas do Gestão Click
    console.log(`[DEBUG] Iniciando busca de vendas de ${startDate} até ${endDate}`);
    
    let vendas;
    try {
      // Configurar filtros com as datas
      const vendaFiltros = {
        ...filtros,
        data_inicio: startDate,
        data_fim: endDate
      };
      
      // Chamar a API para obter as vendas
      vendas = await gestaoClickService.getAllVendas(vendaFiltros);
      console.log(`[DEBUG] Encontradas ${vendas.length} vendas do Gestão Click`);
    } catch (apiError) {
      console.error("[ERROR] Erro ao buscar vendas do Gestão Click:", apiError);
      return NextResponse.json(
        { 
          error: "Erro ao buscar vendas do Gestão Click", 
          details: apiError instanceof Error ? apiError.message : String(apiError)
        },
        { status: 500 }
      );
    }
    
    // Importar vendas para o banco de dados
    let importResult;
    try {
      console.log(`[DEBUG] Iniciando importação de ${vendas.length} vendas para o banco de dados`);
      importResult = await importVendasToDatabase(session.user.id, vendas);
      console.log(`[DEBUG] Resultado da importação:`, JSON.stringify(importResult));
    } catch (importError) {
      console.error("[ERROR] Erro detalhado na importação:", importError);
      return NextResponse.json(
        { 
          error: "Erro ao importar vendas", 
          details: importError instanceof Error ? importError.message : String(importError),
          stack: importError instanceof Error ? importError.stack : undefined
        },
        { status: 500 }
      );
    }

    // Se autoReconcile estiver habilitado, executar a reconciliação automática
    let reconciliationResult = null;
    if (autoReconcile && importResult.imported > 0) {
      try {
        reconciliationResult = await ReconciliationService.reconcileSalesAndTransactions({
          userId: session.user.id,
          startDate: parseISO(startDate),
          endDate: parseISO(endDate),
        });
      } catch (error) {
        console.error("Erro na reconciliação automática:", error);
      }
    }

    return NextResponse.json({
      message: "Importação concluída com sucesso",
      result: {
        imported: importResult.imported,
        skipped: importResult.skipped,
        errors: importResult.errors,
        details: importResult.details,
      },
      reconciliation: reconciliationResult
    });
  } catch (error) {
    console.error("Erro ao importar vendas:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisição", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 