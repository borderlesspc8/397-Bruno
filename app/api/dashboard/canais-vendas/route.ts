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

    // Buscar dados de vendas diretamente
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const vendasUrl = `${baseUrl}/api/dashboard/vendas?dataInicio=${dataInicio}&dataFim=${dataFim}`;
    
    console.log('🔍 [CanaisVendas API] Buscando vendas em:', vendasUrl);
    
    const vendasResponse = await fetch(vendasUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    if (!vendasResponse.ok) {
      const errorText = await vendasResponse.text();
      console.error('Erro ao buscar vendas:', errorText);
      throw new Error(`Erro ao buscar vendas: ${vendasResponse.status} - ${errorText}`);
    }

    const vendasData = await vendasResponse.json();
    const vendas = vendasData.vendas || [];
    
    console.log(`📊 [CanaisVendas API] Total de vendas recebidas: ${vendas.length}`);
    console.log(`📊 [CanaisVendas API] Estrutura da resposta:`, {
      temVendas: !!vendasData.vendas,
      quantidadeVendas: vendasData.vendas?.length || 0,
      chavesDisponiveis: Object.keys(vendasData)
    });
    
    // Debug: verificar estrutura da primeira venda
    if (vendas.length > 0) {
      const primeiraVenda = vendas[0];
      console.log('Estrutura da primeira venda:', {
        id: primeiraVenda.id,
        cliente: primeiraVenda.cliente,
        nome_canal_venda: primeiraVenda.nome_canal_venda,
        temAtributos: !!primeiraVenda.atributos,
        quantidadeAtributos: primeiraVenda.atributos?.length || 0
      });
    }

    // Filtrar apenas vendas com status válidos, igual à implementação da rota de vendas
    const statusValidos = ["Concretizada", "Em Aberto", "Em andamento"];
    const vendasFiltradas = vendas.filter((venda: any) => statusValidos.includes(venda.nome_situacao));
    
    console.log(`📊 [CanaisVendas API] Vendas filtradas: ${vendasFiltradas.length} de ${vendas.length}`);

    // Processar os dados para agrupar por canal de venda e por unidade
    const unidadesMap = new Map();
    
    // Mapa consolidado para todos os canais
    const canaisConsolidados = new Map();
    let totalConsolidado = 0;

    // Primeiro, identificar todas as unidades disponíveis
    vendasFiltradas.forEach((venda: any) => {
      const lojaId = venda.loja_id;
      const nomeLoja = venda.nome_loja;

      if (!unidadesMap.has(lojaId)) {
        unidadesMap.set(lojaId, {
          id: lojaId,
          nome: nomeLoja,
          canais: new Map(),
          total: 0
        });
      }
    });

    // Processar os dados de canal por unidade
    vendasFiltradas.forEach((venda: any) => {
      const lojaId = venda.loja_id;
      const unidade = unidadesMap.get(lojaId);
      
      // Buscar o canal de venda
      let canal = "Não informado";
      
      if (venda.nome_canal_venda) {
        canal = venda.nome_canal_venda;
      }
      
      // Fallback: tentar outros campos que podem conter o canal
      if (canal === "Não informado") {
        // Verificar se há outros campos que podem indicar canal
        if (venda.canal_venda) {
          canal = venda.canal_venda;
        } else if (venda.canal) {
          canal = venda.canal;
        } else if (venda.origem) {
          canal = venda.origem;
        }
      }
      
      // Incrementar contagem para este canal na unidade
      if (!unidade.canais.has(canal)) {
        unidade.canais.set(canal, { canal, quantidade: 0 });
      }
      unidade.canais.get(canal).quantidade += 1;
      unidade.total += 1;
      
      // Incrementar contagem consolidada
      if (!canaisConsolidados.has(canal)) {
        canaisConsolidados.set(canal, { canal, quantidade: 0 });
      }
      canaisConsolidados.get(canal).quantidade += 1;
      totalConsolidado += 1;
    });

    // Converter para o formato final esperado pelo componente
    const unidadesData = Array.from(unidadesMap.values()).map((unidade: any) => {
      // Converter o Map de canais para array
      const canaisArray = Array.from(unidade.canais.values());
      
      // Calcular percentuais
      canaisArray.forEach((canal: any) => {
        canal.percentual = unidade.total > 0 ? canal.quantidade / unidade.total : 0;
      });
      
      // Ordenar por quantidade (maior para menor)
      canaisArray.sort((a: any, b: any) => b.quantidade - a.quantidade);
      
      return {
        id: unidade.id,
        nome: unidade.nome,
        canais: canaisArray,
        total: unidade.total
      };
    });

    // Ordenar unidades por total (maior para menor)
    unidadesData.sort((a, b) => b.total - a.total);
    
    // Criar objeto consolidado
    const canaisConsolidadosArray = Array.from(canaisConsolidados.values());
    
    // Calcular percentuais para canais consolidados
    canaisConsolidadosArray.forEach((canal: any) => {
      canal.percentual = totalConsolidado > 0 ? canal.quantidade / totalConsolidado : 0;
    });
    
    // Ordenar canais consolidados por quantidade (maior para menor)
    canaisConsolidadosArray.sort((a, b) => b.quantidade - a.quantidade);
    
    console.log(`📊 [CanaisVendas API] Canais consolidados encontrados:`, {
      totalCanais: canaisConsolidadosArray.length,
      totalVendas: totalConsolidado,
      top5: canaisConsolidadosArray.slice(0, 5).map(c => ({ canal: c.canal, quantidade: c.quantidade }))
    });
    
    // Adicionar item consolidado ao início da lista
    unidadesData.unshift({
      id: "todos",
      nome: "Todas as Unidades",
      canais: canaisConsolidadosArray,
      total: totalConsolidado
    });

    console.log(`📊 [CanaisVendas API] Retornando dados:`, {
      totalUnidades: unidadesData.length,
      unidadeConsolidada: unidadesData.find(u => u.id === "todos")?.total || 0
    });

    return NextResponse.json({
      dashboard: {
        canalVendasPorUnidade: unidadesData
      }
    });
  } catch (error) {
    console.error("Erro ao processar dados de canais de vendas por unidade:", error);
    return NextResponse.json(
      { error: "Erro ao processar dados" },
      { status: 500 }
    );
  }
}
