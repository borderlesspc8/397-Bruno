"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/app/_components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/app/_lib/utils";

export default function MarketingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 z-50">
          <Image 
            src="/logo.svg" 
            alt="Finance AI" 
            width={140} 
            height={32} 
            className="h-8 w-auto"
          />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Funcionalidades
          </Link>
          <Link
            href="#ai-features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            IA Finance
          </Link>
          <Link
            href="#testimonials"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Depoimentos
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Planos
          </Link>
          <Link
            href="#faq"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            FAQ
          </Link>
        </nav>
        
        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/auth/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link href="/auth/register">
            <Button>Começar Grátis</Button>
          </Link>
        </div>
        
        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden z-50"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-background flex flex-col items-center justify-center gap-8 text-lg z-40">
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="font-medium hover:text-primary transition-colors"
            >
              Funcionalidades
            </Link>
            <Link
              href="#ai-features"
              onClick={() => setMobileMenuOpen(false)}
              className="font-medium hover:text-primary transition-colors"
            >
              IA Finance
            </Link>
            <Link
              href="#testimonials"
              onClick={() => setMobileMenuOpen(false)}
              className="font-medium hover:text-primary transition-colors"
            >
              Depoimentos
            </Link>
            <Link
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="font-medium hover:text-primary transition-colors"
            >
              Planos
            </Link>
            <Link
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="font-medium hover:text-primary transition-colors"
            >
              FAQ
            </Link>
            <div className="flex flex-col items-center gap-4 mt-4">
              <Link href="/auth/login" className="w-full">
                <Button variant="outline" className="w-full">Entrar</Button>
              </Link>
              <Link href="/auth/register" className="w-full">
                <Button className="w-full">Começar Grátis</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 