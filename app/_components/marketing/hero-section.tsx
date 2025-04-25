import Image from "next/image";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-background/80 py-20 md:py-32">
      <div className="container">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
          {/* Texto e CTA */}
          <div className="flex flex-col justify-center">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Gestão financeira <span className="text-primary">simplificada</span> com inteligência
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Transforme sua relação com o dinheiro. Gerencie suas finanças pessoais e empresariais em um só lugar, 
              com insights inteligentes e total controle.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Como Funciona
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center space-x-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="inline-block h-8 w-8 rounded-full bg-primary/10 ring-2 ring-background" />
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                Mais de <span className="font-medium text-foreground">5,000+</span> usuários ativos
              </div>
            </div>
          </div>
          
          {/* Imagem/Demo */}
          <div className="relative flex items-center justify-center">
            <div className="relative h-[400px] w-full overflow-hidden rounded-lg shadow-xl md:h-[500px]">
              <Image
                src="/dashboard-preview.png"
                alt="Dashboard do Conta Rápida"
                fill
                className="object-cover"
                priority
              />
            </div>
            {/* Efeito de brilho */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-primary/20 opacity-50" />
          </div>
        </div>
      </div>
      
      {/* Marcas parceiras/integrações */}
      <div className="container mt-20">
        <p className="text-center text-sm font-medium text-muted-foreground">
          INTEGRADO COM
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 grayscale opacity-70">
          {["nubank.svg", "itau.svg", "bradesco.svg", "santander.svg", "bb.svg"].map((logo) => (
            <div key={logo} className="h-10 w-auto">
              <Image src={`/logos/${logo}`} alt="Logo de banco parceiro" width={120} height={40} />
            </div>
          ))}
        </div>
      </div>
      
      {/* Decoração de fundo */}
      <div className="absolute left-0 top-1/2 -z-10 h-[500px] w-[500px] -translate-y-1/2 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute right-0 top-0 -z-10 h-[300px] w-[300px] -translate-y-1/4 translate-x-1/4 rounded-full bg-primary/10 blur-3xl" />
    </section>
  );
} 