import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="bg-primary/5 py-20">
      <div className="container text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Pronto para simplificar sua gestão financeira?
        </h2>
        <p className="mx-auto mb-8 max-w-[700px] text-muted-foreground md:text-xl">
          Comece agora mesmo e tenha o controle total das suas finanças com o Conta Rápida.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row justify-center">
          <Link href="/auth/register">
            <Button size="lg" className="w-full sm:w-auto">
              Experimentar Grátis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#planos">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Ver Planos
            </Button>
          </Link>
        </div>
        
        <div className="mt-10 flex items-center justify-center">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className="inline-block h-8 w-8 rounded-full bg-primary/10 ring-2 ring-background"
                style={{
                  backgroundImage: `url(/avatars/user-${i}.jpg)`,
                  backgroundSize: 'cover'
                }}
              />
            ))}
          </div>
          <p className="ml-4 text-sm text-muted-foreground">
            Junte-se a <span className="font-semibold text-foreground">+5.000</span> usuários satisfeitos
          </p>
        </div>
      </div>
    </section>
  );
} 