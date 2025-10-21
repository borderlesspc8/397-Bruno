/**
 * 🔍 API DE DIAGNÓSTICO - VER DADOS REAIS
 * 
 * ⚠️ ESTA ROTA É 100% ISOLADA E SEGURA:
 * ✅ APENAS LÊ dados (não modifica nada)
 * ✅ NÃO afeta dashboard de vendas
 * ✅ NÃO afeta dashboard de vendedores
 * ✅ NÃO afeta dashboard de produtos
 * ✅ NÃO modifica cache de outros dashboards
 * ✅ Usa apenas serviços do CEO Dashboard
 * 
 * Acesse: http://localhost:3000/api/ceo/diagnostico
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { GestaoClickSupabaseService } from '@/app/_services/gestao-click-supabase';
import GestaoClickAPIService from '@/app/(auth-routes)/dashboard/ceo/_services/gestao-click-api.service';

export async function GET() {
  try {
    console.log('========================================');
    console.log('🔍 DIAGNÓSTICO CEO - APENAS LEITURA');
    console.log('⚠️ ZERO MODIFICAÇÕES EM OUTROS DASHBOARDS');
    console.log('========================================\n');
    
    // ✅ Usar autenticação do Supabase (não NextAuth)
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json({ 
        error: 'Não autenticado',
        message: 'Você precisa estar logado para acessar o diagnóstico' 
      }, { status: 401 });
    }

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    console.log('🔍 DIAGNÓSTICO INICIADO');
    console.log('User ID:', user.id);
    console.log('User Email:', user.email);
    console.log('Período:', inicioMes.toISOString(), 'até', fimMes.toISOString());
    console.log('');

    // ============================================================
    // 1. BUSCAR VENDAS (APENAS LEITURA - forceUpdate: false)
    // ============================================================
    console.log('📊 1. Buscando vendas do Supabase...');
    const vendas = await GestaoClickSupabaseService.sincronizarVendas({
      dataInicio: inicioMes,
      dataFim: fimMes,
      userId: user.id,
      forceUpdate: false, // ✅ APENAS LEITURA
    });
    console.log(`✅ Total de vendas: ${vendas.vendas.length}`);
    console.log('');

    // ============================================================
    // 2. BUSCAR DADOS DAS APIS (APENAS LEITURA)
    // ============================================================
    console.log('💸 2. Buscando dados das APIs (pagamentos, recebimentos, etc)...');
    const apiData = await GestaoClickAPIService.buscarDadosComplementares({
      dataInicio: inicioMes,
      dataFim: fimMes,
      userId: user.id,
    });
    console.log(`✅ Pagamentos: ${apiData.pagamentos.length}`);
    console.log(`✅ Recebimentos: ${apiData.recebimentos.length}`);
    console.log(`✅ Centros de Custo: ${apiData.centrosCustos.length}`);
    console.log(`✅ Contas Bancárias: ${apiData.contasBancarias.length}`);
    console.log('');

    // ============================================================
    // 3. ANALISAR PAGAMENTOS (APENAS ANÁLISE - NÃO MODIFICA NADA)
    // ============================================================
    console.log('📊 3. Analisando pagamentos por centro de custo...');
    const pagamentosPagos = apiData.pagamentos.filter(p => p.liquidado === 'pg');
    console.log(`✅ Pagamentos efetivados (liquidado='pg'): ${pagamentosPagos.length}`);
    
    const porCentroCusto = new Map();
    pagamentosPagos.forEach(pag => {
      const ccId = pag.centro_custo_id;
      const ccNome = pag.centro_custo_nome || 'SEM NOME';
      
      if (!porCentroCusto.has(ccId)) {
        porCentroCusto.set(ccId, {
          id: ccId,
          nome: ccNome,
          total: 0,
          quantidade: 0,
          pagamentos: [],
        });
      }
      
      const cc = porCentroCusto.get(ccId);
      cc.total += parseFloat(pag.valor || '0');
      cc.quantidade += 1;
      cc.pagamentos.push({
        descricao: pag.descricao,
        valor: pag.valor,
        data_vencimento: pag.data_vencimento,
      });
    });

    const resumoPorCC = Array.from(porCentroCusto.values())
      .sort((a, b) => b.total - a.total);
    
    console.log(`✅ Centros de custo com movimentação: ${resumoPorCC.length}`);
    console.log('');
    
    if (resumoPorCC.length > 0) {
      console.log('📊 TOP 10 CENTROS DE CUSTO COM MAIS DESPESAS:');
      resumoPorCC.slice(0, 10).forEach((cc, index) => {
        console.log(`${index + 1}. ${cc.nome}: R$ ${cc.total.toFixed(2)} (${cc.quantidade} pagamentos)`);
      });
    } else {
      console.log('⚠️ NENHUM CENTRO DE CUSTO COM MOVIMENTAÇÃO');
    }
    
    console.log('');
    console.log('========================================');
    console.log('✅ DIAGNÓSTICO CONCLUÍDO');
    console.log('========================================');

    // ============================================================
    // 4. RETORNAR RESULTADO (JSON COMPLETO PARA ANÁLISE)
    // ============================================================
    return NextResponse.json({
      success: true,
      periodo: {
        inicio: inicioMes.toISOString(),
        fim: fimMes.toISOString(),
      },
      vendas: {
        total: vendas.vendas.length,
        valorTotal: vendas.totalValor,
        exemplo: vendas.vendas.length > 0 ? {
          id: vendas.vendas[0].id,
          valor_total: vendas.vendas[0].valor_total,
          valor_custo: vendas.vendas[0].valor_custo,
          metadata: vendas.vendas[0].metadata,
        } : null,
      },
      apis: {
        pagamentos: {
          total: apiData.pagamentos.length,
          pagos: pagamentosPagos.length,
          exemplos: apiData.pagamentos.slice(0, 5).map(p => ({
            descricao: p.descricao,
            valor: p.valor,
            centro_custo_id: p.centro_custo_id,
            centro_custo_nome: p.centro_custo_nome,
            liquidado: p.liquidado,
          })),
        },
        recebimentos: {
          total: apiData.recebimentos.length,
        },
        centrosCustos: {
          total: apiData.centrosCustos.length,
          lista: apiData.centrosCustos.map(cc => ({
            id: cc.id,
            nome: cc.nome,
            tipo: cc.tipo,
            ativo: cc.ativo,
          })),
        },
        contasBancarias: {
          total: apiData.contasBancarias.length,
          saldoTotal: apiData.contasBancarias.reduce((sum, cb) => sum + parseFloat(cb.saldo || '0'), 0),
        },
      },
      resumoPorCentroCusto: resumoPorCC,
      diagnostico: {
        temVendas: vendas.vendas.length > 0,
        temPagamentos: apiData.pagamentos.length > 0,
        temPagamentosPagos: pagamentosPagos.length > 0,
        temCentrosCustos: apiData.centrosCustos.length > 0,
        centrosCustosComMovimentacao: resumoPorCC.length,
      },
    });

  } catch (error) {
    console.error('❌ ERRO NO DIAGNÓSTICO:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

