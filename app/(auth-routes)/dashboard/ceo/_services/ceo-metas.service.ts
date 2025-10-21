/**
 * 🎯 CEO DASHBOARD - METAS SERVICE
 * 
 * Serviço para CRUD e cálculos de metas financeiras
 * Utiliza tabela metas_financeiras no Supabase
 */

import { createClient } from '@supabase/supabase-js';
import type {
  Meta,
  MetaFormData,
  MetasListResponse,
  MetaResponse,
  MetasResumo,
  MetasFiltros,
  MetasOrdenacao,
  MetaCalculada,
  MetaEvolucao,
  MetaHeatmap,
} from '../_types/metas.types';
import { GestaoClickSupabaseService } from '@/app/_services/gestao-click-supabase';
import {
  calcularDiasPeriodo,
  calcularPercentualDiasDecorridos,
  extrairMesAno,
  criarDataMesAno,
  obterInicioFimMes,
  obterUltimosNMesesPeriodos,
} from '../_utils/date-helpers';
import { arredondarFinanceiro } from '../_utils/calculos-financeiros';

// Inicializar Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

class CEOMetasService {
  /**
   * Cria nova meta
   */
  static async criarMeta(userId: string, data: MetaFormData): Promise<MetaResponse> {
    console.log('[CEOMetasService] 🎯 Criando nova meta', { tipo: data.tipo });
    
    try {
      const { mes, ano } = extrairMesAno(new Date(data.periodo + '-01'));
      const { inicio: dataInicio, fim: dataFim } = obterInicioFimMes(criarDataMesAno(mes, ano));
      
      const metaData = {
        user_id: userId,
        tipo: data.tipo,
        nome: data.nome,
        descricao: data.descricao,
        valor_meta: data.valorMeta,
        unidade: data.unidade,
        periodo: data.periodo,
        centro_custo_id: data.centroCustoId,
        vendedor_id: data.vendedorId,
        loja_id: data.lojaId,
        produto_id: data.produtoId,
        categoria: data.categoria,
        cor: data.cor,
        icone: data.icone,
        prioridade: data.prioridade,
        visibilidade: data.visibilidade,
      };
      
      const { data: metaCriada, error } = await supabase
        .from('metas_financeiras')
        .insert(metaData)
        .select()
        .single();
      
      if (error) {
        console.error('[CEOMetasService] ❌ Erro ao criar meta:', error);
        return {
          success: false,
          error: error.message,
          timestamp: new Date(),
        };
      }
      
      // Calcular valores atuais
      const metaCompleta = await this.calcularValoresAtuais(metaCriada, userId);
      
      console.log('[CEOMetasService] ✅ Meta criada', { id: metaCriada.id });
      
      return {
        success: true,
        data: metaCompleta,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[CEOMetasService] ❌ Erro ao criar meta:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
      };
    }
  }
  
  /**
   * Atualiza meta existente
   */
  static async atualizarMeta(
    id: string,
    userId: string,
    data: Partial<MetaFormData>
  ): Promise<MetaResponse> {
    console.log('[CEOMetasService] 🎯 Atualizando meta', { id });
    
    try {
      const { data: metaAtualizada, error } = await supabase
        .from('metas_financeiras')
        .update({
          nome: data.nome,
          descricao: data.descricao,
          valor_meta: data.valorMeta,
          cor: data.cor,
          icone: data.icone,
          prioridade: data.prioridade,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          error: error.message,
          timestamp: new Date(),
        };
      }
      
      const metaCompleta = await this.calcularValoresAtuais(metaAtualizada, userId);
      
      console.log('[CEOMetasService] ✅ Meta atualizada');
      
      return {
        success: true,
        data: metaCompleta,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
      };
    }
  }
  
