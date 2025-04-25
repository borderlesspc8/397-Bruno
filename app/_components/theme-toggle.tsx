"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"

import { Button } from "@/app/_components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu"
import { useTheme } from "@/app/_components/theme-provider"
import { Avatar, AvatarImage, AvatarFallback } from "@/app/_components/ui/avatar"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const setThemeAndSync = React.useCallback((newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    
    // Forçar a atualização da classe no elemento HTML
    const root = window.document.documentElement
    
    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      root.classList.remove("light", "dark")
      root.classList.add(systemTheme)
    } else {
      root.classList.remove("light", "dark")
      root.classList.add(newTheme)
    }
  }, [setTheme])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === "light" ? (
            <Sun className="h-5 w-5 text-amber-500 transition-transform hover:rotate-45" />
          ) : theme === "dark" ? (
            <Moon className="h-5 w-5 text-blue-400 transition-transform hover:rotate-12" />
          ) : (
            <Monitor className="h-5 w-5 transition-opacity opacity-80 hover:opacity-100" />
          )}
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" sideOffset={8} className="animate-in slide-in-from-top-2 duration-200">
        <DropdownMenuItem 
          onClick={() => setThemeAndSync("light")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Sun className="h-4 w-4 text-amber-500" />
          <span>Claro</span>
          {theme === "light" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setThemeAndSync("dark")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Moon className="h-4 w-4 text-blue-400" />
          <span>Escuro</span>
          {theme === "dark" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setThemeAndSync("system")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Monitor className="h-4 w-4" />
          <span>Sistema</span>
          {theme === "system" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

<Avatar>
  <AvatarImage src="https://url-da-imagem.jpg" alt="Foto do usuário" />
  <AvatarFallback>MV</AvatarFallback>
</Avatar> 