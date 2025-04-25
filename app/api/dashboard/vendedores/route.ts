import { NextResponse } from 'next/server';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';
import { processarDatasURL } from '@/app/_utils/dates';
import { Vendedor } from '@/app/_services/betelTecnologia';

// Lista de vendedores fixos que devem sempre aparecer na listagem
// mesmo que não tenham vendas registradas no período
const VENDEDORES_FIXOS: Vendedor[] = [
  {
    id: 'marcos-vinicius',
    nome: 'Marcos Vinicius',
    vendas: 0,
    faturamento: 0,
    ticketMedio: 0
  }
  // Adicione outros vendedores fixos conforme necessário
];

/**
 * @api {get} /api/dashboard/vendedores Buscar vendedores
 * @apiDescription Endpoint para buscar dados de vendedores agrupados a partir das vendas na API externa
 * 
 * @apiNote Mapeamento de campos:
 * - `vendedor_id` da API externa para `id` no frontend
 * - `nome_vendedor` (ou `vendedor_nome` para retrocompatibilidade) da API externa para `nome` no frontend
 * 
 * @apiParam {String} dataInicio Data inicial no formato ISO ou dd/MM/yyyy
 * @apiParam {String} dataFim Data final no formato ISO ou dd/MM/yyyy
 * 
 * @apiSuccess {Object[]} vendedores Lista de vendedores
 * @apiSuccess {Number} totalVendedores Total de vendedores
 * @apiSuccess {Number} totalVendas Total de vendas
 * @apiSuccess {Number} totalFaturamento Total de faturamento
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    // Usar o utilitário para processar as datas
    const resultadoDatas = processarDatasURL(dataInicio, dataFim);
    
    // Se houve erro no processamento das datas
    if (!resultadoDatas.success) {
      return NextResponse.json(
        { 
          erro: resultadoDatas.error,
          vendedores: [],
          totalVendedores: 0,
          totalVendas: 0,
          totalFaturamento: 0
        },
        { status: 400 }
      );
    }

    console.log(`Buscando vendedores de ${resultadoDatas.dataInicio!.toISOString()} até ${resultadoDatas.dataFim!.toISOString()}`);

    // Chamar o serviço para buscar os vendedores
    console.log('Buscando vendedores...');
    const resultado = await BetelTecnologiaService.buscarVendedores({
      dataInicio: resultadoDatas.dataInicio!,
      dataFim: resultadoDatas.dataFim!
    });

    // Verificar erro
    if (resultado.erro) {
      console.warn('Erro no serviço:', resultado.erro);
      
      // Se o erro está relacionado a credenciais, retornar mensagem específica
      if (
        resultado.erro.includes('Token de acesso não configurado') || 
        resultado.erro.includes('Token secreto não configurado') ||
        resultado.erro.includes('credenciais inválidas')
      ) {
        return NextResponse.json(
          { 
            erro: 'É necessário configurar as credenciais da API externa. Entre em contato com o suporte.',
            vendedores: [],
            totalVendedores: 0,
            totalVendas: 0,
            totalFaturamento: 0
          },
          { status: 401 }
        );
      }
      
      // Outros erros
      return NextResponse.json(
        { 
          erro: `Erro ao buscar vendedores: ${resultado.erro}`,
          vendedores: [],
          totalVendedores: 0,
          totalVendas: 0,
          totalFaturamento: 0
        },
        { status: 500 }
      );
    }

    // Log dos vendedores retornados para depuração
    if (resultado.vendedores.length > 0) {
      console.log('Exemplo de vendedor processado:', JSON.stringify(resultado.vendedores[0], null, 2));
    }

    // Verificar se os vendedores fixos já estão na lista
    const vendedoresAtualizados = [...resultado.vendedores];
    let vendedoresAdicionados = 0;

    for (const vendedorFixo of VENDEDORES_FIXOS) {
      const existeVendedor = vendedoresAtualizados.some(v => 
        v.nome.includes(vendedorFixo.nome) || v.id === vendedorFixo.id
      );
      
      if (!existeVendedor) {
        vendedoresAtualizados.push(vendedorFixo);
        vendedoresAdicionados++;
        console.log(`Vendedor fixo adicionado: ${vendedorFixo.nome}`);
      }
    }

    // Se adicionamos vendedores, atualizar o resultado
    if (vendedoresAdicionados > 0) {
      resultado.vendedores = vendedoresAtualizados;
      resultado.totalVendedores = vendedoresAtualizados.length;
      console.log(`Total de ${vendedoresAdicionados} vendedores fixos adicionados à listagem`);
    }

    // Se tudo ocorreu bem, retorna os dados
    return NextResponse.json(resultado);
    
  } catch (error) {
    console.error('Erro ao processar requisição de vendedores:', error);
    return NextResponse.json(
      { 
        erro: 'Erro interno ao processar requisição de vendedores',
        vendedores: [],
        totalVendedores: 0,
        totalVendas: 0,
        totalFaturamento: 0
      },
      { status: 500 }
    );
  }
} 