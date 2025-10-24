import { NextRequest, NextResponse } from 'next/server';
import { parse, format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { validateSessionForAPI } from "@/app/_utils/auth";
import { requireVendedoresAccess } from "@/app/_lib/auth-permissions";
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';
import { getCachedData, CachePrefix } from '@/app/_services/cache';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


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

// Tempo de vida do cache para vendedores (15 minutos)
const CACHE_TTL_VENDEDORES = 15 * 60; // segundos

export async function GET(request: NextRequest) {
  try {
    // Verificar permissões de acesso usando a mesma lógica da rota de vendas
    const { success, error } = await requireVendedoresAccess(request);
    if (!success) {
      return NextResponse.json(
        { 
          erro: 'Acesso negado',
          mensagem: error || 'Você não tem permissão para acessar esta rota',
          vendedores: []
        },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Parâmetros de filtro da data
    const dataInicioParam = searchParams.get('dataInicio');
    const dataFimParam = searchParams.get('dataFim');
    const todosVendedores = searchParams.get('todos') === 'true';

    // Se for para buscar todos os vendedores, usar período amplo
    if (todosVendedores) {
      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 12); // 12 meses atrás
      const dataFim = new Date();
      
      const dataInicioFormatada = format(dataInicio, 'yyyy-MM-dd');
      const dataFimFormatada = format(dataFim, 'yyyy-MM-dd');
      
      const cacheKey = `${CachePrefix.VENDEDORES}todos:${dataInicioFormatada}:${dataFimFormatada}`;
      
      try {
        const resultado = await getCachedData(
          cacheKey,
          async () => {
            console.log("🔍 Buscando TODOS os vendedores no período:", {
              dataInicio: dataInicio.toISOString(),
              dataFim: dataFim.toISOString()
            });
            
            const vendedoresResult = await BetelTecnologiaService.buscarVendedores({
              dataInicio,
              dataFim
            });
            
            console.log("📊 Resultado da busca de TODOS os vendedores:", {
              vendedores: vendedoresResult.vendedores?.length || 0,
              erro: vendedoresResult.erro
            });
            
            return vendedoresResult;
          },
          30 * 60 // 30 minutos de cache
        );

        return NextResponse.json(resultado);
      } catch (error) {
        console.error('Erro ao buscar todos os vendedores:', error);
        return NextResponse.json({ 
          erro: 'Erro ao buscar dados dos vendedores',
          vendedores: []
        }, { status: 500 });
      }
    }

    if (!dataInicioParam || !dataFimParam) {
      return NextResponse.json({ 
        erro: 'Os parâmetros dataInicio e dataFim são obrigatórios',
        vendedores: []
      }, { status: 400 });
    }

    // Converter string para objeto Date
    let dataInicio: Date;
    let dataFim: Date;

    try {
      // Aceitar tanto formato ISO quanto data formatada
      if (dataInicioParam.includes('T')) {
        dataInicio = new Date(dataInicioParam);
      } else {
        dataInicio = parse(dataInicioParam, 'yyyy-MM-dd', new Date());
      }
      
      if (dataFimParam.includes('T')) {
        dataFim = new Date(dataFimParam);
      } else {
        dataFim = parse(dataFimParam, 'yyyy-MM-dd', new Date());
      }

      // Verificar se as datas são válidas
      if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
        throw new Error('Datas inválidas');
      }
      
      // NÃO forçar o primeiro dia do mês - usar as datas exatas enviadas pelo cliente
      // dataInicio = startOfMonth(dataInicio);
    } catch (error) {
      return NextResponse.json({ 
        erro: 'Formato de data inválido',
        vendedores: []
      }, { status: 400 });
    }

    // Gerar chave única para o cache
    const formattedDataInicio = format(dataInicio, 'yyyy-MM-dd');
    const formattedDataFim = format(dataFim, 'yyyy-MM-dd');
    const cacheKey = `${CachePrefix.VENDEDORES}${formattedDataInicio}:${formattedDataFim}`;
    
    try {
      // Buscar dados com cache para evitar requisições repetidas
      const resultado = await getCachedData(
        cacheKey,
        async () => {
          // Obter vendedores da API externa
          const vendedoresResult = await BetelTecnologiaService.buscarVendedores({
            dataInicio,
            dataFim
          });
          
          return vendedoresResult;
        },
        CACHE_TTL_VENDEDORES // TTL específico para vendedores
      );

      // Retornar o resultado da busca
      return NextResponse.json(resultado);
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
      return NextResponse.json({ 
        erro: 'Erro ao buscar dados dos vendedores',
        vendedores: []
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json({ 
      erro: 'Erro interno do servidor',
      vendedores: []
    }, { status: 500 });
  }
} 
