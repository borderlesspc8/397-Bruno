import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Usar variáveis de ambiente para configuração
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton para cliente do browser - GLOBAL para evitar múltiplas instâncias
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

// Singleton para cliente do servidor
let supabaseServerClient: ReturnType<typeof createSupabaseClient> | null = null

// Flag para controlar logs de criação
let isClientCreated = false

// Função para criar cliente Supabase (para compatibilidade) - OTIMIZADA
export function createClient() {
  // Se estiver no browser, usar o singleton do cliente
  if (typeof window !== 'undefined') {
    if (!supabaseClient) {
      if (!isClientCreated) {
        console.log('🔧 Criando instância única do cliente Supabase para o browser');
        isClientCreated = true
      }
      supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          // Configurações adicionais para evitar múltiplas instâncias
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          storageKey: 'supabase.auth.token'
        }
      })
    }
    return supabaseClient
  }
  
  // Se estiver no servidor, usar o singleton do servidor
  if (!supabaseServerClient) {
    supabaseServerClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabaseServerClient
}

// Cliente do Supabase para uso no cliente (browser) - singleton
// Removido para evitar múltiplas instâncias - usar createClient() diretamente

// Configuração para SSR (Server-Side Rendering) - singleton
export const supabaseServer = (() => {
  if (!supabaseServerClient) {
    supabaseServerClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabaseServerClient
})()

// Tipos TypeScript para as tabelas
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string | null
          email: string
          email_verified: string | null
          image: string | null
          password: string | null
          created_at: string | null
          updated_at: string | null
          auth_provider: string | null
          role: string | null
          current_wallet_id: string | null
          is_onboarded: boolean | null
          is_terms_accepted: boolean | null
          last_login: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          email: string
          email_verified?: string | null
          image?: string | null
          password?: string | null
          created_at?: string | null
          updated_at?: string | null
          auth_provider?: string | null
          role?: string | null
          current_wallet_id?: string | null
          is_onboarded?: boolean | null
          is_terms_accepted?: boolean | null
          last_login?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          email_verified?: string | null
          image?: string | null
          password?: string | null
          created_at?: string | null
          updated_at?: string | null
          auth_provider?: string | null
          role?: string | null
          current_wallet_id?: string | null
          is_onboarded?: boolean | null
          is_terms_accepted?: boolean | null
          last_login?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          name: string
          type: string
          amount: number
          date: string
          description: string | null
          category: string | null
          metadata: any | null
          created_at: string | null
          updated_at: string | null
          user_id: string
          external_id: string | null
          wallet_id: string
          category_id: string | null
          budget_id: string | null
          attachments: string[] | null
          is_recurrent: boolean | null
          recurrence_id: string | null
          status: string | null
          tags: string[] | null
          is_reconciled: boolean | null
          reconciliation_data: any | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          amount: number
          date: string
          description?: string | null
          category?: string | null
          metadata?: any | null
          created_at?: string | null
          updated_at?: string | null
          user_id: string
          external_id?: string | null
          wallet_id: string
          category_id?: string | null
          budget_id?: string | null
          attachments?: string[] | null
          is_recurrent?: boolean | null
          recurrence_id?: string | null
          status?: string | null
          tags?: string[] | null
          is_reconciled?: boolean | null
          reconciliation_data?: any | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          amount?: number
          date?: string
          description?: string | null
          category?: string | null
          metadata?: any | null
          created_at?: string | null
          updated_at?: string | null
          user_id?: string
          external_id?: string | null
          wallet_id?: string
          category_id?: string | null
          budget_id?: string | null
          attachments?: string[] | null
          is_recurrent?: boolean | null
          recurrence_id?: string | null
          status?: string | null
          tags?: string[] | null
          is_reconciled?: boolean | null
          reconciliation_data?: any | null
        }
      }
      vendas: {
        Row: {
          id: string
          cliente_id: string
          cliente_nome: string
          valor_total: number
          status: string
          user_id: string | null
          vendedor_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          cliente_id: string
          cliente_nome: string
          valor_total: number
          status: string
          user_id?: string | null
          vendedor_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          cliente_id?: string
          cliente_nome?: string
          valor_total?: number
          status?: string
          user_id?: string | null
          vendedor_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      vendedores: {
        Row: {
          id: string
          nome: string
          email: string | null
          telefone: string | null
          user_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nome: string
          email?: string | null
          telefone?: string | null
          user_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          email?: string | null
          telefone?: string | null
          user_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}
