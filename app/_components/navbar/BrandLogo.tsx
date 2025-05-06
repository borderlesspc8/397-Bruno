"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import { Menu } from "lucide-react";
import { useSidebarStore } from "@/app/_stores/sidebar-store";

interface BrandLogoProps {
  className?: string;
}

export const BrandLogo = ({ className = "" }: BrandLogoProps) => {
  const { toggleSidebar } = useSidebarStore();

  return (
    <div className={`flex items-center gap-2 min-w-[200px] ${className}`}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Abrir menu</span>
      </Button>
      <Link href="/painel" className="flex items-center gap-2">
        <Image 
          src="/logo-small.svg" 
          alt="Conta Rápida"
          width={32}
          height={32}
          className="h-8 w-8"
        />
        <span className="text-xl font-semibold hidden sm:inline-flex">
          Personal Prime
        </span>
      </Link>
    </div>
  );
}; 