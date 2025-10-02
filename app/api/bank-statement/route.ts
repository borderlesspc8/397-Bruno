/**
 * API para obter extrato bancário de uma carteira
 * Implementação baseada na API do Banco do Brasil (Swagger oficial)
 * Documentação: https://developers.bb.com.br/sandbox
 */

import { NextResponse } from "next/server";
import { BBIntegrationService } from "@/app/_lib/bb-integration";
import { createClient } from "@/app/_lib/supabase-server";
import { readFileSync } from "fs";
import { join } from "path";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


// Definir enum localmente se não estiver disponível
enum BankIntegrationProvider {
  BANCO_DO_BRASIL = "banco-do-brasil"
}

// Removendo a exportação duplicada
// export { dynamic, fetchCache, revalidate };

export async function GET(request: Request) {
  try {
    // Verificar autenticação do usuário
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter parâmetros da URL
    const url = new URL(request.url);
    const walletId = url.searchParams.get("walletId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const page = url.searchParams.get("page") || "1";
    const perPage = url.searchParams.get("perPage") || "50";

    // Validar parâmetros obrigatórios
    if (!walletId) {
      return NextResponse.json(
        { error: "ID da carteira é obrigatório" },
        { status: 400 }
      );
    }

    // Validar datas (formato YYYY-MM-DD)
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Data inicial e final são obrigatórias" },
        { status: 400 }
      );
    }

    // Validar formato das datas
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: "Formato de data inválido. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Validar e converter parâmetros de paginação
    const pageNumber = parseInt(page);
    let perPageNumber = parseInt(perPage);

    // Aplicar limitações da API do BB (mínimo 50, máximo 200)
    if (perPageNumber < 50) perPageNumber = 50;
    if (perPageNumber > 200) perPageNumber = 200;

    // Obter a carteira pelo ID
    const wallet = await prisma.wallet.findUnique({
      where: {
        id: walletId,
        userId: session.user.id,
      }
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Carteira não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se a carteira é do tipo bancário
    if (wallet.type !== "BANK_INTEGRATION") {
      return NextResponse.json(
        { error: "Esta carteira não possui integração bancária" },
        { status: 400 }
      );
    }

    // Obter os metadados da carteira
    const walletMetadata = wallet.metadata as Record<string, any>;
    
    if (!walletMetadata) {
      return NextResponse.json(
        { error: "Dados de integração bancária não encontrados" },
        { status: 400 }
      );
    }

    // Verificar credenciais necessárias
    const applicationKey = walletMetadata.applicationKey;
    const accessToken = walletMetadata.clientBasic;
    const agencia = walletMetadata.agencia;
    const conta = walletMetadata.conta;

    if (!applicationKey || !accessToken) {
      return NextResponse.json(
        { error: "Credenciais de API não configuradas" },
        { status: 400 }
      );
    }

    if (!agencia || !conta) {
      return NextResponse.json(
        { error: "Dados de agência ou conta não encontrados na carteira" },
        { status: 400 }
      );
    }

    // Converter datas para o formato exigido pelo Banco do Brasil (DDMMAAAA)
    const startParts = startDate.split("-");
    const endParts = endDate.split("-");
    
    const dataInicio = `${startParts[2]}${startParts[1]}${startParts[0]}`;
    const dataFim = `${endParts[2]}${endParts[1]}${endParts[0]}`;

    // Validar período de datas
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const today = new Date();
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(today.getFullYear() - 5);

    // Verificar se a data inicial não é mais antiga que 5 anos
    if (startDateObj < fiveYearsAgo) {
      return NextResponse.json(
        { error: "Data inicial não pode ser mais antiga que 5 anos" },
        { status: 400 }
      );
    }

    // Verificar se o período não é maior que 31 dias (limite do BB)
    const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 31) {
      return NextResponse.json(
        { error: "O período entre as datas não pode ser maior que 31 dias" },
        { status: 400 }
      );
    }

    // Chamar o serviço de integração com o BB
    const bbService = BBIntegrationService.getInstance();

    // DEBUG - Registrar parâmetros da chamada

    const extract = await bbService.getExtract(
      agencia,
      conta,
      accessToken,
      applicationKey,
      {
        dataInicio,
        dataFim,
        numeroPagina: pageNumber,
        quantidadeRegistros: perPageNumber,
        walletId: wallet.id
      }
    );

    // Formatar resposta
    return NextResponse.json({
      success: true,
      data: {
        transactions: extract.listaLancamento,
        pagination: {
          currentPage: pageNumber,
          itemsPerPage: perPageNumber,
          totalPages: extract.quantidadeTotalPagina,
          totalItems: extract.quantidadeTotalRegistro,
          previousPage: pageNumber > 1 ? pageNumber - 1 : null,
          nextPage: pageNumber < extract.quantidadeTotalPagina ? pageNumber + 1 : null
        }
      }
    });
  } catch (error) {
    console.error("[BANK_STATEMENT_ERROR]", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 
