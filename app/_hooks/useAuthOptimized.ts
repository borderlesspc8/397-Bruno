import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/app/_lib/supabase'

export interface AuthUser {
  id: string
  email: string
  name: string
  image?: string
  isActive?: boolean
}

// Singleton para o cliente Supabase - evita múltiplas instâncias
let supabaseInstance: ReturnType<typeof createClient> | null = null

const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient()
  }
  return supabaseInstance
}

export function useAuthOptimized() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Usar singleton para evitar múltiplas instâncias
  const supabase = useMemo(() => getSupabaseClient(), [])
  
  // Callback otimizado para atualizar usuário
  const updateUser = useCallback((session: any) => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
        image: session.user.user_metadata?.avatar_url,
        isActive: true,
      })
    } else {
      setUser(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let mounted = true
    let authSubscription: any = null

    const initializeAuth = async () => {
      try {
        // Obter sessão inicial
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.error('Erro ao obter sessão:', error)
          setUser(null)
        } else {
          updateUser(session)
        }
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
          setIsInitialized(true)
        }
      }
    }

    initializeAuth()

    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        // Evitar logs desnecessários para INITIAL_SESSION
        if (event !== 'INITIAL_SESSION') {
          console.log('Auth state change:', event, session?.user?.id)
        }
        
        updateUser(session)
      }
    )

    authSubscription = subscription

    return () => {
      mounted = false
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [supabase, updateUser])

  // Função para fazer logout
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }, [supabase])

  // Função para fazer login
  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return { success: true, user: data.user }
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }, [supabase])

  return {
    user,
    loading: loading || !isInitialized,
    isAuthenticated: !!user,
    logout,
    login,
    supabase
  }
}
