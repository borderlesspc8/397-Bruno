/**
 * 🔌 CEO DASHBOARD - PROXY PARA /pagamentos
 * 
 * ✅ ISOLADO - Não afeta outros dashboards
 * ✅ Usa BetelTecnologiaService (que funciona)
 */

import { NextRequest, NextResponse } from 'next/server';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');
    
    if (!dataInicio || !dataFim) {
      return NextResponse.json({ error: 'data_inicio e data_fim são obrigatórios' }, { status: 400 });
    }
    
    // Implementar paginação para garantir que todos os pagamentos sejam capturados
    let todosPagamentos: any[] = [];
    let paginaAtual = 1;
    let temMaisPaginas = true;
    const limitePorPagina = 500;
    const maxPaginas = 10; // Máximo de 10 páginas = 5000 pagamentos
    
    while (temMaisPaginas && paginaAtual <= maxPaginas) {
      const url = `/pagamentos?data_inicio=${dataInicio}&data_fim=${dataFim}&page=${paginaAtual}&limit=${limitePorPagina}`;
      
      // @ts-ignore - Usar método interno do BetelTecnologiaService
      const result = await BetelTecnologiaService.fetchWithRetry(url);
      
      if (result.error) {
        console.error(`[CEO-API-Pagamentos] Erro ao buscar página ${paginaAtual}:`, result.error);
        break;
      }
      
      const pagamentosPagina = result.data?.data || result.data || [];
      todosPagamentos = [...todosPagamentos, ...pagamentosPagina];
      
      console.log(`[CEO-API-Pagamentos] Página ${paginaAtual}: ${pagamentosPagina.length} pagamentos (Total: ${todosPagamentos.length})`);
      
      // Verificar se há mais páginas
      if (result.data?.meta) {
        const { proxima_pagina, total_paginas } = result.data.meta;
        if (proxima_pagina && paginaAtual < total_paginas) {
          paginaAtual++;
        } else {
          temMaisPaginas = false;
        }
      } else {
        // Se não há metadados de paginação e retornou menos que o limite, é a última página
        if (pagamentosPagina.length < limitePorPagina) {
          temMaisPaginas = false;
        } else {
          // Se retornou exatamente o limite, pode haver mais páginas
          paginaAtual++;
        }
      }
      
      // Pequena pausa para não sobrecarregar a API
      if (temMaisPaginas) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`[CEO-API-Pagamentos] Total de ${todosPagamentos.length} pagamentos encontrados (${paginaAtual - 1} página(s))`);
    
    return NextResponse.json({ data: todosPagamentos });
    
  } catch (error: any) {
    console.error('[CEO-API-Pagamentos] Erro:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro ao buscar pagamentos',
      data: []
    }, { status: 500 });
  }
}




