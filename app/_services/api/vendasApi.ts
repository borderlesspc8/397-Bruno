import { formatDate } from '@/app/_utils/date';
import { getCachedData, hasCacheKey } from '@/app/_services/cache';
import { BetelTecnologiaService } from '../betelTecnologia';
import { BetelVenda, parseValorSeguro } from '@/app/_utils/calculoFinanceiro';

// Chave de cache padrão para vendas
const CACHE_KEY_PREFIX = 'betel:/vendas';
const CACHE_TTL = 1000 * 60 * 30; // 30 minutos

/**
 * Interface para representar informações de loja
 */
interface Loja {
  id: string;
  nome: string;
}

/**
 * Busca lojas disponíveis (implementação temporária até criar lojasApi.ts)
 */
async function obterDadosLojas(): Promise<Loja[]> {
  // Esta é uma implementação temporária
  // Idealmente, deveria vir de um serviço específico de lojas
  return [
    { id: '1', nome: 'Loja Principal' }
    // Adicione mais lojas conforme necessário
  ];
}

/**
 * Calcula o faturamento total a partir de uma lista de vendas
 * @param vendas Lista de vendas
 * @returns Valor total do faturamento
 */
function calcularFaturamento(vendas: BetelVenda[]): number {
  if (!vendas || !Array.isArray(vendas) || vendas.length === 0) {
    return 0;
  }
  
  return vendas.reduce((total, venda) => {
    return total + parseValorSeguro(venda.valor_total);
  }, 0);
}

/**
 * Busca vendas do período informado
 */
export async function obterVendas(params: {
  dataInicio: Date;
  dataFim: Date;
}) {
  console.log(`Iniciando busca de vendas com parâmetros:`, params);
  
  // Formata as datas para o formato da API
  const dataInicio = formatDate(params.dataInicio, 'yyyy-MM-dd');
  const dataFim = formatDate(params.dataFim, 'yyyy-MM-dd');
  
  console.log(`Datas formatadas:`, { dataInicio, dataFim });
  
  // Busca lojas disponíveis
  console.log('Buscando lojas disponíveis...');
  const lojas = await obterDadosLojas();
  
  // Busca vendas de cada loja
  const vendasPorLoja = [];
  let totalVendas = 0;
  let totalFaturamento = 0;

  // Mapear as promessas em paralelo em vez de sequencial
  const promessasVendas = lojas.map(async (loja) => {
    console.log(`Buscando vendas da loja: ${loja.nome} (ID: ${loja.id})...`);
    
    const cacheKey = `${CACHE_KEY_PREFIX}?data_inicio=${dataInicio}&data_fim=${dataFim}&loja_id=${loja.id}`;
    
    // Busca dados da API ou do cache
    const vendas = await getCachedData(
      cacheKey,
      async () => {
        // Código da API para buscar vendas
        const result = await fetchVendas({
          dataInicio,
          dataFim,
          lojaId: loja.id
        });
        return result;
      },
      CACHE_TTL
    );
    
    const vendasInfo = {
      lojaId: loja.id,
      lojaNome: loja.nome,
      vendas: vendas ? vendas.length : 0,
      faturamento: calcularFaturamento(vendas || [])
    };
    
    return {
      vendas: vendas || [],
      info: vendasInfo
    };
  });
  
  // Aguarda todas as promessas em paralelo
  const resultados = await Promise.all(promessasVendas);
  
  // Processa os resultados
  const todasVendas: BetelVenda[] = [];
  const infoVendas = [];
  
  for (const resultado of resultados) {
    todasVendas.push(...resultado.vendas);
    infoVendas.push(resultado.info);
    
    totalVendas += resultado.vendas.length;
    totalFaturamento += resultado.info.faturamento;
  }
  
  // Log da distribuição de vendas por loja
  console.log('Distribuição de vendas por loja:');
  for (const info of infoVendas) {
    console.log(`- ${info.lojaNome} (ID: ${info.lojaId}): ${info.vendas} vendas, R$ ${info.faturamento.toFixed(2)}`);
  }
  
  return todasVendas;
}

/**
 * Busca vendas da API com os parâmetros informados
 */
async function fetchVendas(params: {
  dataInicio: string;
  dataFim: string;
  lojaId: string;
}): Promise<BetelVenda[]> {
  try {
    // Implementação da chamada à API utilizando o BetelTecnologiaService
    const resultado = await BetelTecnologiaService.buscarVendas({
      dataInicio: new Date(params.dataInicio),
      dataFim: new Date(params.dataFim)
    });
    
    // Filtrar vendas apenas da loja solicitada
    return resultado.vendas.filter(venda => 
      String(venda.loja_id) === params.lojaId
    );
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    return [];
  }
} 
