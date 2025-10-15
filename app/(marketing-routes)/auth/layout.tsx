"use client";

import { ThemeProvider } from "@/app/_components/theme-provider";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="finance-ai-theme">
      {children}
    </ThemeProvider>
  );
} 
