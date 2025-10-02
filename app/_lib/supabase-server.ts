import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './supabase'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Função para obter o usuário atual no servidor
export async function getUser() {
  const supabase = createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Erro ao obter usuário:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Erro na autenticação:', error)
    return null
  }
}

// Função para obter a sessão atual no servidor
export async function getSession() {
  const supabase = createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Erro ao obter sessão:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Erro na sessão:', error)
    return null
  }
}
