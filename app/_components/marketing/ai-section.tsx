import { Button } from "@/app/_components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { BrainCircuit, Sparkles } from "lucide-react";

export default function AISection() {
  return (
    <section id="ai-features" className="py-20 md:py-28 overflow-hidden">
      <div className="container">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="lg:w-1/2 order-2 lg:order-1 relative">
            <div className="absolute -z-10 w-[200%] h-[200%] -top-[50%] -left-[50%] rounded-full bg-primary/5" />
            <Image
              src="/ai-assistant-demo.png"
              alt="Assistente de IA Finance AI"
              width={650}
              height={500}
              className="rounded-xl shadow-xl border"
            />
            
            <div className="absolute -bottom-6 -right-6 bg-background rounded-lg p-4 shadow-lg border max-w-xs">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Análise Inteligente</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                "Identificamos que você gasta 40% mais em restaurantes do que no mês passado. Quer criar um orçamento para essa categoria?"
              </p>
            </div>
          </div>
          
          <div className="lg:w-1/2 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-background mb-6">
              <BrainCircuit className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">Recursos de IA</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Um assistente financeiro inteligente no seu bolso
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              Nossa tecnologia de IA analisa seus hábitos financeiros para fornecer insights personalizados 
              e sugestões que podem ajudar você a economizar dinheiro e atingir suas metas mais rapidamente.
            </p>
            
            <div className="space-y-6 mb-8">
              <div className="flex gap-4">
                <div className="rounded-full bg-primary/10 p-3 h-fit">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Categorização Automática</h3>
                  <p className="text-muted-foreground">
                    Suas transações são automaticamente classificadas com precisão de IA, economizando seu tempo.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="rounded-full bg-primary/10 p-3 h-fit">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Relatórios Personalizados</h3>
                  <p className="text-muted-foreground">
                    Receba relatórios mensais com análises detalhadas e dicas específicas para melhorar suas finanças.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="rounded-full bg-primary/10 p-3 h-fit">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Detecção de Padrões</h3>
                  <p className="text-muted-foreground">
                    A IA identifica padrões de gastos e oportunidades de economia que você pode não ter percebido.
                  </p>
                </div>
              </div>
            </div>
            
            <Link href="/auth/register">
              <Button size="lg">Experimentar a IA Finance</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 
