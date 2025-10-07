import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/app/_utils/auth";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataInicio = searchParams.get("dataInicio") || "";
    const dataFim = searchParams.get("dataFim") || "";

    if (!dataInicio || !dataFim) {
      return NextResponse.json(
        { error: "Parâmetros dataInicio e dataFim são obrigatórios" },
        { status: 400 }
      );
    }

    // Autenticação é gerenciada pelo middleware
    // Removida validação manual para manter consistência com outras APIs

    console.log('🔍 [Origens Direct API] Buscando dados diretamente do Gestão Click');

    // Buscar dados diretamente do Gestão Click
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const gestaoClickUrl = `${baseUrl}/api/gestao-click/sync`;
    
    const gestaoClickResponse = await fetch(gestaoClickUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        dataInicio: `${dataInicio}T00:00:00.000Z`,
        dataFim: `${dataFim}T23:59:59.999Z`,
        userId: 'default' // Usar ID padrão já que não temos sessão
      })
    });

    if (!gestaoClickResponse.ok) {
      const errorText = await gestaoClickResponse.text();
      console.error('Erro ao buscar dados do Gestão Click:', errorText);
      throw new Error(`Erro ao buscar dados do Gestão Click: ${gestaoClickResponse.status} - ${errorText}`);
    }

    const gestaoClickData = await gestaoClickResponse.json();
    const vendas = gestaoClickData.vendas || [];
    
    console.log(`📊 [Origens Direct API] Total de vendas recebidas: ${vendas.length}`);

    // Filtrar apenas vendas com status válidos
    const statusValidos = ["Concretizada", "Em Aberto", "Em andamento"];
    const vendasFiltradas = vendas.filter((venda: any) => statusValidos.includes(venda.nome_situacao));
    
    console.log(`📊 [Origens Direct API] Vendas filtradas: ${vendasFiltradas.length} de ${vendas.length}`);

    // Processar os dados para agrupar por origem "Como nos conheceu"
    const origensMap = new Map();
    let totalLeads = 0;

    vendasFiltradas.forEach((venda: any) => {
      // Buscar o atributo "Como nos conheceu"
      let origem = "Não informado";
      
      if (venda.atributos && Array.isArray(venda.atributos)) {
        const comoNosConheceuAtributo = venda.atributos.find(
          (atr: any) => atr?.atributo?.descricao === "Como nos conheceu"
        );
        
        if (comoNosConheceuAtributo?.atributo?.conteudo) {
          origem = comoNosConheceuAtributo.atributo.conteudo;
        }
      }
      
      // Fallback: tentar outros campos que podem conter a origem
      if (origem === "Não informado") {
        if (venda.origem) {
          origem = venda.origem;
        } else if (venda.canal_venda) {
          origem = venda.canal_venda;
        } else if (venda.como_conheceu) {
          origem = venda.como_conheceu;
        }
      }
      
      // Incrementar contagem para esta origem
      if (!origensMap.has(origem)) {
        origensMap.set(origem, { origem, quantidade: 0 });
      }
      origensMap.get(origem).quantidade += 1;
      totalLeads += 1;
    });

    // Converter para array e calcular percentuais
    const origensArray = Array.from(origensMap.values());
    
    // Calcular percentuais
    origensArray.forEach((origem: any) => {
      origem.percentual = totalLeads > 0 ? origem.quantidade / totalLeads : 0;
    });
    
    // Ordenar por quantidade (maior para menor)
    origensArray.sort((a: any, b: any) => b.quantidade - a.quantidade);
    
    console.log(`📊 [Origens Direct API] Origens encontradas:`, {
      totalOrigens: origensArray.length,
      totalLeads,
      top5: origensArray.slice(0, 5).map(o => ({ origem: o.origem, quantidade: o.quantidade }))
    });

    return NextResponse.json({
      dashboard: {
        origemLeadsPorUnidade: [{
          id: "todos",
          nome: "Todas as Unidades",
          origens: origensArray,
          total: totalLeads
        }]
      }
    });
  } catch (error) {
    console.error("Erro ao processar dados de origens (direct):", error);
    return NextResponse.json(
      { error: "Erro ao processar dados" },
      { status: 500 }
    );
  }
}

