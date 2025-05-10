import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";

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

    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Buscar dados de vendas diretamente
    const vendasResponse = await fetch(
      `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/vendas?dataInicio=${dataInicio}&dataFim=${dataFim}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        }
      }
    );

    if (!vendasResponse.ok) {
      throw new Error(`Erro ao buscar vendas: ${vendasResponse.status}`);
    }

    const vendasData = await vendasResponse.json();
    const vendas = vendasData.vendas || [];

    // Filtrar apenas vendas com status válidos, igual à implementação da rota de vendas
    const statusValidos = ["Concretizada", "Em Aberto", "Em andamento"];
    const vendasFiltradas = vendas.filter((venda: any) => statusValidos.includes(venda.nome_situacao));

    // Processar os dados para agrupar por origem "Como nos conheceu" e por unidade
    const unidadesMap = new Map();
    
    // Mapa consolidado para todas as origens
    const origensConsolidadas = new Map();
    let totalConsolidado = 0;

    // Primeiro, identificar todas as unidades disponíveis
    vendasFiltradas.forEach((venda: any) => {
      const lojaId = venda.loja_id;
      const nomeLoja = venda.nome_loja;

      if (!unidadesMap.has(lojaId)) {
        unidadesMap.set(lojaId, {
          id: lojaId,
          nome: nomeLoja,
          origens: new Map(),
          total: 0
        });
      }
    });

    // Processar os dados de origem por unidade
    vendasFiltradas.forEach((venda: any) => {
      const lojaId = venda.loja_id;
      const unidade = unidadesMap.get(lojaId);
      
      // Buscar o atributo "Como nos conheceu"
      const comoNosConheceuAtributo = venda.atributos?.find(
        (atr: any) => atr.atributo.descricao === "Como nos conheceu"
      );
      
      // Obter a origem ou usar "Não informado" se não tiver o atributo
      const origem = comoNosConheceuAtributo ? comoNosConheceuAtributo.atributo.conteudo : "Não informado";
      
      // Incrementar contagem para esta origem na unidade
      if (!unidade.origens.has(origem)) {
        unidade.origens.set(origem, { origem, quantidade: 0 });
      }
      unidade.origens.get(origem).quantidade += 1;
      unidade.total += 1;
      
      // Incrementar contagem consolidada
      if (!origensConsolidadas.has(origem)) {
        origensConsolidadas.set(origem, { origem, quantidade: 0 });
      }
      origensConsolidadas.get(origem).quantidade += 1;
      totalConsolidado += 1;
    });

    // Converter para o formato final esperado pelo componente
    const unidadesData = Array.from(unidadesMap.values()).map((unidade: any) => {
      // Converter o Map de origens para array
      const origensArray = Array.from(unidade.origens.values());
      
      // Calcular percentuais
      origensArray.forEach((origem: any) => {
        origem.percentual = unidade.total > 0 ? origem.quantidade / unidade.total : 0;
      });
      
      // Ordenar por quantidade (maior para menor)
      origensArray.sort((a: any, b: any) => b.quantidade - a.quantidade);
      
      return {
        id: unidade.id,
        nome: unidade.nome,
        origens: origensArray,
        total: unidade.total
      };
    });

    // Ordenar unidades por total (maior para menor)
    unidadesData.sort((a, b) => b.total - a.total);
    
    // Criar objeto consolidado
    const origensConsolidadasArray = Array.from(origensConsolidadas.values());
    
    // Calcular percentuais para origens consolidadas
    origensConsolidadasArray.forEach((origem: any) => {
      origem.percentual = totalConsolidado > 0 ? origem.quantidade / totalConsolidado : 0;
    });
    
    // Ordenar origens consolidadas por quantidade (maior para menor)
    origensConsolidadasArray.sort((a: any, b: any) => b.quantidade - a.quantidade);
    
    // Adicionar item consolidado ao início da lista
    unidadesData.unshift({
      id: "todos",
      nome: "Todas as Unidades",
      origens: origensConsolidadasArray,
      total: totalConsolidado
    });

    return NextResponse.json({
      dashboard: {
        origemLeadsPorUnidade: unidadesData
      }
    });
  } catch (error) {
    console.error("Erro ao processar dados de origens por unidade:", error);
    return NextResponse.json(
      { error: "Erro ao processar dados" },
      { status: 500 }
    );
  }
} 
