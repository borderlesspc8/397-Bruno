/**
 * API: Métricas Operacionais CEO - USANDO BetelTecnologiaService COMO FONTE ÚNICA
 * 
 * CORREÇÃO COMPLETA:
 * - ✅ Usa BetelTecnologiaService como fonte única de dados (mesma do Dashboard de Vendas)
 * - ✅ Mantém consistência de valores entre Dashboard de Vendas e Dashboard CEO
 * - ✅ DESPESAS OPERACIONAIS: ponto chave do dashboard CEO - busca dados reais de pagamentos
 * - ✅ Cálculos: Faturamento - Custos Produtos - Despesas Operacionais
 * - ✅ Remove dependência de CEOGestaoClickService
 * - ✅ Tratamento robusto de erros
 */

import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';

// Configuração para forçar comportamento dinâmico
export const dynamic = "force-dynamic";

/**
 * Função auxiliar para buscar pagamentos usando BetelTecnologiaService
 * (usando o método interno fetchWithRetry, como feito em outros serviços CEO)
 */
async function buscarPagamentos(
  dataInicio: Date,
  dataFim: Date
): Promise<any[]> {
  try {
    const dataInicioStr = format(dataInicio, 'yyyy-MM-dd');
    const dataFimStr = format(dataFim, 'yyyy-MM-dd');
    
    // Buscar com paginação para garantir que todos os pagamentos sejam capturados
    let todosPagamentos: any[] = [];
    let paginaAtual = 1;
    let temMaisPaginas = true;
    const limitePorPagina = 500; // Aumentar para 500 por página
    const maxPaginas = 10; // Máximo de 10 páginas = 5000 pagamentos
    
    while (temMaisPaginas && paginaAtual <= maxPaginas) {
      const url = `/pagamentos?data_inicio=${dataInicioStr}&data_fim=${dataFimStr}&page=${paginaAtual}&limit=${limitePorPagina}`;
      
      // @ts-ignore - Usar método interno do BetelTecnologiaService
      const result = await (BetelTecnologiaService as any).fetchWithRetry(url);
      
      if (result.error) {
        console.error(`[CEO Operational Metrics] ❌ Erro ao buscar pagamentos página ${paginaAtual}:`, result.error);
        break;
      }
      
      const pagamentosPagina = result.data?.data || result.data || [];
      todosPagamentos = [...todosPagamentos, ...pagamentosPagina];
      
      console.log(`[CEO Operational Metrics] 💸 Página ${paginaAtual}: ${pagamentosPagina.length} pagamentos (Total acumulado: ${todosPagamentos.length})`);
      
      // Verificar se há mais páginas
      if (result.data?.meta) {
        const { proxima_pagina, total_paginas } = result.data.meta;
        if (proxima_pagina && paginaAtual < total_paginas) {
          paginaAtual++;
        } else {
          temMaisPaginas = false;
        }
      } else {
        // Se não há metadados de paginação e retornou menos que o limite, é a última página
        if (pagamentosPagina.length < limitePorPagina) {
          temMaisPaginas = false;
        } else {
          // Se retornou exatamente o limite, pode haver mais páginas
          paginaAtual++;
        }
      }
      
      // Pequena pausa para não sobrecarregar a API
      if (temMaisPaginas) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`[CEO Operational Metrics] 💸 Total de ${todosPagamentos.length} pagamentos encontrados (${paginaAtual - 1} página(s))`);
    
    return todosPagamentos;
  } catch (error) {
    console.error('[CEO Operational Metrics] ❌ Erro ao buscar pagamentos:', error);
    return [];
  }
}

/**
 * Função auxiliar para buscar centros de custo usando BetelTecnologiaService
 */
