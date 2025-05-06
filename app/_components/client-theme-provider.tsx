"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'dark' | 'light'
  systemTheme: 'dark' | 'light'
  mounted: boolean
}

const initialValue: ThemeContextType = {
  theme: 'system',
  setTheme: () => null,
  resolvedTheme: 'light',
  systemTheme: 'light',
  mounted: false
}

const ThemeContext = createContext<ThemeContextType>(initialValue)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ClientThemeProvider')
  }
  return context
}

interface ClientThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ClientThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'tema',
  ...props
}: ClientThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('light')
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>('light')
  const [mounted, setMounted] = useState(false)

  // Função para limpar todas as classes de tema do documento
  const removeThemeClasses = () => {
    const root = document.documentElement
    root.classList.remove('light', 'dark', 'system')
    root.classList.remove('theme-transition')
  }

  // Função para aplicar o tema ao documento com transição
  const applyThemeWithTransition = (newTheme: 'dark' | 'light') => {
    const root = document.documentElement
    
    // Adiciona classe de transição
    root.classList.add('theme-transition')
    
    // Remove classes antigas
    root.classList.remove('light', 'dark')
    
    // Adiciona a nova classe de tema
    root.classList.add(newTheme)
    
    // Atualiza o estado do tema resolvido
    setResolvedTheme(newTheme)
    
    // Remove a classe de transição após a transição
    setTimeout(() => {
      root.classList.remove('theme-transition')
    }, 300)
  }

  // Efeito para carregar o tema salvo e marcar o componente como montado
  useEffect(() => {
    try {
      // Antes de tudo, limpar todas as classes de tema
      removeThemeClasses()
      
      // Verificar tema salvo em localStorage
      const storedTheme = localStorage.getItem(storageKey) as Theme | null
      
      // Definir tema a partir do localStorage ou do padrão
      if (storedTheme) {
        setThemeState(storedTheme)
      }
      
      // Verificar preferência do sistema
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const systemPreference = mediaQuery.matches ? 'dark' : 'light'
      setSystemTheme(systemPreference)
      
      // Determinar o tema a ser aplicado
      const themeToApply = storedTheme === 'system' || !storedTheme 
        ? systemPreference 
        : storedTheme as 'dark' | 'light'
      
      // Aplicar tema imediatamente
      applyThemeWithTransition(themeToApply)
      
      // Marcar como montado após um pequeno delay para garantir que o tema foi aplicado
      setTimeout(() => {
        setMounted(true)
      }, 50)
    } catch (error) {
      console.error('Erro ao inicializar o tema:', error)
      // Fallback para light theme em caso de erro
      document.documentElement.classList.add('light')
      setMounted(true)
    }
  }, [storageKey])

  // Efeito para atualizar tema quando a preferência do sistema muda
  useEffect(() => {
    if (!mounted) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      const newSystemTheme = mediaQuery.matches ? 'dark' : 'light'
      setSystemTheme(newSystemTheme)
      
      if (theme === 'system') {
        applyThemeWithTransition(newSystemTheme)
      }
    }
    
    // Adicionar event listener usando a API mais recente
    try {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } catch (err) {
      // Fallback para navegadores mais antigos
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [theme, mounted])

  // Efeito para aplicar mudanças de tema quando o usuário muda a preferência
  useEffect(() => {
    if (!mounted) return
    
    const newResolvedTheme = theme === 'system' ? systemTheme : theme
    
    if (resolvedTheme !== newResolvedTheme) {
      applyThemeWithTransition(newResolvedTheme)
    }
  }, [theme, systemTheme, mounted, resolvedTheme])

  // Função para alterar o tema
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(storageKey, newTheme)
    } catch (e) {
      console.error('Erro ao salvar tema no localStorage:', e)
    }
  }

  // Componente de fallback durante a montagem
  if (!mounted) {
    // Renderizamos as crianças mesmo quando não estamos montados
    // para evitar renderizações desnecessárias, mas sem o contexto
    return <>{children}</>
  }

  const value = {
    theme,
    setTheme,
    resolvedTheme,
    systemTheme,
    mounted
  }

  return (
    <ThemeContext.Provider value={value} {...props}>
      {children}
    </ThemeContext.Provider>
  )
} 

// Adiciona exportação padrão para compatibilidade com o import no layout.tsx
export default ClientThemeProvider; 