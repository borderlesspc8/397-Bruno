"use client";

import { ThemeProvider } from "./theme-provider";
import { useEffect } from "react";

export default function ClientThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Forçar uma reavaliação do tema quando o componente montar
    const root = window.document.documentElement;
    const theme = localStorage.getItem("finance-ai-theme") || "system";
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.toggle("dark", systemTheme === "dark");
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
    
    // Limpeza ao desmontar - remover classe dark para evitar que afete a homepage
    return () => {
      root.classList.remove("dark");
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey="finance-ai-theme">
      {children}
    </ThemeProvider>
  );
} 