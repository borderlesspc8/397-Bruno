import { NextResponse } from 'next/server';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';

/**
 * Endpoint para diagnóstico da conexão com a API externa
 * Útil para verificar problemas de autenticação e configuração
 */
export async function GET() {
  try {
    console.log('Iniciando diagnóstico da API externa...');
    
    // Testar conexão com a API
    const resultadoTeste = await BetelTecnologiaService.testarConexaoAPI();
    
    // Tentar buscar uma venda para verificar os campos
    let estruturaVenda = null;
    let erro = null;
    
    try {
      // Buscar vendas dos últimos 30 dias para ter uma amostra
      const hoje = new Date();
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - 30);
      
      const vendasResult = await BetelTecnologiaService.buscarVendas({
        dataInicio,
        dataFim: hoje
      });
      
      if (vendasResult.vendas && vendasResult.vendas.length > 0) {
        // Extrair apenas os nomes dos campos presentes na primeira venda, para não expor dados sensíveis
        estruturaVenda = {
          campos_disponiveis: Object.keys(vendasResult.vendas[0]),
          tem_vendedor_id: vendasResult.vendas[0].hasOwnProperty('vendedor_id'),
          tem_vendedor_nome: vendasResult.vendas[0].hasOwnProperty('vendedor_nome'),
          tem_nome_vendedor: vendasResult.vendas[0].hasOwnProperty('nome_vendedor')
        };
      } else {
        estruturaVenda = { aviso: "Nenhuma venda encontrada para análise de estrutura" };
      }
    } catch (e) {
      erro = e instanceof Error ? e.message : String(e);
    }
    
    // Obter informações sobre as variáveis de ambiente (sem expor valores completos)
    const infoVariaveis = {
      API_URL: process.env.GESTAO_CLICK_API_URL ? 'Configurada' : 'Não configurada',
      ACCESS_TOKEN: process.env.GESTAO_CLICK_ACCESS_TOKEN 
        ? `Configurado (${process.env.GESTAO_CLICK_ACCESS_TOKEN.substring(0, 5)}...)` 
        : 'Não configurado',
      SECRET_TOKEN: process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN 
        ? `Configurado (${process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN.substring(0, 5)}...)` 
        : 'Não configurado',
    };
    
    // Resposta com o diagnóstico
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      conexao: resultadoTeste,
      estrutura_venda: estruturaVenda,
      erro_analise: erro,
      ambiente: infoVariaveis,
      node_env: process.env.NODE_ENV,
    });
    
  } catch (error) {
    console.error('Erro ao executar diagnóstico:', error);
    return NextResponse.json(
      { 
        timestamp: new Date().toISOString(),
        erro: 'Erro ao executar diagnóstico de conexão',
        detalhes: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 
