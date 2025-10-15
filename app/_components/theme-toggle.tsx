"use client"

import React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from './client-theme-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/app/_components/ui/dropdown-menu'
import { Button } from '@/app/_components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/_components/ui/tooltip'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
    
  // Ícone atual baseado no tema atual
  const ThemeIcon = React.useMemo(() => {
    if (resolvedTheme === 'dark') return Moon
    return Sun
  }, [resolvedTheme])

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                <ThemeIcon className="h-4 w-4 rotate-0 scale-100 transition-all" />
                <span className="sr-only">Alterar tema</span>
        </Button>
      </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
        <DropdownMenuItem 
                onClick={() => setTheme('light')}
                className={theme === 'light' ? 'bg-muted/50' : ''}
        >
                <Sun className="mr-2 h-4 w-4" />
          <span>Claro</span>
                {theme === 'light' && <span className="ml-auto text-xs opacity-60">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
                onClick={() => setTheme('dark')}
                className={theme === 'dark' ? 'bg-muted/50' : ''}
        >
                <Moon className="mr-2 h-4 w-4" />
          <span>Escuro</span>
                {theme === 'dark' && <span className="ml-auto text-xs opacity-60">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
                onClick={() => setTheme('system')}
                className={theme === 'system' ? 'bg-muted/50' : ''}
        >
                <Monitor className="mr-2 h-4 w-4" />
          <span>Sistema</span>
                {theme === 'system' && <span className="ml-auto text-xs opacity-60">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          <p>Alterar tema</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 
