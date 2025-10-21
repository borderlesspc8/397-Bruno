// API CEO para busca de dados auxiliares
// Retorna centros de custo, formas de pagamento, categorias, produtos, clientes, etc.
// DADOS REAIS DA API BETEL

import { NextRequest, NextResponse } from 'next/server';
import { createCEOErrorResponse, logCEOError } from '@/app/(auth-routes)/dashboard-ceo/services/error-handler';
import { CEOBetelDataService } from '@/app/(auth-routes)/dashboard-ceo/services/ceo-betel-data-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'all', 'centros', 'formas', 'categorias', 'produtos', 'clientes'
    const grouped = searchParams.get('grouped') === 'true';
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    console.log(`CEO: Buscando dados auxiliares [type=${type}, grouped=${grouped}, forceRefresh=${forceRefresh}]`);

    let result: any;
    let usingFallback = false;

    try {
      // Buscar dados baseado no tipo solicitado
      switch (type) {
        case 'centros':
        case 'centros_custo':
          if (grouped) {
            result = {
              centrosCustoAgrupados: await CEOBetelDataService.getCentrosCustoAgrupados(),
            };
          } else {
            result = {
              centrosCusto: await CEOBetelDataService.getCentrosCusto(forceRefresh),
            };
          }
          break;

        case 'formas':
        case 'formas_pagamento':
          if (grouped) {
            result = {
              formasPagamentoAgrupadas: await CEOBetelDataService.getFormasPagamentoAgrupadas(),
            };
          } else {
            result = {
              formasPagamento: await CEOBetelDataService.getFormasPagamento(forceRefresh),
            };
          }
          break;

        case 'categorias':
          if (grouped) {
            result = {
              categoriasAgrupadas: await CEOBetelDataService.getCategoriasAgrupadas(),
            };
          } else {
            result = {
              categorias: await CEOBetelDataService.getCategorias(forceRefresh),
            };
          }
          break;

        case 'produtos':
          result = {
            produtos: await CEOBetelDataService.getProdutos(forceRefresh),
          };
          break;

        case 'clientes':
          if (grouped) {
            result = {
              clientesSegmentados: await CEOBetelDataService.getClientesSegmentados(),
            };
          } else {
            result = {
              clientes: await CEOBetelDataService.getClientes(forceRefresh),
            };
          }
          break;

        case 'vendedores':
          result = {
            vendedores: await CEOBetelDataService.getVendedores(forceRefresh),
          };
          break;

        case 'lojas':
          result = {
            lojas: await CEOBetelDataService.getLojas(forceRefresh),
          };
          break;

        case 'canais':
        case 'canais_venda':
          result = {
            canaisVenda: await CEOBetelDataService.getCanaisVenda(forceRefresh),
          };
          break;

        case 'grouped':
        case 'agrupados':
          // Buscar todos os dados agrupados
          result = await CEOBetelDataService.getDadosAgrupadosCompletos(forceRefresh);
          break;

        case 'all':
        default:
          // Buscar todos os dados auxiliares
          if (grouped) {
            result = await CEOBetelDataService.getDadosAgrupadosCompletos(forceRefresh);
          } else {
            result = await CEOBetelDataService.getDadosAuxiliaresCompletos(forceRefresh);
          }
          break;
      }

      console.log('CEO: Dados auxiliares obtidos com sucesso:', {
        type,
        grouped,
        keys: Object.keys(result),
        sizes: Object.entries(result).map(([key, value]) => ({
          key,
          size: Array.isArray(value) ? value.length : 'N/A',
        })),
      });

    } catch (error) {
      logCEOError('auxiliary-data-fetch', error, { type, grouped });
      
      console.log('CEO: Erro ao buscar dados auxiliares, usando fallback mínimo');
      usingFallback = true;

      // Retornar dados mínimos em caso de erro
      result = {
        centrosCusto: [],
        formasPagamento: [],
        categorias: [],
        produtos: [],
        clientes: [],
        vendedores: [],
        lojas: [{ id: 1, nome: 'Loja Principal', ativo: true }],
        canaisVenda: [
          { id: 1, nome: 'Loja Física', tipo: 'offline', ativo: true },
          { id: 2, nome: 'E-commerce', tipo: 'online', ativo: true },
        ],
      };
    }

    // Adicionar metadados
    const response = {
      ...result,
      _metadata: {
        type,
        grouped,
        forceRefresh,
        dataSource: usingFallback ? 'fallback' : 'api',
        fallbackUsed: usingFallback,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    logCEOError('auxiliary-data-get', error);
    return createCEOErrorResponse(error, 'auxiliary-data-get', 500);
  }
}

// Endpoint para limpar cache
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get('pattern');

    if (pattern) {
      CEOBetelDataService.clearCacheByPattern(pattern);
      console.log(`CEO: Cache limpo para padrão: ${pattern}`);
    } else {
      CEOBetelDataService.clearCache();
      console.log('CEO: Todo cache de dados auxiliares limpo');
    }

    return NextResponse.json({
      success: true,
      message: pattern ? `Cache limpo para padrão: ${pattern}` : 'Todo cache limpo',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logCEOError('auxiliary-data-delete-cache', error);
    return createCEOErrorResponse(error, 'auxiliary-data-delete-cache', 500);
  }
}

