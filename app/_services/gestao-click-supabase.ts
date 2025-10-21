import { createClient } from '@/app/_lib/supabase'

// Criar instância única do Supabase
const supabase = createClient()

export interface VendaIntegrada {
  id: string
  cliente_id: string
  cliente_nome: string
  valor_total: number
  status: string
  user_id: string
  vendedor_id?: string
  vendedor_nome?: string
  data_venda: string
  produtos?: Array<{
    id: string
    nome: string
    quantidade: number
    preco_unitario: number
    total: number
    valor_custo?: number
  }>
  // Dados de canal e origem
  canal_venda?: string
  origem?: string
  como_nos_conheceu?: string
  // Dados do Gestão Click
  external_id?: string
  source: 'gestao-click' | 'betel-tecnologia' | 'manual'
  metadata?: any
}

export interface VendedorIntegrado {
  id: string
  nome: string
  email?: string
  telefone?: string
  user_id: string
  // Dados do Gestão Click
  external_id?: string
  cargo?: string
  loja_id?: string
  loja_nome?: string
  source: 'gestao-click' | 'betel-tecnologia' | 'manual'
  metadata?: any
}

export class GestaoClickSupabaseService {
  // Cache em memória para evitar chamadas duplicadas - OTIMIZADO PARA DADOS FRESCOS
  private static requestCache = new Map<string, { timestamp: number, data: any }>()
  private static readonly CACHE_TTL = 60000 // 1 minuto para dados mais frescos
  private static readonly FORCE_REFRESH_INTERVAL = 30000 // 30 segundos para forçar refresh

