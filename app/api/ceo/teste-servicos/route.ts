/**
 * 🧪 TESTE DOS SERVIÇOS - Diagnóstico Real
 * 
 * Testa CADA PASSO individualmente para encontrar onde quebra
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const logs: string[] = [];
  const errors: any[] = [];
  
  try {
    logs.push('✅ Rota acessada com sucesso');
    
    // TESTE 1: Importar BetelCompleteAPIService
    try {
      const { default: BetelCompleteAPIService } = await import(
        '@/app/(auth-routes)/dashboard/ceo/_services/betel-complete-api.service'
      );
      logs.push('✅ BetelCompleteAPIService importado');
      
      // TESTE 2: Chamar a API (apenas vendas para teste)
      try {
        const hoje = new Date();
        const dataFim = hoje;
        const dataInicio = new Date(hoje.getFullYear(), 0, 1);
        
        logs.push(`📅 Período: ${dataInicio.toISOString().split('T')[0]} a ${dataFim.toISOString().split('T')[0]}`);
        
        const dados = await BetelCompleteAPIService.buscarTodosDados(dataInicio, dataFim);
        
        logs.push(`✅ BetelCompleteAPIService.buscarTodosDados() executado`);
        logs.push(`📊 Vendas retornadas: ${dados.vendas?.length || 0}`);
        logs.push(`📊 Pagamentos retornados: ${dados.pagamentos?.length || 0}`);
        logs.push(`📊 Recebimentos retornados: ${dados.recebimentos?.length || 0}`);
        logs.push(`📊 Centros de Custo retornados: ${dados.centrosCustos?.length || 0}`);
        
        // TESTE 3: Importar CEOIndicadoresService
        try {
          const { default: CEOIndicadoresService } = await import(
            '@/app/(auth-routes)/dashboard/ceo/_services/ceo-indicadores.service'
          );
          logs.push('✅ CEOIndicadoresService importado');
          
          // TESTE 4: Calcular indicadores
          try {
            const indicadores = CEOIndicadoresService.calcularTodosIndicadores(dados);
            logs.push('✅ CEOIndicadoresService.calcularTodosIndicadores() executado');
            logs.push(`💰 DRE Receita Bruta: R$ ${indicadores.dre.receitaBruta.toFixed(2)}`);
            logs.push(`💰 DRE Lucro Líquido: R$ ${indicadores.dre.lucroLiquido.toFixed(2)}`);
            logs.push(`💧 Liquidez Corrente: ${indicadores.liquidez.liquidezCorrente.toFixed(2)}`);
            logs.push(`📛 Taxa Inadimplência: ${indicadores.inadimplencia.taxaInadimplencia.toFixed(1)}%`);
            logs.push(`🏦 Centros de Custo na rentabilidade: ${indicadores.eficienciaOperacional.rentabilidadePorCentroCusto.length}`);
            
            return NextResponse.json({
              success: true,
              status: 'TUDO FUNCIONANDO! 🎉',
              logs,
              resumo: {
                vendasBuscadas: dados.vendas?.length || 0,
                pagamentosBuscados: dados.pagamentos?.length || 0,
                centrosCustoBuscados: dados.centrosCustos?.length || 0,
                dreReceitaBruta: indicadores.dre.receitaBruta,
                dreLucroLiquido: indicadores.dre.lucroLiquido,
                liquidezCorrente: indicadores.liquidez.liquidezCorrente,
                taxaInadimplencia: indicadores.inadimplencia.taxaInadimplencia,
                centrosCustoNaRentabilidade: indicadores.eficienciaOperacional.rentabilidadePorCentroCusto.length,
              },
            });
          } catch (error) {
            logs.push('❌ ERRO ao calcular indicadores');
            errors.push({
              passo: 'Calcular Indicadores',
              erro: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            });
          }
        } catch (error) {
          logs.push('❌ ERRO ao importar CEOIndicadoresService');
          errors.push({
            passo: 'Importar CEOIndicadoresService',
            erro: error instanceof Error ? error.message : String(error),
          });
        }
      } catch (error) {
        logs.push('❌ ERRO ao buscar dados das APIs');
        errors.push({
          passo: 'Buscar Dados APIs',
          erro: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    } catch (error) {
      logs.push('❌ ERRO ao importar BetelCompleteAPIService');
      errors.push({
        passo: 'Importar BetelCompleteAPIService',
        erro: error instanceof Error ? error.message : String(error),
      });
    }
    
    // Se chegou aqui, algo deu errado
    return NextResponse.json({
      success: false,
      status: 'ERRO ENCONTRADO',
      logs,
      errors,
      credenciais: {
        apiUrl: process.env.GESTAO_CLICK_API_URL,
        temAccessToken: !!process.env.GESTAO_CLICK_ACCESS_TOKEN,
        temSecretToken: !!process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN,
      },
    }, { status: 500 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      status: 'ERRO GERAL',
      logs,
      erro: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

