"use client";

import { Button } from "@/app/_components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SimpleNavbarProps {
  showUserButton?: boolean;
}

export function SimpleNavbar({ showUserButton = true }: SimpleNavbarProps) {
  const router = useRouter();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm p-4">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold text-xl flex items-center">
            Conta Rápida
          </Link>
        </div>
        
        {showUserButton && (
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Criar conta</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
} 
