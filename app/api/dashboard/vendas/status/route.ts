import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/vendas/status
 * Retorna as situações/status disponíveis para filtrar vendas
 * Esta API não requer autenticação server-side pois é chamada do cliente
 */
export async function GET() {
  try {
    // Removida validação server-side - a autenticação é feita no cliente
    console.log("[API] Retornando situações de vendas sem validação server-side");

    // Situações padrão baseadas no sistema atual
    const situacoes = [
      {
        id: "concretizada",
        nome: "Concretizada",
        descricao: "Vendas concretizadas",
        cor: "success",
        ativa: true
      },
      {
        id: "em_andamento", 
        nome: "Em andamento",
        descricao: "Vendas em andamento",
        cor: "warning",
        ativa: true
      },
      {
        id: "cancelada",
        nome: "Cancelada", 
        descricao: "Vendas canceladas",
        cor: "destructive",
        ativa: true
      },
      {
        id: "pendente",
        nome: "Pendente",
        descricao: "Vendas pendentes",
        cor: "secondary", 
        ativa: true
      },
      {
        id: "aprovada",
        nome: "Aprovada",
        descricao: "Vendas aprovadas",
        cor: "success",
        ativa: true
      },
      {
        id: "rejeitada",
        nome: "Rejeitada", 
        descricao: "Vendas rejeitadas",
        cor: "destructive",
        ativa: true
      }
    ];

    return NextResponse.json({
      success: true,
      situacoes,
      total: situacoes.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar situações de vendas:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível buscar as situações de vendas'
      },
      { status: 500 }
    );
  }
} 
