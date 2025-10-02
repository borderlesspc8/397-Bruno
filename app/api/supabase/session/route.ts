import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/_lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Erro ao obter usuário Supabase:', error)
      return NextResponse.json({ user: null, error: error.message }, { status: 401 })
    }
    
    return NextResponse.json({ user, error: null })
  } catch (error: any) {
    console.error('Erro na API de sessão Supabase:', error)
    return NextResponse.json({ user: null, error: error.message }, { status: 500 })
  }
}
