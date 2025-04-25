import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { CheckCircle2 } from "lucide-react";

const pricingPlans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    description: "Para uso pessoal básico",
    features: [
      "Até 50 transações por mês",
      "Categorização básica",
      "Relatórios simples",
      "1 carteira financeira",
      "Suporte por email",
    ],
    cta: "Começar Grátis",
    popular: false,
  },
  {
    name: "Premium",
    price: "R$ 19,90",
    description: "Para gestão financeira completa",
    features: [
      "Transações ilimitadas",
      "Categorização avançada com IA",
      "Relatórios detalhados",
      "Até 5 carteiras financeiras",
      "Compartilhamento com até 2 usuários",
      "Importação de extratos bancários",
      "Previsões financeiras",
      "Suporte prioritário",
    ],
    cta: "Experimentar por 7 dias",
    popular: true,
  },
  {
    name: "Empresarial",
    price: "R$ 69,90",
    description: "Para empresas e times",
    features: [
      "Tudo do plano Premium",
      "Carteiras ilimitadas",
      "Compartilhamento com até 10 usuários",
      "Permissões personalizadas",
      "Painel administrativo",
      "Relatórios fiscais",
      "API para integrações",
      "Gestor de conta dedicado",
    ],
    cta: "Falar com Vendas",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="planos" className="bg-primary/5 py-20 md:py-32">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Planos para cada necessidade
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Escolha o plano perfeito para suas finanças pessoais ou empresariais. 
            Cancele a qualquer momento.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {pricingPlans.map((plan, i) => (
            <div 
              key={i} 
              className={`relative rounded-xl border bg-background p-8 shadow-sm transition-all hover:shadow-md ${
                plan.popular ? "border-primary/50 ring-1 ring-primary/20" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.name !== "Gratuito" && (
                    <span className="ml-2 text-sm text-muted-foreground">/mês</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>
              
              <ul className="mb-8 space-y-4 text-sm">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-auto">
                <Link href={i === 2 ? "/contato" : "/auth/register"}>
                  <Button 
                    variant={plan.popular ? "default" : "outline"} 
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Todos os planos incluem aplicativo web e mobile, suporte técnico,
            e atualizações regulares. <Link href="/pricing" className="text-primary underline">Ver detalhes completos</Link>
          </p>
        </div>
      </div>
    </section>
  );
} 