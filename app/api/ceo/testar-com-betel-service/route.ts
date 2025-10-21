/**
 * 🧪 TESTAR APIS USANDO O SERVIÇO QUE JÁ FUNCIONA
 * 
 * Acesse: http://localhost:3000/api/ceo/testar-com-betel-service
 * 
 * Este teste usa o MESMO serviço que o dashboard de vendas (que funciona)
 */

import { NextResponse } from 'next/server';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  
  console.log('\n========================================');
  console.log('🧪 TESTANDO APIS COM BetelTecnologiaService');
  console.log('========================================\n');
  
  const resultados: any = {
    info: 'Usando o MESMO serviço que os dashboards de vendas/vendedores (que funcionam)',
    apis: {},
  };
  
  // 1. TESTAR VENDAS (sabemos que funciona)
  try {
    console.log('📊 1. Testando /vendas (endpoint que funciona)...');
    const vendas = await BetelTecnologiaService.buscarVendas({
      dataInicio: inicioMes,
      dataFim: fimMes,
    });
    
    console.log(`✅ Vendas: ${vendas.vendas?.length || 0} registros`);
    
    resultados.apis.vendas = {
      sucesso: true,
      total: vendas.vendas?.length || 0,
      exemplo: vendas.vendas?.[0] || null,
      campos_venda: vendas.vendas?.[0] ? Object.keys(vendas.vendas[0]) : [],
    };
  } catch (error: any) {
    console.log('❌ Erro em vendas:', error.message);
    resultados.apis.vendas = {
      sucesso: false,
      erro: error.message,
    };
  }
  
  // 2. TESTAR SE A CLASSE TEM MÉTODOS PARA OUTRAS APIS
  console.log('\n📋 2. Verificando métodos disponíveis em BetelTecnologiaService...');
  
  const metodosDisponiveis = Object.getOwnPropertyNames(BetelTecnologiaService)
    .filter(name => typeof (BetelTecnologiaService as any)[name] === 'function')
    .filter(name => !name.startsWith('_') && name !== 'constructor');
  
  console.log('Métodos públicos:', metodosDisponiveis.join(', '));
  
  resultados.metodos_disponiveis = metodosDisponiveis;
  
  // 3. VERIFICAR SE EXISTEM MÉTODOS PARA PAGAMENTOS/RECEBIMENTOS
  const temPagamentos = metodosDisponiveis.some(m => m.toLowerCase().includes('pagamento'));
  const temRecebimentos = metodosDisponiveis.some(m => m.toLowerCase().includes('recebimento'));
  const temCentrosCusto = metodosDisponiveis.some(m => m.toLowerCase().includes('centro'));
  
  console.log('\n🔍 APIs específicas:');
  console.log('- buscarPagamentos:', temPagamentos ? '✅ EXISTE' : '❌ NÃO EXISTE');
  console.log('- buscarRecebimentos:', temRecebimentos ? '✅ EXISTE' : '❌ NÃO EXISTE');
  console.log('- buscarCentrosCusto:', temCentrosCusto ? '✅ EXISTE' : '❌ NÃO EXISTE');
  
  resultados.apis_especificas = {
    pagamentos: temPagamentos,
    recebimentos: temRecebimentos,
    centros_custo: temCentrosCusto,
  };
  
  // 4. SE VENDAS FUNCIONOU, VERIFICAR ESTRUTURA DE DADOS
  if (resultados.apis.vendas?.sucesso && resultados.apis.vendas.exemplo) {
    console.log('\n📝 Analisando estrutura da venda...');
    const venda = resultados.apis.vendas.exemplo;
    
    resultados.analise_venda = {
      tem_centro_custo_id: 'centro_custo_id' in venda,
      tem_centro_custo_nome: 'centro_custo_nome' in venda,
      tem_metadata: 'metadata' in venda,
      centro_custo_em_metadata: venda.metadata?.centro_custo_id !== undefined,
      campos_relacionados_centro_custo: Object.keys(venda).filter(k => 
        k.toLowerCase().includes('centro') || k.toLowerCase().includes('custo')
      ),
      todos_campos: Object.keys(venda),
    };
  }
  
  console.log('\n========================================');
  console.log('✅ TESTE CONCLUÍDO');
  console.log('========================================\n');
  
  return NextResponse.json(resultados);
}


