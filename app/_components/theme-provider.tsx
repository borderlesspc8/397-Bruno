"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme);
  const [isMounted, setIsMounted] = React.useState(false);
  
  // Inicializar tema apenas no cliente para evitar erros de hidratação
  React.useEffect(() => {
    const storedTheme = localStorage.getItem(storageKey) as Theme | null;
    setTheme(storedTheme || defaultTheme);
    setIsMounted(true);
  }, [defaultTheme, storageKey]);

  // Quando o tema muda, atualiza as classes no documento
  React.useEffect(() => {
    if (!isMounted) return;
    
    const root = window.document.documentElement;
    
    // Adicionar uma classe de transição antes de mudar o tema
    root.classList.add('theme-transition');
    
    root.classList.remove("light", "dark");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
        
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    // Remover a classe de transição após um pequeno delay para completar a transição
    setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);
    
  }, [theme, isMounted]);

  const value = React.useMemo(
    () => ({
      theme,
      setTheme: (theme: Theme) => {
        localStorage.setItem(storageKey, theme);
        setTheme(theme);
      },
    }),
    [theme, storageKey]
  );

  // Não renderiza nada durante a primeira montagem para evitar erros de hidratação
  if (!isMounted) {
    return null;
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
}; 