  /**
   * Deleta meta
   */
  static async deletarMeta(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
    console.log('[CEOMetasService] 🎯 Deletando meta', { id });
    
    try {
      const { error } = await supabase
        .from('metas_financeiras')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      console.log('[CEOMetasService] ✅ Meta deletada');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }
  
  /**
   * Busca meta por ID
   */
  static async buscarMeta(id: string, userId: string): Promise<MetaResponse> {
    try {
      const { data: meta, error } = await supabase
        .from('metas_financeiras')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      
      if (error) {
        return {
          success: false,
          error: error.message,
          timestamp: new Date(),
        };
      }
      
      const metaCompleta = await this.calcularValoresAtuais(meta, userId);
      
      return {
        success: true,
        data: metaCompleta,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
      };
    }
  }
  
  /**
   * Lista metas com filtros
   */
  static async listarMetas(
    filtros: MetasFiltros,
    ordenacao?: MetasOrdenacao
  ): Promise<MetasListResponse> {
    console.log('[CEOMetasService] 🎯 Listando metas');
    
    try {
      let query = supabase
        .from('metas_financeiras')
        .select('*')
        .eq('user_id', filtros.userId);
      
      // Aplicar filtros
      if (filtros.tipos && filtros.tipos.length > 0) {
        query = query.in('tipo', filtros.tipos);
      }
      
      if (filtros.periodos && filtros.periodos.length > 0) {
        query = query.in('periodo', filtros.periodos);
      }
      
      if (filtros.centroCustoIds && filtros.centroCustoIds.length > 0) {
        query = query.in('centro_custo_id', filtros.centroCustoIds);
      }
      
      if (filtros.vendedorIds && filtros.vendedorIds.length > 0) {
        query = query.in('vendedor_id', filtros.vendedorIds);
      }
      
      if (filtros.lojaIds && filtros.lojaIds.length > 0) {
        query = query.in('loja_id', filtros.lojaIds);
      }
      
      // Ordenação
      if (ordenacao) {
        query = query.order(ordenacao.campo, { ascending: ordenacao.direcao === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      const { data: metas, error } = await query;
      
      if (error) {
        return {
          success: false,
          data: [],
          total: 0,
          error: error.message,
          timestamp: new Date(),
        };
      }
      
      // Calcular valores atuais para cada meta
      const metasCompletas = await Promise.all(
        metas.map(meta => this.calcularValoresAtuais(meta, filtros.userId))
      );
      
      // Aplicar filtro de status (após cálculo)
      let metasFiltradas = metasCompletas;
      if (filtros.status && filtros.status.length > 0) {
        metasFiltradas = metasCompletas.filter(m => filtros.status!.includes(m.status));
      }
      
      console.log('[CEOMetasService] ✅ Metas listadas', { total: metasFiltradas.length });
      
      return {
        success: true,
        data: metasFiltradas,
        total: metasFiltradas.length,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
      };
    }
  }
  
  /**
   * Calcula resumo das metas
   */
  static async calcularResumoMetas(userId: string, periodo?: string): Promise<MetasResumo> {
    const filtros: MetasFiltros = {
      userId,
      periodos: periodo ? [periodo] : undefined,
    };
    
    const resultado = await this.listarMetas(filtros);
    
    if (!resultado.success || !resultado.data) {
      return {
        totalMetas: 0,
        metasAtingidas: 0,
        metasEmAndamento: 0,
        metasAtrasadas: 0,
        percentualGeralAtingido: 0,
        valorTotalMetas: 0,
        valorTotalAtual: 0,
        porTipo: {} as any,
        porStatus: {} as any,
      };
    }
    
    const metas = resultado.data;
    
    return {
      totalMetas: metas.length,
      metasAtingidas: metas.filter(m => m.status === 'atingido' || m.status === 'superado').length,
      metasEmAndamento: metas.filter(m => m.status === 'no_prazo' || m.status === 'acelerado').length,
      metasAtrasadas: metas.filter(m => m.status === 'atrasado').length,
      percentualGeralAtingido: metas.length > 0
        ? metas.reduce((sum, m) => sum + m.percentualAtingido, 0) / metas.length
        : 0,
      valorTotalMetas: metas.reduce((sum, m) => sum + m.valorMeta, 0),
      valorTotalAtual: metas.reduce((sum, m) => sum + m.valorAtual, 0),
      porTipo: {} as any,
      porStatus: {} as any,
    };
  }
  
  /**
   * Calcula evolução das metas
   */
  static async calcularEvolucaoMetas(userId: string, meses: number = 6): Promise<MetaEvolucao[]> {
    const periodos = obterUltimosNMesesPeriodos(meses);
    const evolucao: MetaEvolucao[] = [];
    
    for (const periodo of periodos) {
      const resumo = await this.calcularResumoMetas(userId, periodo);
      
      evolucao.push({
        periodo,
        totalMetas: resumo.totalMetas,
        metasAtingidas: resumo.metasAtingidas,
        metasNaoAtingidas: resumo.totalMetas - resumo.metasAtingidas,
        percentualSucesso: resumo.totalMetas > 0
          ? (resumo.metasAtingidas / resumo.totalMetas) * 100
          : 0,
        valorTotalMetas: resumo.valorTotalMetas,
        valorTotalAtingido: resumo.valorTotalAtual,
        ticketMedioMeta: resumo.totalMetas > 0
          ? resumo.valorTotalMetas / resumo.totalMetas
          : 0,
      });
    }
    
    return evolucao;
  }
  
  // ==========================================================================
  // MÉTODOS AUXILIARES
  // ==========================================================================
  
  /**
   * Calcula valores atuais da meta baseado em vendas reais
   */
  private static async calcularValoresAtuais(metaDb: any, userId: string): Promise<Meta> {
    const { mes, ano } = extrairMesAno(new Date(metaDb.periodo + '-01'));
    const { inicio: dataInicio, fim: dataFim } = obterInicioFimMes(criarDataMesAno(mes, ano));
    
    // Buscar vendas do período
    const resultado = await GestaoClickSupabaseService.sincronizarVendas({
      dataInicio,
      dataFim,
      userId,
      forceUpdate: false,
    });
    
    const vendas = resultado.vendas || [];
    
    // Calcular valor atual baseado no tipo da meta
    let valorAtual = 0;
    
    switch (metaDb.tipo) {
      case 'vendas':
        valorAtual = vendas.length;
        break;
      case 'receita':
        valorAtual = vendas.reduce((sum, v) => sum + v.valor_total, 0);
        break;
      case 'lucro':
        valorAtual = vendas.reduce((sum, v) => sum + (v.valor_total - (v.valor_custo || 0)), 0);
        break;
      case 'ticket_medio':
        valorAtual = vendas.length > 0
          ? vendas.reduce((sum, v) => sum + v.valor_total, 0) / vendas.length
          : 0;
        break;
      case 'novos_clientes':
        const clientesUnicos = new Set(vendas.map(v => v.cliente_id));
        valorAtual = clientesUnicos.size;
        break;
      default:
        valorAtual = 0;
    }
    
    // Calcular percentuais e status
    const percentualAtingido = metaDb.valor_meta > 0
      ? (valorAtual / metaDb.valor_meta) * 100
      : 0;
    
    const diasDecorridos = calcularDiasPeriodo(dataInicio, new Date());
    const diasTotais = calcularDiasPeriodo(dataInicio, dataFim);
    const percentualEsperado = calcularPercentualDiasDecorridos(dataInicio, new Date());
    
    const projecaoFinal = diasDecorridos > 0
      ? (valorAtual / diasDecorridos) * diasTotais
      : 0;
    
    // Determinar status
    let status: Meta['status'];
    if (percentualAtingido >= 100) {
      status = percentualAtingido > 110 ? 'superado' : 'atingido';
    } else if (percentualAtingido >= percentualEsperado) {
      status = percentualAtingido > percentualEsperado * 1.1 ? 'acelerado' : 'no_prazo';
    } else {
      status = 'atrasado';
    }
    
    return {
      id: metaDb.id,
      userId: metaDb.user_id,
      tipo: metaDb.tipo,
      nome: metaDb.nome,
      descricao: metaDb.descricao,
      valorMeta: metaDb.valor_meta,
      valorAtual: arredondarFinanceiro(valorAtual),
      unidade: metaDb.unidade,
      periodo: metaDb.periodo,
      dataInicio,
      dataFim,
      percentualAtingido: arredondarFinanceiro(percentualAtingido),
      percentualEsperado: arredondarFinanceiro(percentualEsperado),
      projecaoFinal: arredondarFinanceiro(projecaoFinal),
      diasDecorridos,
      diasTotais,
      status,
      centroCustoId: metaDb.centro_custo_id,
      vendedorId: metaDb.vendedor_id,
      lojaId: metaDb.loja_id,
      produtoId: metaDb.produto_id,
      categoria: metaDb.categoria,
      cor: metaDb.cor,
      icone: metaDb.icone,
      prioridade: metaDb.prioridade,
      visibilidade: metaDb.visibilidade,
      createdAt: new Date(metaDb.created_at),
      updatedAt: new Date(metaDb.updated_at),
    };
  }
}

export default CEOMetasService;


