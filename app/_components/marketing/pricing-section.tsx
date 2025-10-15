import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/app/_components/ui/accordion";

const plans = [
  {
    name: "Gratuito",
    price: "R$0",
    period: "/mês",
    description: "Para iniciantes que querem organizar suas finanças básicas.",
    features: [
      "Controle de receitas e despesas básico",
      "1 conta bancária",
      "1 usuário",
      "Relatórios mensais simples",
      "Suporte por e-mail"
    ],
    cta: "Começar Agora",
    href: "/auth/register",
    popular: false,
    type: "free"
  },
  {
    name: "Basic",
    price: "R$49",
    period: "/mês",
    description: "Para usuários que precisam de mais recursos e flexibilidade.",
    features: [
      "Controle de receitas e despesas avançado",
      "Até 2 contas bancárias",
      "1 usuário",
      "Relatórios personalizados",
      "Assistente financeiro com IA (até 10 consultas/mês)",
      "Suporte prioritário por e-mail"
    ],
    cta: "Começar Agora",
    href: "/auth/register?plan=basic",
    popular: false,
    type: "basic"
  },
  {
    name: "Premium",
    price: "R$129",
    period: "/mês",
    description: "Para pessoas físicas que buscam organização financeira avançada.",
    features: [
      "Controle completo de receitas e despesas",
      "Até 3 contas bancárias",
      "2 usuários (R$29,90/usuário adicional)",
      "Relatórios avançados e personalizados",
      "Assistente financeiro com IA (até 30 consultas/mês)",
      "Previsões de gastos baseadas em IA",
      "Canal de Suporte Exclusivo"
    ],
    cta: "Começar Agora",
    href: "/auth/register?plan=premium",
    popular: true,
    type: "premium"
  },
  {
    name: "Empresarial",
    price: "R$159",
    period: "/mês",
    description: "Para profissionais liberais e pequenas empresas.",
    features: [
      "Todas as funcionalidades do Premium",
      "Até 5 contas bancárias (R$29,90/conta adicional)",
      "Até 5 usuários (R$29/usuário adicional)",
      "Assistente financeiro com IA (até 100 consultas/mês)",
      "Análise de fluxo de caixa com IA",
      "Controle de orçamentos por categoria",
      "Relatórios fiscais simplificados",
      "Canal de Suporte Exclusivo"
    ],
    cta: "Começar Agora",
    href: "/auth/register?plan=enterprise",
    popular: false,
    type: "enterprise"
  }
];

const faqItems = [
  {
    question: "Como funciona o período de teste?",
    answer: "Todos os planos pagos incluem um período de teste de 7 dias. Você não será cobrado até o final deste período e pode cancelar a qualquer momento sem compromisso."
  },
  {
    question: "O que acontece se eu atingir os limites do meu plano?",
    answer: "Você receberá notificações quando estiver se aproximando dos limites do seu plano. Uma vez atingidos, você poderá fazer um upgrade para um plano com limites maiores ou adquirir extensões como contas bancárias adicionais ou usuários adicionais, conforme disponível em cada plano."
  },
  {
    question: "Como funciona o suporte nos diferentes planos?",
    answer: "Plano Gratuito: Suporte por email em até 48h. Plano Basic (R$49/mês): Suporte prioritário por email em até 24h. Plano Premium (R$129/mês): Suporte prioritário com atendimento em até 6h. Plano Empresarial (R$159/mês): Suporte exclusivo 24/5 com atendimento em até 2h úteis."
  },
  {
    question: "Há descontos para pagamento anual?",
    answer: "Sim! Oferecemos 10% de desconto para pagamentos anuais em todos os planos pagos. Para o plano Empresarial, oferecemos 15% de desconto no pagamento anual, além de horas de consultoria para configuração inicial do sistema."
  },
  {
    question: "Como funcionam as consultas do assistente com IA?",
    answer: "Cada plano inclui um número limitado de consultas mensais ao assistente com IA. Essas consultas permitem análises financeiras detalhadas, recomendações personalizadas e insights sobre seu comportamento financeiro. Consultas não utilizadas não acumulam para o mês seguinte."
  }
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Planos para Todas as Necessidades
          </h2>
          <p className="text-muted-foreground text-lg">
            Escolha o plano ideal para suas finanças pessoais ou empresariais.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`rounded-xl p-6 md:p-8 border flex flex-col bg-card ${
                plan.popular 
                  ? "border-primary/50 shadow-lg shadow-primary/10 relative md:scale-105" 
                  : "shadow-sm"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-semibold">
                  Mais Popular
                </div>
              )}
              
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <p className="text-muted-foreground mb-6">{plan.description}</p>
              
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href={plan.href} className="mt-auto">
                <Button 
                  variant={
                    plan.type === "premium" 
                      ? "default" 
                      : plan.type === "basic"
                        ? "secondary"
                        : plan.type === "enterprise"
                          ? "destructive"
                          : "outline"
                  }
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
        
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-center">Perguntas Frequentes</h3>
          
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">{item.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">
              Ainda tem dúvidas sobre qual plano escolher? Nossa equipe está pronta para ajudar.
            </p>
            <Link href="/contact">
              <Button variant="outline">Fale Conosco</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 
