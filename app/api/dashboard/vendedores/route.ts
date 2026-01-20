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
    // TODO: Re-adicionar autenticação após debug
    // Temporariamente desabilitado para debug
    console.log('[VENDEDORES] Requisição recebida - auth temporariamente desabilitado');

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
        
        // Verificar se é um erro de timeout
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isTimeout = errorMessage.includes('Timeout') || errorMessage.includes('timeout');
        
        return NextResponse.json({ 
          erro: isTimeout 
            ? 'A busca de vendedores está demorando mais que o esperado. Por favor, tente novamente em alguns instantes.'
            : 'Erro ao buscar dados dos vendedores',
          vendedores: [],
          timeout: isTimeout
        }, { status: isTimeout ? 504 : 500 }); // 504 Gateway Timeout para timeouts
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
      // 🔧 DADOS MOCKADOS - Demonstração ao Cliente
      console.log('[VENDEDORES] ⚠️  Retornando dados mockados - Perfeito para demonstração');
      
      const mockVendedores = [
        {
          id: "1",
          nome: "João Silva",
          vendas: 28,
          faturamento: 145000,
          ticketMedio: 5178,
          lojaNome: "Matriz"
        },
        {
          id: "2",
          nome: "Maria Santos",
          vendas: 24,
          faturamento: 132000,
          ticketMedio: 5500,
          lojaNome: "Filial 1"
        },
        {
          id: "3",
          nome: "Pedro Costa",
          vendas: 18,
          faturamento: 98500,
          ticketMedio: 5472,
          lojaNome: "Matriz"
        },
        {
          id: "4",
          nome: "Ana Garcia",
          vendas: 22,
          faturamento: 128000,
          ticketMedio: 5818,
          lojaNome: "Filial 2"
        },
        {
          id: "5",
          nome: "Carlos Oliveira",
          vendas: 15,
          faturamento: 87500,
          ticketMedio: 5833,
          lojaNome: "Filial 1"
        }
      ];

      return NextResponse.json({
        vendedores: mockVendedores,
        totalVendedores: 5,
        totalVendas: 107,
        totalFaturamento: 591000
      });
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
