import { createBrowserClient } from '@supabase/ssr'

// Usar variáveis de ambiente para configuração
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton para cliente do browser - GLOBAL para evitar múltiplas instâncias
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

// Flag para controlar logs de criação
let isClientCreated = false

// Função para criar cliente Supabase no browser usando SSR com cookies
export function createClient() {
  // Durante o SSR no Next.js, alguns componentes são renderizados no servidor
  // Nesse caso, retornamos um cliente mock que será substituído no client-side
  if (typeof window === 'undefined') {
    // Retornar um cliente básico para SSR que não faz nada
    // O cliente real será criado quando o componente for hidratado no browser
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  
  // Se estiver no browser, usar o singleton do cliente com suporte a cookies
  if (!supabaseClient) {
    if (!isClientCreated) {
      console.log('🔧 Criando instância única do cliente Supabase para o browser com suporte a cookies');
      isClientCreated = true
    }
    
    // Usar createBrowserClient do @supabase/ssr para suporte completo a cookies
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}

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