async function buscarCentrosCusto(): Promise<any[]> {
  try {
    // Endpoint correto: /centros_custos (com underscore, não hífen)
    // @ts-ignore - Usar método interno do BetelTecnologiaService
    const result = await (BetelTecnologiaService as any).fetchWithRetry('/centros_custos');
    
    if (result.error) {
      console.warn('[CEO Operational Metrics] ⚠️  Endpoint de centros de custo não disponível:', result.error);
      return [];
    }
    
    const centrosCusto = result.data?.data || result.data || [];
    console.log(`[CEO Operational Metrics] 🏢 ${centrosCusto.length} centros de custo encontrados`);
    
    return centrosCusto;
  } catch (error) {
    // Não é crítico - podemos trabalhar sem centros de custo, usando apenas descrições dos pagamentos
    console.warn('[CEO Operational Metrics] ⚠️  Erro ao buscar centros de custo (não crítico):', error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Estrutura de resposta das métricas operacionais
 */
interface OperationalMetrics {
  // Relação Custos/Receita
  costRevenueRatio: number;
  
  // Custo de Aquisição de Cliente (CAC)
  customerAcquisitionCost: number;
  
  // Rentabilidade por Centro de Custo
  costCenterProfitability: Array<{
    id: string;
    name: string;
    revenue: number;
    costs: number;
    profitability: number;
    margin: number;
  }>;
  
  // Detalhes adicionais
  details?: {
    totalReceita: number;
    totalCustos: number;
    totalCustosProdutos: number;
    totalDespesasOperacionais: number;
    novosClientes: number;
    investimentoMarketing: number;
  };
  
  // Metadados
  lastUpdated: string;
  _metadata: {
    dataSource: 'api' | 'error';
    centrosCustoDisponivel: boolean;
    pagamentosDisponivel: boolean;
    usandoEstimativas: boolean;
    estimativas?: string[];
    periodo: {
      inicio: string;
      fim: string;
    };
    timestamp: string;
    error?: string;
  };
}

/**
 * GET /api/ceo/operational-metrics
 * 
 * @param request - Request com query params startDate e endDate
 * @returns Métricas operacionais completas
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Validar parâmetros
    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          erro: 'Parâmetros startDate e endDate são obrigatórios',
          message: 'Formato esperado: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD'
        },
        { status: 400 }
      );
    }
    
    // Converter datas para objetos Date
    const dataInicio = new Date(startDate);
    const dataFim = new Date(endDate);
    
    console.log(`[CEO Operational Metrics] 🔄 Buscando dados via BetelTecnologiaService: ${format(dataInicio, 'yyyy-MM-dd')} a ${format(dataFim, 'yyyy-MM-dd')}`);
    
    // =======================================================================
    // BUSCAR VENDAS USANDO BetelTecnologiaService (MESMA FONTE DO DASHBOARD DE VENDAS)
    // =======================================================================
    
    const vendasResult = await BetelTecnologiaService.buscarVendas({
      dataInicio,
      dataFim
    });
    
    if (vendasResult.erro) {
      throw new Error(`Erro ao buscar vendas: ${vendasResult.erro}`);
    }
    
    // As vendas já vêm filtradas por status "Concretizada" e "Em andamento" do BetelTecnologiaService
    const vendasFiltradas = vendasResult.vendas || [];
    
    // =======================================================================
    // BUSCAR PAGAMENTOS E CENTROS DE CUSTO (PARA DESPESAS OPERACIONAIS)
    // =======================================================================
    
    console.log(`[CEO Operational Metrics] 🔄 Buscando pagamentos e centros de custo...`);
    
    const [pagamentos, centrosCusto] = await Promise.all([
      buscarPagamentos(dataInicio, dataFim),
      buscarCentrosCusto()
    ]);
    
    const pagamentosDisponivel = pagamentos.length > 0;
    const centrosCustoDisponivel = centrosCusto.length > 0;
    
    console.log('[CEO Operational Metrics] Dados obtidos:', {
      vendas: vendasFiltradas.length,
      pagamentos: pagamentos.length,
      centrosCusto: centrosCusto.length,
      pagamentosDisponivel,
      centrosCustoDisponivel
    });
    
    const estimativas: string[] = [];
    
    // =======================================================================
    // CALCULAR RECEITAS E CUSTOS DE PRODUTOS
    // =======================================================================
    
    // Usar totalValor já calculado pelo BetelTecnologiaService (consistente com Dashboard de Vendas)
    const totalReceita = vendasResult.totalValor || 0;
    
    // Calcular custos de produtos (mesma lógica do Dashboard de Vendas)
    const totalCustosProdutos = vendasFiltradas.reduce((acc, venda) => {
      // Usar valor_custo da venda (mesma lógica do Dashboard de Vendas)
      // valor_custo vem como string do BetelVenda
      const valorCusto = parseFloat(String(venda.valor_custo || '0'));
      return acc + (isNaN(valorCusto) ? 0 : valorCusto);
    }, 0);
    
    // =======================================================================
    // CALCULAR DESPESAS OPERACIONAIS (PONTO CHAVE DO DASHBOARD CEO)
    // =======================================================================
    
    let totalDespesasOperacionais = 0;
    
    if (pagamentosDisponivel) {
      // Criar mapa de centros de custo para facilitar busca
      const centrosCustoMap = new Map(centrosCusto.map((c: any) => [c.id?.toString(), c.nome?.toLowerCase() || '']));
      
      // Categorias que são despesas operacionais
      const categoriasOperacionais = [
        'despesas administrativas', 'despesas fixas', 'salários', 'prólabore',
        'aluguel', 'energia', 'internet', 'contabilidade', 'marketing',
        'publicidade', 'propaganda', 'manutenção', 'limpeza', 'transportadora',
        'logística', 'eventos', 'software', 'serviços', 'taxas', 'encargos',
        'imposto', 'água', 'telefone', 'combustível', 'vale', 'aniversário'
      ];
      
      // Categorias que NÃO são despesas operacionais (são custos de produtos ou investimentos)
      const categoriasExcluir = [
        'fornecedor', 'compra', 'estoque', 'matéria-prima', 'produto',
        'mercadoria', 'inventário', 'equipamentos', 'investimento', 'acessórios',
        'bonificação'
      ];
      
      const pagamentosOperacionais = pagamentos.filter((pag: any) => {
        // Buscar nome do centro de custo (se disponível)
        const centroCustoId = pag.centro_custo_id?.toString();
        const nomeCentro = centroCustoId && centrosCustoMap.has(centroCustoId) 
          ? (centrosCustoMap.get(centroCustoId) || '') 
          : '';
        
        // Usar também o campo nome_centro_custo se disponível no pagamento
        const nomeCentroCusto = (pag.nome_centro_custo || '').toLowerCase();
        const descricao = (pag.descricao || '').toLowerCase();
        const nomeCentroLower = nomeCentro.toLowerCase();
        
        // Combinar todas as fontes de informação sobre categoria
        const textoCompleto = `${nomeCentroLower} ${nomeCentroCusto} ${descricao}`.toLowerCase();
        
        // Excluir se está nas categorias de exclusão
        if (categoriasExcluir.some(cat => textoCompleto.includes(cat))) {
          return false;
        }
        
        // Incluir se está nas categorias operacionais
        if (categoriasOperacionais.some(cat => textoCompleto.includes(cat))) {
          return true;
        }
        
        // Por padrão, não incluir pagamentos não categorizados
        return false;
      });
      
      // Calcular total de despesas operacionais usando mesma lógica de conversão
      totalDespesasOperacionais = pagamentosOperacionais.reduce((acc: number, pag: any) => {
        // Usar mesma lógica de conversão de valores dos centros de custo
        const valorOriginal = pag.valor;
        let valorNum = 0;
        
        if (typeof valorOriginal === 'number') {
          if (Number.isInteger(valorOriginal)) {
            const valorAbs = Math.abs(valorOriginal);
            if (valorAbs > 10000) {
              valorNum = valorOriginal / 100;
            } else {
              valorNum = valorOriginal;
            }
          } else {
            valorNum = valorOriginal;
          }
        } else if (valorOriginal) {
          const valorStr = String(valorOriginal).trim();
          let valorLimpo = valorStr.replace(/[^\d,.-]/g, '');
          const temVirgula = valorLimpo.includes(',');
          const temPonto = valorLimpo.includes('.');
          
          if (temVirgula && temPonto) {
            const ultimaVirgula = valorLimpo.lastIndexOf(',');
            const ultimoPonto = valorLimpo.lastIndexOf('.');
            if (ultimaVirgula > ultimoPonto) {
              valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
            } else {
              valorLimpo = valorLimpo.replace(/,/g, '');
            }
          } else if (temVirgula) {
            valorLimpo = valorLimpo.replace(',', '.');
          } else if (temPonto) {
            const partes = valorLimpo.split('.');
            if (partes.length === 2 && partes[1].length <= 2) {
              // Decimal válido
            } else if (partes.length > 2 && partes[partes.length - 1].length <= 2) {
              valorLimpo = partes.slice(0, -1).join('') + '.' + partes[partes.length - 1];
            } else if (partes.length === 2 && partes[1].length > 2) {
              valorLimpo = partes.join('');
            } else if (partes.length > 2) {
              valorLimpo = partes.join('');
            }
          }
          
          valorNum = parseFloat(valorLimpo);
          if (isNaN(valorNum)) valorNum = 0;
          
          if (!temVirgula && !temPonto && valorNum > 100000 && Number.isInteger(valorNum)) {
            valorNum = valorNum / 100;
          }
        }
        
        return acc + Math.abs(valorNum);
      }, 0);
      
      console.log('[CEO Operational Metrics] Filtro de despesas operacionais:', {
        totalPagamentos: pagamentos.length,
        pagamentosOperacionais: pagamentosOperacionais.length,
        pagamentosExcluidos: pagamentos.length - pagamentosOperacionais.length,
        totalDespesas: totalDespesasOperacionais
      });
      
      // Se não encontrou despesas operacionais, estimar
      if (totalDespesasOperacionais === 0) {
        totalDespesasOperacionais = totalReceita * 0.15; // 15% da receita
        estimativas.push('Despesas Operacionais: Estimado em 15% da receita (pagamentos não categorizados como despesas operacionais)');
      } else {
        // Validar se o valor está razoável (máximo 40% da receita)
        const percentualDespesas = totalReceita > 0 ? (totalDespesasOperacionais / totalReceita) : 0;
        if (percentualDespesas > 0.40) {
          console.warn(`[CEO Operational Metrics] ⚠️  Despesas operacionais muito altas: ${Math.round(percentualDespesas * 100)}% da receita`);
          totalDespesasOperacionais = totalReceita * 0.30; // Ajustar para máximo 30%
          estimativas.push('Despesas Operacionais: Ajustado para 30% da receita (valor original muito alto)');
        }
      }
    } else {
      // ESTIMATIVA: 15% da receita como despesas
      totalDespesasOperacionais = totalReceita * 0.15;
      estimativas.push('Despesas Operacionais: Estimado em 15% da receita (endpoint /pagamentos não disponível)');
    }
    
    // CUSTOS TOTAIS = CUSTOS PRODUTOS + DESPESAS OPERACIONAIS
    let totalCustos = totalCustosProdutos + totalDespesasOperacionais;
    
    // =======================================================================
    // 1. RELAÇÃO CUSTOS/RECEITA
    // =======================================================================
    
    // Validar se a relação está razoável
    let costRevenueRatio = totalReceita > 0 ? totalCustos / totalReceita : 0;
    
    if (costRevenueRatio > 1.5) {
      console.warn(`[CEO Operational Metrics] ⚠️  Relação Custos/Receita muito alta: ${Math.round(costRevenueRatio * 100)}%`);
      console.warn(`[CEO Operational Metrics] Total Custos: R$ ${totalCustos.toFixed(2)}, Total Receita: R$ ${totalReceita.toFixed(2)}`);
      console.warn(`[CEO Operational Metrics] Ajustando despesas operacionais para 12% da receita`);
      
      // Ajustar despesas operacionais para máximo 12%
      totalDespesasOperacionais = totalReceita * 0.12;
      totalCustos = totalCustosProdutos + totalDespesasOperacionais;
      costRevenueRatio = totalReceita > 0 ? totalCustos / totalReceita : 0;
      
      estimativas.push('Relação Custos/Receita: Ajustado automaticamente (valor original acima de 150%)');
    }
    
    console.log('[CEO Operational Metrics] Cálculos (com despesas operacionais):', {
      totalReceita: totalReceita.toFixed(2),
      totalCustosProdutos: totalCustosProdutos.toFixed(2),
      totalDespesasOperacionais: totalDespesasOperacionais.toFixed(2),
      totalCustos: totalCustos.toFixed(2),
      costRevenueRatio: (costRevenueRatio * 100).toFixed(2) + '%',
      lucro: (totalReceita - totalCustos).toFixed(2)
    });
    
    // =======================================================================
    // 2. CUSTO DE AQUISIÇÃO DE CLIENTE (CAC)
    // =======================================================================
    
    // Identificar investimento em marketing
    let investimentoMarketing = 0;
    
    if (pagamentosDisponivel) {
      // Buscar pagamentos de marketing usando centro_custo_id (se disponível) ou descrição
      let centroMarketingIds: string[] = [];
      
      if (centrosCustoDisponivel) {
        // Buscar IDs dos centros de custo de marketing
        centroMarketingIds = centrosCusto
          .filter((c: any) => c.nome?.toLowerCase().includes('marketing'))
          .map((c: any) => c.id?.toString());
      }
      
      // Palavras-chave para identificar marketing
      const palavrasChaveMarketing = ['marketing', 'publicidade', 'propaganda', 'anúncio', 'google ads', 'facebook ads', 'instagram ads'];
      
      investimentoMarketing = pagamentos
        .filter((pag: any) => {
          // Verificar se é do centro de custo MARKETING (se disponível)
          if (centrosCustoDisponivel && pag.centro_custo_id) {
            const isCentroMarketing = centroMarketingIds.includes(pag.centro_custo_id.toString());
            if (isCentroMarketing) return true;
          }
          
          // Verificar pelo nome do centro de custo ou descrição
          const nomeCentroCusto = (pag.nome_centro_custo || '').toLowerCase();
          const descricao = (pag.descricao || '').toLowerCase();
          const textoCompleto = `${nomeCentroCusto} ${descricao}`;
          
          return palavrasChaveMarketing.some(palavra => textoCompleto.includes(palavra));
        })
        .reduce((acc: number, pag: any) => {
          const valor = parseFloat(String(pag.valor || '0'));
          return acc + (isNaN(valor) ? 0 : valor);
        }, 0);
      
      console.log('[CEO Operational Metrics] Investimento em marketing encontrado:', {
        totalMarketing: investimentoMarketing,
        centrosMarketing: centroMarketingIds,
        usandoCentrosCusto: centrosCustoDisponivel
      });
      
      // Se não encontrou pagamentos de marketing, estimar
      if (investimentoMarketing === 0) {
        investimentoMarketing = totalReceita * 0.03; // 3% da receita
        estimativas.push('Investimento Marketing: Estimado em 3% da receita (não encontrados pagamentos categorizados como marketing)');
      } else {
        // Validar se o valor está razoável (máximo 10% da receita)
        const percentualMarketing = totalReceita > 0 ? (investimentoMarketing / totalReceita) : 0;
        if (percentualMarketing > 0.10) {
          console.warn(`[CEO Operational Metrics] ⚠️  Investimento em marketing muito alto: ${Math.round(percentualMarketing * 100)}% da receita`);
          investimentoMarketing = totalReceita * 0.05; // Ajustar para máximo 5%
          estimativas.push('Investimento Marketing: Ajustado para 5% da receita (valor original muito alto)');
        }
      }
    } else {
      // ESTIMATIVA: 3% da receita como investimento em marketing
      investimentoMarketing = totalReceita * 0.03;
      estimativas.push('Investimento Marketing: Estimado em 3% da receita (endpoint /pagamentos não disponível)');
    }
    
    // Estimar novos clientes (clientes únicos no período)
    const clientesUnicos = new Set(vendasFiltradas.map(v => v.cliente_id || v.cliente).filter(Boolean));
    const novosClientes = clientesUnicos.size;
    
    const customerAcquisitionCost = novosClientes > 0 ? investimentoMarketing / novosClientes : 0;
    
    if (novosClientes > 0) {
      estimativas.push(`Novos Clientes: Usando clientes únicos do período (${novosClientes}) - pode incluir clientes recorrentes`);
    }
    
    // =======================================================================
    // 3. RENTABILIDADE POR CENTRO DE CUSTO REAL (baseado em pagamentos)
    // =======================================================================
    
    // Agrupar pagamentos por centro de custo REAL
    // NOTA: Usar apenas centros de custo que existem na lista de centros de custo
    // e que têm pagamentos associados, NÃO vendedores
    const pagamentosPorCentroCusto = new Map<string, {
      nome: string;
      custos: number;
      quantidadePagamentos: number;
    }>();
    
    // Função para detectar se um nome parece ser nome de pessoa (vendedor)
    const isNomePessoa = (nome: string): boolean => {
      if (!nome || nome.trim().length === 0) return false;
      
      const nomeLower = nome.toLowerCase().trim();
      
      // Lista expandida de palavras-chave que indicam centro de custo (NÃO são pessoas)
      // Se contém essas palavras, definitivamente NÃO é nome de pessoa
      const palavrasComunsCentros = [
        'administrativo', 'administrativas', 'comercial', 'financeiro', 'recursos', 'humanos', 
        'marketing', 'vendas', 'atendimento', 'suporte', 'tecnologia',
        'operacional', 'operacionais', 'logistica', 'logística', 'estoque', 'producao', 'produção', 
        'qualidade', 'departamento', 'setor', 'area', 'área', 'divisao', 'divisão', 'nucleo', 'núcleo',
        'despesas', 'despesa', 'fixas', 'fixo', 'encargos', 'funcionários', 'funcionario',
        'equipamentos', 'equipamento', 'fornecedor', 'imposto', 'investimento', 'aluguel',
        'contabilidade', 'prestação', 'serviços', 'servico', 'acessórios', 'acessorios',
        'eventos', 'evento', 'manutenção', 'manutencao', 'salários', 'salario',
        'materiais', 'material', 'descartáveis', 'descartavel'
      ];
      
      // Se contém palavras comuns de centro de custo, NÃO é nome de pessoa
      if (palavrasComunsCentros.some(palavra => nomeLower.includes(palavra))) {
        return false;
      }
      
      // Palavras-chave que indicam função/cargo, não centro de custo
      const palavrasChaveCargo = [
        'vendedor', 'vendedora', 'seller', 'sales', 'representante',
        'consultor', 'consultora', 'atendente', 'gerente', 'supervisor'
      ];
      
      if (palavrasChaveCargo.some(palavra => nomeLower.includes(palavra))) {
        return true;
      }
      
      // Padrão de nome completo: Nome Próprio + Sobrenome 
      // Exemplos: "MARCUS VINICIUS MACEDO" (TUDO MAIÚSCULA) ou "Marcus Vinicius Macedo" (Title Case)
      const palavras = nome.trim().split(/\s+/).filter(p => p.length > 0);
      if (palavras.length >= 2) {
        // Verificar padrões de nome de pessoa:
        // 1. Todas as palavras começam com maiúscula (Title Case): "Marcus Vinicius"
        // 2. Todas as palavras estão em MAIÚSCULAS: "MARCUS VINICIUS MACEDO"
        const todasTitleCase = palavras.every(palavra => 
          /^[A-ZÁÉÍÓÚÂÊÔÇÀÕ][a-záéíóúâêôçàõ]*$/.test(palavra) && palavra.length > 2
        );
        
        const todasMaiusculas = palavras.every(palavra => 
          /^[A-ZÁÉÍÓÚÂÊÔÇÀÕ]+$/.test(palavra) && palavra.length > 2
        );
        
        // Só considerar como nome de pessoa se for Title Case ou MAIÚSCULAS 
        // E não contém palavras comuns de centro de custo (já verificado acima)
        if ((todasTitleCase || todasMaiusculas) && palavras.length >= 2) {
          // Verificar adicional: nomes comuns brasileiros (heurística)
          const nomesComuns = ['rafael', 'marcus', 'marcos', 'fernando', 'marcelo', 'paulo', 'carlos',
                              'joão', 'joao', 'josé', 'jose', 'maria', 'ana', 'paula', 'larissa',
                              'bruna', 'diully', 'diuly', 'geovana', 'alyne', 'asafe', 'gustavo',
                              'rayssa', 'antonio', 'reinaldo', 'gabrielle', 'matheus', 'rafaela'];
          
          // Se primeira palavra é um nome comum, provavelmente é pessoa
          if (nomesComuns.includes(palavras[0].toLowerCase())) {
            return true;
          }
          
          // Se todas são maiúsculas e não contém palavras comuns, pode ser pessoa
          // Mas só se não parecer centro de custo (já verificado acima)
          return todasMaiusculas && palavras.length >= 2;
        }
      }
      
      return false;
    };
    
    if (pagamentosDisponivel) {
      // IMPORTANTE: Criar mapa APENAS com centros de custo oficiais da lista
      const centrosCustoMap = new Map<string, { id: string; nome: string; nomeLower: string }>();
      
      if (centrosCustoDisponivel && centrosCusto.length > 0) {
        // Mapear apenas centros de custo oficiais e filtrar vendedores
        centrosCusto.forEach((c: any) => {
          const centroId = c.id?.toString();
          const nomeCentro = c.nome || '';
          
          // Filtrar vendedores já na criação do mapa
          if (centroId && !isNomePessoa(nomeCentro)) {
            centrosCustoMap.set(centroId, {
              id: centroId,
              nome: nomeCentro,
              nomeLower: nomeCentro.toLowerCase()
            });
          }
        });
      }
      
      console.log(`[CEO Operational Metrics] 🏢 ${centrosCustoMap.size} centros de custo válidos no mapa (após filtrar vendedores)`);
      
      // Agrupar pagamentos APENAS por centros de custo oficiais
      let pagamentosFiltrados = 0;
      let pagamentosIgnorados = 0;
      
      pagamentos.forEach((pag: any) => {
        const centroCustoId = pag.centro_custo_id?.toString();
        
        // Pular pagamentos sem centro de custo
        if (!centroCustoId) {
          pagamentosIgnorados++;
          return;
        }
        
        // Verificar se o centro de custo está na lista oficial
        const centroInfo = centrosCustoMap.get(centroCustoId);
        
        if (!centroInfo) {
          // Centro de custo não está na lista oficial ou foi filtrado (vendedor)
          pagamentosIgnorados++;
          return;
        }
        
        // Usar apenas nome do centro oficial (não confiar no nome do pagamento)
        const centroId = centroCustoId;
        const centroNome = centroInfo.nome;
        
        if (!pagamentosPorCentroCusto.has(centroId)) {
          pagamentosPorCentroCusto.set(centroId, {
            nome: centroNome,
            custos: 0,
            quantidadePagamentos: 0
          });
        }
        
        const centro = pagamentosPorCentroCusto.get(centroId)!;
        
        // Converter valor corretamente
        // A API BetelTecnologia pode retornar valores em centavos (inteiros) ou reais (decimais)
        let valorNum = 0;
        const valorOriginal = pag.valor;
        
        if (typeof valorOriginal === 'number') {
          // Valor já é numérico
          // Verificar se parece estar em centavos (inteiro muito grande)
          // Exemplos válidos em reais: 131576.70, 9840.50
          // Exemplos em centavos: 13157670, 984050
          if (Number.isInteger(valorOriginal)) {
            const valorAbs = Math.abs(valorOriginal);
            // Se é inteiro e muito grande (> 10000), provavelmente está em centavos
            // Dividir por 100
            if (valorAbs > 10000) {
              valorNum = valorOriginal / 100;
            } else {
              valorNum = valorOriginal;
            }
          } else {
            // Já tem decimais, tratar como reais
            valorNum = valorOriginal;
          }
        } else if (valorOriginal) {
          const valorStr = String(valorOriginal).trim();
          
          // Remover caracteres não numéricos exceto vírgula, ponto e menos
          let valorLimpo = valorStr.replace(/[^\d,.-]/g, '');
          
          // Detectar formato:
          // - Formato brasileiro: "1.234,56" (ponto=milhar, vírgula=decimal)
          // - Formato americano: "1234.56" ou "1,234.56" (vírgula/ponto=milhar, ponto=decimal)
          const temVirgula = valorLimpo.includes(',');
          const temPonto = valorLimpo.includes('.');
          
          if (temVirgula && temPonto) {
            // Tem ambos: determinar qual é decimal
            const ultimaVirgula = valorLimpo.lastIndexOf(',');
            const ultimoPonto = valorLimpo.lastIndexOf('.');
            
            if (ultimaVirgula > ultimoPonto) {
              // Vírgula vem depois = formato brasileiro "1.234,56"
              valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
            } else {
              // Ponto vem depois = formato americano "1,234.56"
              valorLimpo = valorLimpo.replace(/,/g, '');
            }
          } else if (temVirgula) {
            // Só tem vírgula = formato brasileiro sem milhar "1234,56"
            valorLimpo = valorLimpo.replace(',', '.');
          } else if (temPonto) {
            // Só tem ponto - precisa determinar se é decimal ou separador de milhar
            const partes = valorLimpo.split('.');
            
            if (partes.length === 2) {
              // Tem exatamente 2 partes: "1234.56" ou "1.234"
              const parteDepois = partes[1];
              
              if (parteDepois.length <= 2) {
                // Última parte tem 1-2 dígitos = formato decimal "10836.30" ou "123.5"
                // Manter como está (já está correto para parseFloat)
              } else {
                // Última parte tem mais de 2 dígitos = provavelmente separador de milhar "1.2345"
                // Remover ponto
                valorLimpo = partes.join('');
              }
            } else if (partes.length > 2) {
              // Múltiplos pontos = separadores de milhar "1.234.567"
              // Última parte pode ser decimal ou não
              const ultimaParte = partes[partes.length - 1];
              if (ultimaParte.length <= 2) {
                // Última parte tem 1-2 dígitos = decimal
                // Remover pontos anteriores e manter último
                valorLimpo = partes.slice(0, -1).join('') + '.' + ultimaParte;
              } else {
                // Sem decimais, remover todos os pontos
                valorLimpo = partes.join('');
              }
            }
            // Caso contrário, manter como está
          }
          
          valorNum = parseFloat(valorLimpo);
          if (isNaN(valorNum)) valorNum = 0;
          
          // Se o valor resultante é muito grande (inteiro > 100000), pode estar em centavos
          // Mas só se não tinha separador decimal claro
          if (!temVirgula && !temPonto) {
            const valorAbs = Math.abs(valorNum);
            if (valorAbs > 100000 && Number.isInteger(valorAbs)) {
              valorNum = valorNum / 100;
            }
          }
        }
        
        // Usar valor absoluto (despesas são sempre positivas para somar)
        const valorAbsoluto = Math.abs(valorNum);
        
        // Log para debug (apenas primeiros 3 pagamentos de cada centro)
        if (centro.quantidadePagamentos < 3 && centroNome === 'EQUIPAMENTOS') {
          console.log(`[CEO Operational Metrics] 🔍 Debug valor pagamento ${pag.id}:`, {
            valorOriginal: valorOriginal,
            tipo: typeof valorOriginal,
            valorConvertido: valorAbsoluto,
            descricao: pag.descricao || 'Sem descrição'
          });
        }
        
        centro.custos += valorAbsoluto;
        centro.quantidadePagamentos += 1;
        pagamentosFiltrados++;
      });
      
      console.log('[CEO Operational Metrics] 📊 Processamento de pagamentos:', {
        totalPagamentos: pagamentos.length,
        pagamentosProcessados: pagamentosFiltrados,
        pagamentosIgnorados,
        centrosComPagamentos: pagamentosPorCentroCusto.size,
        totalCentrosOficiais: centrosCustoMap.size
      });
      
      // Log dos top 10 centros por custo para validação
      const topCentros = Array.from(pagamentosPorCentroCusto.entries())
        .sort((a, b) => b[1].custos - a[1].custos)
        .slice(0, 10);
      
      console.log('[CEO Operational Metrics] 🔝 Top 10 centros de custo por valor:', 
        topCentros.map(([id, info]) => `${info.nome}: R$ ${info.custos.toFixed(2)}`).join(' | ')
      );
    }
    
    // Se não temos centros de custo reais, usar apenas os que existem na lista (mesmo sem pagamentos)
    // mas apenas se a lista não estiver vazia
    let costCenterProfitability: Array<{
      id: string;
      name: string;
      revenue: number;
      costs: number;
      profitability: number;
      margin: number;
    }> = [];
    
    if (centrosCustoDisponivel && centrosCusto.length > 0) {
      // Usar apenas centros de custo que estão na lista oficial
      centrosCusto.forEach((centro: any) => {
        const centroId = centro.id?.toString();
        const nomeCentro = (centro.nome || '').toLowerCase();
        
        // Filtrar vendedores também da lista oficial
        const isVendedor = isNomePessoa(centro.nome || '');
        
        if (isVendedor) {
          console.log(`[CEO Operational Metrics] ⚠️  Filtrando vendedor da lista oficial: ${centro.nome}`);
          return; // Pular se for vendedor
        }
        
        const pagamentosCentro = pagamentosPorCentroCusto.get(centroId);
        const custosOperacionais = pagamentosCentro?.custos || 0;
        
        // IMPORTANTE: Mostrar apenas custos operacionais REAIS dos pagamentos
        // Não distribuir receita/custos de produtos proporcionalmente (isso infla os valores)
        if (custosOperacionais > 0) {
          // Apenas custos operacionais reais (soma dos pagamentos deste centro)
          // Não incluir receita distribuída ou custos de produtos (isso é artificial)
          const custosTotais = custosOperacionais;
          
          // Rentabilidade: calcular proporção do custo em relação ao total
          // (não faz sentido calcular rentabilidade sem receita associada ao centro)
          const rentabilidade = 0;
          const margem = 0;
          
          costCenterProfitability.push({
            id: centroId,
            name: centro.nome || `Centro ${centroId}`,
            revenue: 0, // Centros de custo não geram receita diretamente
            costs: Math.round(custosOperacionais), // Apenas custos operacionais REAIS dos pagamentos
            profitability: rentabilidade,
            margin: margem
          });
        }
      });
      
      // Ordenar por custos (maiores gastadores primeiro)
      costCenterProfitability.sort((a, b) => b.costs - a.costs);
      
      estimativas.push(`Rentabilidade por Centro de Custo: ${costCenterProfitability.length} centros de custo com pagamentos identificados`);
    } else {
      // Se não temos centros de custo disponíveis, criar lista vazia
      estimativas.push('Centros de Custo: Nenhum centro de custo oficial disponível');
    }
    
    // =======================================================================
    // MONTAR RESPOSTA FINAL
    // =======================================================================
    
    const operationalMetrics: OperationalMetrics = {
      costRevenueRatio: Math.round(costRevenueRatio * 100) / 100,
      customerAcquisitionCost: Math.round(customerAcquisitionCost * 100) / 100,
      costCenterProfitability,
      details: {
        totalReceita: Math.round(totalReceita),
        totalCustos: Math.round(totalCustos),
        totalCustosProdutos: Math.round(totalCustosProdutos),
        totalDespesasOperacionais: Math.round(totalDespesasOperacionais),
        novosClientes,
        investimentoMarketing: Math.round(investimentoMarketing)
      },
      lastUpdated: new Date().toISOString(),
      _metadata: {
        dataSource: 'api',
        centrosCustoDisponivel,
        pagamentosDisponivel,
        usandoEstimativas: estimativas.length > 0,
        estimativas: estimativas.length > 0 ? estimativas : undefined,
        periodo: {
          inicio: format(dataInicio, 'yyyy-MM-dd'),
          fim: format(dataFim, 'yyyy-MM-dd')
        },
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('[CEO Operational Metrics] ✅ Análise concluída:', {
      costRevenueRatio: Math.round(costRevenueRatio * 100) / 100,
      customerAcquisitionCost: Math.round(customerAcquisitionCost * 100) / 100,
      centrosCusto: costCenterProfitability.length,
      usandoEstimativas: estimativas.length > 0
    });
    
    if (estimativas.length > 0) {
      console.warn('[CEO Operational Metrics] ⚠️  Usando estimativas:', estimativas);
    }
    
    return NextResponse.json(operationalMetrics);
    
  } catch (error) {
    console.error('[CEO Operational Metrics] ❌ Erro:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Retornar erro estruturado
    return NextResponse.json(
      {
        erro: 'Erro ao processar métricas operacionais',
        mensagem: errorMessage,
        costRevenueRatio: 0,
        customerAcquisitionCost: 0,
        costCenterProfitability: [],
        lastUpdated: new Date().toISOString(),
        _metadata: {
          dataSource: 'error' as const,
          centrosCustoDisponivel: false,
          pagamentosDisponivel: false,
          usandoEstimativas: false,
          periodo: {
            inicio: '',
            fim: ''
          },
          timestamp: new Date().toISOString(),
          error: errorMessage
        }
      } as OperationalMetrics,
      { status: 500 }
    );
  }
}