  /**
   * Sincroniza vendas do Gestão Click com o Supabase
   */
  static async sincronizarVendas(params: {
    dataInicio: Date
    dataFim: Date
    userId: string
    forceUpdate?: boolean
  }): Promise<{
    vendas: VendaIntegrada[]
    totalVendas: number
    totalValor: number
    vendedores: VendedorIntegrado[]
    produtosMaisVendidos: any[]
    syncInfo: {
      lastSync: string
      source: 'supabase-cache' | 'gestao-click' | 'gestao-click-direct'
      cacheHit: boolean
    }
  }> {
    try {
      console.log('Iniciando sincronização Gestão Click + Supabase:', params)

      // Verificar cache em memória primeiro - ESTRATÉGIA OTIMIZADA
      const cacheKey = `sync-${params.userId}-${params.dataInicio.toISOString()}-${params.dataFim.toISOString()}-${params.forceUpdate}`
      const cachedRequest = this.requestCache.get(cacheKey)
      
      // Para tabs críticas (Formas de Pagamento, Origem, Canal), sempre buscar dados frescos
      const shouldForceRefresh = params.forceUpdate || 
        (cachedRequest && (Date.now() - cachedRequest.timestamp) > this.FORCE_REFRESH_INTERVAL)
      
      if (cachedRequest && !shouldForceRefresh) {
        const now = Date.now()
        if (now - cachedRequest.timestamp < this.CACHE_TTL) {
          console.log('📦 [GestaoClickSupabase] Usando cache em memória (dados frescos)')
          return {
            ...cachedRequest.data,
            syncInfo: {
              ...cachedRequest.data.syncInfo,
              source: 'gestao-click-direct' as const,
              cacheHit: true
            }
          }
        } else {
          // Cache expirado, remover
          this.requestCache.delete(cacheKey)
        }
      }

      // 1. Verificar cache no Supabase (APENAS se não for refresh forçado)
      if (!shouldForceRefresh) {
        const cachedData = await this.buscarCacheVendas(params)
        if (cachedData) {
          console.log('📦 [GestaoClickSupabase] Usando cache do Supabase')
          return {
            ...cachedData,
            syncInfo: {
              lastSync: cachedData.timestamp || new Date().toISOString(),
              source: 'supabase-cache' as const,
              cacheHit: true
            }
          }
        }
      } else {
        console.log('🔄 [GestaoClickSupabase] Forçando busca de dados frescos (sem cache)')
      }

      // 2. Buscar dados do Gestão Click via API route
      console.log('Buscando dados do Gestão Click via API...', {
        dataInicio: params.dataInicio.toISOString(),
        dataFim: params.dataFim.toISOString(),
        userId: params.userId
      })
      
      // Usar URL absoluta para evitar problemas de roteamento
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000'
      const apiUrl = `${baseUrl}/api/gestao-click/sync`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataInicio: params.dataInicio.toISOString(),
          dataFim: params.dataFim.toISOString(),
          userId: params.userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao buscar dados do Gestão Click: ${errorData.error || 'Erro desconhecido'}`);
      }

      const gestaoClickData = await response.json();

      if (gestaoClickData.erro) {
        throw new Error(`Erro ao buscar dados do Gestão Click: ${gestaoClickData.erro}`);
      }

      // 3. Transformar dados do Gestão Click para formato Supabase
      const vendasIntegradas = await this.transformarVendasGestaoClick(
        gestaoClickData.vendas,
        params.userId
      )

      const vendedoresIntegrados = await this.transformarVendedoresGestaoClick(
        gestaoClickData.vendedores || [],
        params.userId
      )

      // 4. SINCRONIZAÇÃO COM SUPABASE DESABILITADA TEMPORARIAMENTE
      // Buscando dados diretamente do Gestão Click sem armazenar no Supabase
      console.log('⚠️ SINCRONIZAÇÃO COM SUPABASE SUSPENSA - Dados em tempo real do Gestão Click')
      // await this.sincronizarVendasComSupabase(vendasIntegradas)
      // await this.sincronizarVendedoresComSupabase(vendedoresIntegrados)

      // 5. Calcular métricas
      const totalVendas = gestaoClickData.totalVendas
      const totalValor = gestaoClickData.totalValor
      const ticketMedio = totalVendas > 0 ? totalValor / totalVendas : 0

      // 6. Salvar no cache do Supabase (apenas se não for forceUpdate)
      if (!shouldForceRefresh) {
        await this.salvarCacheVendas(params, {
          vendas: vendasIntegradas,
          totalVendas,
          totalValor,
          vendedores: vendedoresIntegrados,
          produtosMaisVendidos: gestaoClickData.produtos || []
        })
      } else {
        console.log('🚫 [GestaoClickSupabase] Pulando cache do Supabase (refresh forçado)')
      }

      console.log('Sincronização concluída com sucesso:', {
        totalVendas,
        totalValor,
        vendedoresCount: vendedoresIntegrados.length,
        produtosCount: gestaoClickData.produtos?.length || 0
      })

      const result = {
        vendas: vendasIntegradas,
        totalVendas,
        totalValor,
        vendedores: vendedoresIntegrados,
        produtosMaisVendidos: gestaoClickData.produtos || [],
        syncInfo: {
          lastSync: new Date().toISOString(),
          source: 'gestao-click-direct' as const, // Indicando dados diretos sem Supabase
          cacheHit: false
        }
      }

      // Salvar no cache em memória para evitar chamadas duplicadas (sempre salvar)
      this.requestCache.set(cacheKey, {
        timestamp: Date.now(),
        data: result
      })
      
      // Limpar cache antigo se necessário
      if (this.requestCache.size > 10) {
        const oldestKey = Array.from(this.requestCache.keys())[0]
        this.requestCache.delete(oldestKey)
      }

      return result

    } catch (error) {
      console.error('Erro na sincronização Gestão Click + Supabase:', error)
      throw error
    }
  }

  /**
   * Transforma vendas do Gestão Click para formato Supabase
   */
  private static async transformarVendasGestaoClick(
    vendas: any[],
    userId: string
  ): Promise<VendaIntegrada[]> {
    console.log('🔍 [GestaoClickSupabase] Transformando vendas do Gestão Click:', {
      totalVendas: vendas.length,
      primeirasVendas: vendas.slice(0, 3).map(v => ({
        id: v.id,
        valor_total: v.valor_total,
        valor_custo: v.valor_custo,
        desconto_valor: v.desconto_valor,
        valor_frete: v.valor_frete,
        canal_venda: v.canal_venda,
        origem: v.origem,
        como_nos_conheceu: v.como_nos_conheceu,
        // Verificar campos relacionados a canal/origem
        canal: v.canal,
        origem_venda: v.origem_venda,
        origem_lead: v.origem_lead,
        como_conheceu: v.como_conheceu,
        fonte: v.fonte,
        meio: v.meio,
        camposDisponiveis: Object.keys(v)
      }))
    });

    return vendas.map(venda => {
      const vendaTransformada = {
        id: `gc-${venda.id || Math.random().toString(36).substr(2, 9)}`,
        cliente_id: venda.cliente_id || `cliente-${Math.random().toString(36).substr(2, 9)}`,
        cliente_nome: venda.cliente_nome || venda.nome_cliente || 'Cliente não informado',
        valor_total: parseFloat(venda.valor_total || venda.valor_liquido || '0'),
        status: this.mapearStatusGestaoClick(venda.nome_situacao),
        user_id: userId,
        vendedor_id: venda.vendedor_id ? `gc-${venda.vendedor_id}` : undefined,
        vendedor_nome: venda.nome_vendedor,
        data_venda: venda.data || venda.data_venda,
        // ✅ ADICIONAR centro_custo_id no objeto principal
        centro_custo_id: venda.centro_custo_id,
        nome_centro_custo: venda.nome_centro_custo,
        // Adicionar campos financeiros diretamente no objeto principal
        valor_custo: parseFloat(venda.valor_custo || '0'),
        desconto_valor: parseFloat(venda.desconto_valor || '0'),
        valor_frete: parseFloat(venda.valor_frete || '0'),
        produtos: (venda.produtos || venda.itens) ? (venda.produtos || venda.itens).map((produto: any) => ({
          id: produto.id || produto.produto_id || Math.random().toString(36).substr(2, 9),
          nome: produto.descricao || produto.nome || produto.produto || 'Produto não informado',
          quantidade: parseInt(produto.quantidade || '1'),
          preco_unitario: parseFloat(produto.valor_unitario || produto.preco_unitario || produto.valor_venda || '0'),
          total: parseFloat(produto.quantidade || '1') * parseFloat(produto.valor_unitario || produto.preco_unitario || produto.valor_venda || '0'),
          valor_custo: parseFloat(produto.valor_custo || '0')
        })) : [],
        // Incluir dados de pagamentos
        pagamentos: venda.pagamentos || [],
        forma_pagamento: venda.forma_pagamento,
        metodo_pagamento: venda.metodo_pagamento,
        // Incluir dados de canal e origem - usando os campos corretos da API
        canal_venda: venda.nome_canal_venda || venda.canal_venda || venda.canal || venda.origem_venda || venda.fonte || venda.meio || venda.canal_vendas,
        origem: venda.origem || venda.como_nos_conheceu || venda.origem_lead || venda.como_conheceu || venda.fonte_origem || venda.origem_cliente,
        como_nos_conheceu: this.extrairComoNosConheceu(venda) || venda.como_nos_conheceu || venda.origem || venda.canal_venda || venda.como_conheceu || venda.fonte || venda.meio_conheceu,
        external_id: venda.id?.toString(),
        source: 'gestao-click' as const,
        metadata: {
          valor_custo: venda.valor_custo,
          desconto_valor: venda.desconto_valor,
          valor_frete: venda.valor_frete,
          situacao_id: venda.situacao_id,
          loja_id: venda.loja_id,
          loja_nome: venda.loja_nome,
          // ✅ ADICIONAR centro_custo (mesmo que vazio)
          centro_custo_id: venda.centro_custo_id,
          nome_centro_custo: venda.nome_centro_custo,
          plano_conta_id: venda.plano_conta_id,
          nome_plano_conta: venda.nome_plano_conta,
          pagamentos: venda.pagamentos,
          forma_pagamento: venda.forma_pagamento,
          metodo_pagamento: venda.metodo_pagamento,
          canal_venda: venda.canal_venda,
          nome_canal_venda: venda.nome_canal_venda,
          origem: venda.origem,
          como_nos_conheceu: venda.como_nos_conheceu,
          // Campos alternativos para debug
          canal: venda.canal,
          origem_venda: venda.origem_venda,
          origem_lead: venda.origem_lead,
          como_conheceu: venda.como_conheceu,
          fonte: venda.fonte,
          meio: venda.meio,
          atributos: venda.atributos
        }
      };

      // Log das primeiras vendas transformadas
      if (venda.id && vendas.indexOf(venda) < 3) {
        console.log(`💰 [GestaoClickSupabase] Venda ${venda.id} transformada:`, {
          original: {
            valor_total: venda.valor_total,
            valor_custo: venda.valor_custo,
            desconto_valor: venda.desconto_valor,
            valor_frete: venda.valor_frete,
            pagamentos: venda.pagamentos?.length || 0,
            forma_pagamento: venda.forma_pagamento,
            metodo_pagamento: venda.metodo_pagamento,
            produtos: venda.produtos?.length || 0,
            itens: venda.itens?.length || 0,
            canal_venda: venda.canal_venda,
            origem: venda.origem,
            como_nos_conheceu: venda.como_nos_conheceu
          },
          transformada: {
            valor_total: vendaTransformada.valor_total,
            valor_custo: vendaTransformada.valor_custo,
            desconto_valor: vendaTransformada.desconto_valor,
            valor_frete: vendaTransformada.valor_frete,
            pagamentos: vendaTransformada.pagamentos?.length || 0,
            forma_pagamento: vendaTransformada.forma_pagamento,
            metodo_pagamento: vendaTransformada.metodo_pagamento,
            produtos: vendaTransformada.produtos?.length || 0,
            canal_venda: vendaTransformada.canal_venda,
            origem: vendaTransformada.origem,
            como_nos_conheceu: vendaTransformada.como_nos_conheceu
          }
        });
      }

      return vendaTransformada;
    })
  }

  /**
   * Transforma vendedores do Gestão Click para formato Supabase
   */
  private static async transformarVendedoresGestaoClick(
    vendedores: any[],
    userId: string
  ): Promise<VendedorIntegrado[]> {
    return vendedores.map(vendedor => ({
      id: `gc-${vendedor.id}`,
      nome: vendedor.nome || 'Vendedor não informado',
      email: vendedor.email,
      telefone: vendedor.telefone,
      user_id: userId,
      external_id: vendedor.id?.toString(),
      cargo: vendedor.cargo_nome,
      loja_id: vendedor.loja_id,
      loja_nome: vendedor.loja_nome,
      source: 'gestao-click' as const,
      metadata: {
        cargo_id: vendedor.cargo_id,
        ativo: vendedor.ativo,
        data_admissao: vendedor.data_admissao
      }
    }))
  }

  /**
   * Mapeia status do Gestão Click para status padronizado
   */
  private static mapearStatusGestaoClick(situacao: string): string {
    const statusMap: Record<string, string> = {
      'Concretizada': 'Concretizada',
      'Em andamento': 'Em andamento',
      'Cancelada': 'Cancelada',
      'Pendente': 'Pendente',
      'Aprovada': 'Concretizada',
      'Confirmada': 'Concretizada'
    }

    return statusMap[situacao] || 'Pendente'
  }

  /**
   * Sincroniza vendas com Supabase (upsert)
   */
  private static async sincronizarVendasComSupabase(vendas: VendaIntegrada[]): Promise<void> {
    try {
      console.log(`Sincronizando ${vendas.length} vendas com Supabase...`)

      for (const venda of vendas) {
        try {
          // Primeiro, tentar buscar se a venda já existe
          const { data: existingVenda } = await supabase
            .from('vendas')
            .select('id')
            .eq('id', venda.id)
            .single()

          if (existingVenda) {
            // Se existe, fazer update
            const { error } = await supabase
              .from('vendas')
              .update({
                cliente_id: venda.cliente_id,
                cliente_nome: venda.cliente_nome,
                valor_total: venda.valor_total,
                status: venda.status,
                user_id: venda.user_id,
                vendedor_id: venda.vendedor_id,
                updated_at: new Date().toISOString()
              })
              .eq('id', venda.id)

            if (error) {
              console.error('Erro ao atualizar venda:', error)
            }
          } else {
            // Se não existe, fazer insert
            const { error } = await supabase
              .from('vendas')
              .insert({
                id: venda.id,
                cliente_id: venda.cliente_id,
                cliente_nome: venda.cliente_nome,
                valor_total: venda.valor_total,
                status: venda.status,
                user_id: venda.user_id,
                vendedor_id: venda.vendedor_id,
                created_at: venda.data_venda,
                updated_at: new Date().toISOString()
              })

            if (error) {
              console.error('Erro ao inserir venda:', error)
            }
          }

          // Sincronizar produtos da venda
          if (venda.produtos && venda.produtos.length > 0) {
            await this.sincronizarProdutosComSupabase(venda.produtos, venda.id)
          }
        } catch (error) {
          console.error('Erro ao processar venda individual:', error)
          // Continuar com a próxima venda mesmo se uma falhar
        }
      }

      console.log('Vendas sincronizadas com Supabase com sucesso')
    } catch (error) {
      console.error('Erro ao sincronizar vendas com Supabase:', error)
      // Não fazer throw para evitar quebrar todo o processo
    }
  }

  /**
   * Sincroniza vendedores com Supabase (upsert)
   */
  private static async sincronizarVendedoresComSupabase(vendedores: VendedorIntegrado[]): Promise<void> {
    try {
      console.log(`Sincronizando ${vendedores.length} vendedores com Supabase...`)

      for (const vendedor of vendedores) {
        const { error } = await supabase
          .from('vendedores')
          .upsert({
            id: vendedor.id,
            nome: vendedor.nome,
            email: vendedor.email,
            telefone: vendedor.telefone,
            user_id: vendedor.user_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })

        if (error) {
          console.error('Erro ao sincronizar vendedor:', error)
        }
      }

      console.log('Vendedores sincronizados com Supabase com sucesso')
    } catch (error) {
      console.error('Erro ao sincronizar vendedores com Supabase:', error)
      throw error
    }
  }

  /**
   * Sincroniza produtos com Supabase
   */
  private static async sincronizarProdutosComSupabase(produtos: any[], vendaId: string): Promise<void> {
    try {
      for (const produto of produtos) {
        try {
          const produtoId = `gc-${produto.id}`
          
          // Primeiro, tentar buscar se o produto já existe
          const { data: existingProduto } = await supabase
            .from('produtos')
            .select('id')
            .eq('id', produtoId)
            .single()

          if (existingProduto) {
            // Se existe, fazer update
            const { error } = await supabase
              .from('produtos')
              .update({
                nome: produto.nome,
                descricao: produto.nome,
                preco_unitario: produto.preco_unitario,
                quantidade: produto.quantidade,
                categoria: 'Categoria não informada',
                venda_id: vendaId,
                updated_at: new Date().toISOString()
              })
              .eq('id', produtoId)

            if (error) {
              console.error('Erro ao atualizar produto:', error)
            }
          } else {
            // Se não existe, fazer insert
            const { error } = await supabase
              .from('produtos')
              .insert({
                id: produtoId,
                nome: produto.nome,
                descricao: produto.nome,
                preco_unitario: produto.preco_unitario,
                quantidade: produto.quantidade,
                categoria: 'Categoria não informada',
                venda_id: vendaId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })

            if (error) {
              console.error('Erro ao inserir produto:', error)
            }
          }
        } catch (error) {
          console.error('Erro ao processar produto individual:', error)
          // Continuar com o próximo produto mesmo se um falhar
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar produtos com Supabase:', error)
      // Não fazer throw para evitar quebrar todo o processo
    }
  }

  /**
   * Busca cache de vendas no Supabase
   */
  private static async buscarCacheVendas(params: {
    dataInicio: Date
    dataFim: Date
    userId: string
  }): Promise<any> {
    try {
      const cacheKey = `vendas-cache-${params.userId}-${params.dataInicio.toISOString().split('T')[0]}-${params.dataFim.toISOString().split('T')[0]}`
      
      console.log('Buscando cache com chave:', cacheKey)
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', cacheKey)
        .maybeSingle()

      if (error) {
        console.error('Erro ao buscar cache no Supabase:', error)
        return null
      }

      if (!data || !data.value) {
        console.log('Cache não encontrado')
        return null
      }

      const cachedData = JSON.parse(data.value)
      
      // Verificar se o cache não expirou (2 minutos para dados mais frescos)
      const cacheAge = Date.now() - new Date(cachedData.timestamp).getTime()
      if (cacheAge > 2 * 60 * 1000) {
        console.log('Cache expirado, buscando dados frescos')
        return null
      }

      console.log('Cache encontrado e válido')
      return cachedData
    } catch (error) {
      console.error('Erro ao buscar cache:', error)
      return null
    }
  }

  /**
   * Salva cache de vendas no Supabase
   */
  private static async salvarCacheVendas(params: {
    dataInicio: Date
    dataFim: Date
    userId: string
  }, data: any): Promise<void> {
    try {
      const cacheKey = `vendas-cache-${params.userId}-${params.dataInicio.toISOString().split('T')[0]}-${params.dataFim.toISOString().split('T')[0]}`
      
      const cacheData = {
        ...data,
        timestamp: new Date().toISOString()
      }

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: cacheKey,
          value: JSON.stringify(cacheData),
          updated_by: params.userId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        })

      if (error) {
        console.error('Erro ao salvar cache:', error)
      } else {
        console.log('Cache salvo com sucesso')
      }
    } catch (error) {
      console.error('Erro ao salvar cache:', error)
    }
  }

  /**
   * Configura subscription em tempo real para vendas
   */
  static async subscribeVendasRealtime(
    params: {
      dataInicio: Date
      dataFim: Date
      userId: string
    },
    callback: (payload: any) => void
  ) {
    try {
      console.log('Configurando subscription em tempo real para vendas...')

      const subscription = supabase
        .channel('vendas-gestao-click-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'vendas',
            filter: `user_id=eq.${params.userId}`
          },
          (payload) => {
            console.log('Mudança detectada nas vendas:', payload)
            callback(payload)
          }
        )
        .subscribe()

      return subscription
    } catch (error) {
      console.error('Erro ao configurar subscription em tempo real:', error)
      throw error
    }
  }

  /**
   * Extrai o valor de "Como nos conheceu" dos atributos da venda
   */
  private static extrairComoNosConheceu(venda: any): string | null {
    if (!venda.atributos || !Array.isArray(venda.atributos)) {
      return null;
    }

    const atributoComoConheceu = venda.atributos.find((attr: any) => 
      attr.atributo && 
      attr.atributo.descricao && 
      attr.atributo.descricao.toLowerCase().includes('como nos conheceu')
    );

    return atributoComoConheceu?.atributo?.conteudo || null;
  }

  /**
   * Limpa todo o cache em memória - útil para forçar dados frescos
   */
  static limparCacheMemoria(): void {
    console.log('🗑️ [GestaoClickSupabase] Limpando cache em memória')
    this.requestCache.clear()
  }

  /**
   * Limpa cache específico por usuário
   */
  static limparCacheUsuario(userId: string): void {
    console.log(`🗑️ [GestaoClickSupabase] Limpando cache do usuário: ${userId}`)
    for (const [key] of this.requestCache.entries()) {
      if (key.includes(userId)) {
        this.requestCache.delete(key)
      }
    }
  }

  /**
   * Força atualização de dados sem usar cache
   */
  static async sincronizarVendasSemCache(params: {
    dataInicio: Date
    dataFim: Date
    userId: string
  }): Promise<{
    vendas: VendaIntegrada[]
    totalVendas: number
    totalValor: number
    vendedores: VendedorIntegrado[]
    produtosMaisVendidos: any[]
    syncInfo: {
      lastSync: string
      source: 'gestao-click' | 'gestao-click-direct'
      cacheHit: boolean
    }
  }> {
    console.log('🔄 [GestaoClickSupabase] Sincronização forçada (sem cache)')
    return this.sincronizarVendas({
      ...params,
      forceUpdate: true
    })
  }
}
