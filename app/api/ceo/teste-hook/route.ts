/**
 * 🧪 TESTE DO HOOK - Ver o que está sendo retornado
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { default: CEODashboardService } = await import(
      '@/app/(auth-routes)/dashboard/ceo/_services/ceo-dashboard.service'
    );
    
    const hoje = new Date();
    const dataInicio = new Date(hoje.getFullYear(), 0, 1);
    const dataFim = hoje;
    
    const resultado = await CEODashboardService.buscarDadosCompletos({
      dataInicio,
      dataFim,
      userId: 'teste',
      forceUpdate: true,
    });
    
    // Verificar estrutura dos dados retornados
    const estrutura = {
      success: resultado.success,
      temData: !!resultado.data,
      temVisaoGeral: !!resultado.data?.visaoGeral,
      temIndicadoresFinanceiros: !!resultado.data?.indicadoresFinanceiros,
      temDadosBrutos: !!resultado.data?.dadosBrutos,
      temDadosBrutosBetel: !!resultado.data?.dadosBrutos?.betel,
      temDadosBrutosIndicadores: !!resultado.data?.dadosBrutos?.indicadores,
    };
    
    // Se tem dadosBrutos, mostrar resumo
    let resumoDadosBrutos = null;
    if (resultado.data?.dadosBrutos?.indicadores) {
      const ind = resultado.data.dadosBrutos.indicadores;
      resumoDadosBrutos = {
        temDRE: !!ind.dre,
        temLiquidez: !!ind.liquidez,
        temInadimplencia: !!ind.inadimplencia,
        temEficiencia: !!ind.eficienciaOperacional,
        temSazonalidade: !!ind.sazonalidade,
        
        // Valores
        dreReceitaBruta: ind.dre?.receitaBruta,
        dreLucroLiquido: ind.dre?.lucroLiquido,
        liquidezCorrente: ind.liquidez?.liquidezCorrente,
        taxaInadimplencia: ind.inadimplencia?.taxaInadimplencia,
        centrosCusto: ind.eficienciaOperacional?.rentabilidadePorCentroCusto?.length,
      };
    }
    
    // Estrutura de indicadoresFinanceiros
    let estruturaIndicadoresFinanceiros = null;
    if (resultado.data?.indicadoresFinanceiros) {
      estruturaIndicadoresFinanceiros = {
        temData: !!resultado.data.indicadoresFinanceiros.data,
        temEficienciaOperacional: !!resultado.data.indicadoresFinanceiros.data?.eficienciaOperacional,
        temLiquidez: !!resultado.data.indicadoresFinanceiros.data?.liquidez,
        temInadimplencia: !!resultado.data.indicadoresFinanceiros.data?.inadimplencia,
        temRentabilidade: !!resultado.data.indicadoresFinanceiros.data?.rentabilidadePorDimensao,
        centrosCusto: resultado.data.indicadoresFinanceiros.data?.rentabilidadePorDimensao?.porCentroCusto?.length,
      };
    }
    
    return NextResponse.json({
      success: true,
      estrutura,
      resumoDadosBrutos,
      estruturaIndicadoresFinanceiros,
      // Dados completos (pode ser grande)
      dadosCompletos: {
        visaoGeral: {
          temKPIs: !!resultado.data?.visaoGeral?.kpisPrincipais,
          temDRE: !!resultado.data?.visaoGeral?.dre,
          temAlertas: !!resultado.data?.visaoGeral?.alertasFinanceiros,
        },
      },
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      erro: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

