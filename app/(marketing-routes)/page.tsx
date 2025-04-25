import Link from "next/link";
import Image from "next/image";
import { Button } from "@/app/_components/ui/button";
import { ChevronRight, CheckCircle2, ArrowRight, BarChart, PieChart, CreditCard, Shield, Check } from "lucide-react";
import HeroSection from "@/app/_components/marketing/hero-section";
import Features from "@/app/_components/marketing/features";
import Pricing from "@/app/_components/marketing/pricing";
import Testimonials from "@/app/_components/marketing/testimonials";
import FAQ from "@/app/_components/marketing/faq";
import Footer from "@/app/_components/marketing/footer";
import { cn } from "@/app/_lib/utils";

export const metadata = {
  title: "Conta Rápida | Gestão Financeira Simples e Inteligente",
  description: "Controle suas finanças pessoais e empresariais de forma rápida e eficiente com auxílio de IA. Experimente grátis!",
  // ... resto do metadata
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b tracking-tight text-primary">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-2xl">Conta Rápida</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-10">
            <Link href="#recursos" className="text-md font-medium text-primary/80 hover:text-primary transition-colors">
              Recursos
            </Link>
            <Link href="#planos" className="text-md font-medium text-primary/80 hover:text-primary transition-colors">
              Planos
            </Link>
            <Link href="#depoimentos" className="text-md font-medium text-primary/80 hover:text-primary transition-colors">
              Depoimentos
            </Link>
            <Link href="#faq" className="text-md font-medium text-primary/80 hover:text-primary transition-colors">
              FAQ
            </Link>
          </nav>
          
          <div className="flex items-center">
            <Link href="/auth">
              <Button variant="default" className="text-sm">
                Começar Agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 bg-primary text-white">
          <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                Gestão financeira <span className="text-white/90">simplificada</span> com 
                <span className="text-white/80"> inteligência</span>
              </h1>
              <p className="text-xl text-white/80 mb-8 max-w-md">
                Transforme sua relação com o dinheiro. Gerencie suas finanças pessoais e empresariais em um só lugar.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-primary border-white hover:bg-white hover:text-secundary">
                    Começar Agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#recursos">
                  <Button variant="ghost" size="lg" className="w-full border border-input sm:w-auto text-white hover:text-primary hover:bg-white">
                    Como Funciona
                  </Button>
                </Link>
              </div>
              
              <div className="mt-12 flex items-center">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="inline-block h-10 w-10 rounded-full bg-white/10 border-2 border-white/20"
                    />
                  ))}
                </div>
                <p className="ml-4 text-sm text-white/80">
                  Mais de <span className="font-medium text-white">5,000+</span> usuários ativos
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 flex items-center justify-center h-[350px] border border-white/10">
              <div className="text-center">
                <p className="text-lg font-medium">Preview do Dashboard</p>
                <p className="text-sm text-white/60 mt-2">
                  (Imagem do dashboard da aplicação)
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="recursos" className="py-20 bg-[rgb(245,248,255)]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Recursos <span className="text-primary">Principais</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Conheça as ferramentas que vão transformar a maneira como você gerencia seu dinheiro.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <BarChart className="h-8 w-8 text-primary" />,
                  title: "Gestão de Transações",
                  description: "Registre e categorize suas receitas e despesas com facilidade e precisão."
                },
                {
                  icon: <PieChart className="h-8 w-8 text-primary" />,
                  title: "Relatórios Detalhados",
                  description: "Visualize gráficos e análises completas sobre seus gastos e investimentos."
                },
                {
                  icon: <CreditCard className="h-8 w-8 text-primary" />,
                  title: "Múltiplas Carteiras",
                  description: "Gerencie contas pessoais e empresariais em um único lugar."
                },
                {
                  icon: <Shield className="h-8 w-8 text-primary" />,
                  title: "Inteligência Artificial",
                  description: "Receba insights personalizados e sugestões para melhorar suas finanças."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm border border-border hover:border-primary/50 transition-colors">
                  <div className="bg-primary/5 p-3 rounded-full w-fit mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="planos" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Planos para Todas as Necessidades
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Escolha o plano ideal para suas finanças pessoais ou empresariais.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  name: "Gratuito",
                  description: "Para iniciantes que querem organizar suas finanças básicas.",
                  features: [
                    "Controle de receitas e despesas básico",
                    "1 conta bancária",
                    "1 usuário",
                    "Relatórios mensais simples",
                    "Suporte por e-mail"
                  ],
                  popular: false
                },
                {
                  name: "Basic",
                  description: "Para usuários que precisam de mais recursos e flexibilidade.",
                  features: [
                    "Controle de receitas e despesas avançado",
                    "Até 2 contas bancárias",
                    "1 usuário",
                    "Relatórios personalizados",
                    "Assistente financeiro com IA (até 10 consultas/mês)",
                    "Suporte prioritário por e-mail"
                  ],
                  popular: false
                },
                {
                  name: "Premium",
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
                  popular: true
                },
                {
                  name: "Empresarial",
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
                  popular: false
                }
              ].map((plan, i) => (
                <div 
                  key={i}
                  className={cn(
                    "rounded-xl border p-6 shadow-sm flex flex-col relative",
                    plan.popular ? "border-primary bg-white" : "bg-white/50 border-zinc-200 hover:border-zinc-300"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-5 left-0 right-0 mx-auto w-fit bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                      Mais Popular
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <div className="mt-2 text-zinc-600">{plan.description}</div>
                    
                    {plan.name === "Gratuito" ? (
                      <div className="mt-4 text-4xl font-bold">R$0<span className="text-lg font-normal text-zinc-500">/mês</span></div>
                    ) : plan.name === "Basic" ? (
                      <div className="mt-4 text-4xl font-bold">R$49<span className="text-lg font-normal text-zinc-500">/mês</span></div>
                    ) : plan.name === "Premium" ? (
                      <div className="mt-4 text-4xl font-bold">R$129<span className="text-lg font-normal text-zinc-500">/mês</span></div>
                    ) : (
                      <div className="mt-4 text-4xl font-bold">R$159<span className="text-lg font-normal text-zinc-500">/mês</span></div>
                    )}
                    
                    <ul className="mt-4 space-y-2 text-sm">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start">
                          <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button 
                    variant={plan.popular ? "default" : "outline"} 
                    className="w-full"
                  >
                    Começar Agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-[rgb(245,248,255)]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Pronto para simplificar sua gestão financeira?
            </h2>
            <p className="max-w-2xl mx-auto mb-8 text-gray-600">
              Comece hoje mesmo e transforme o modo como você gerencia suas finanças. 
              Nossa plataforma com IA vai te ajudar a economizar tempo e tomar decisões mais inteligentes.
            </p>
            <Link href="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                Começar Agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <span className="text-xl font-bold mb-4 inline-block">Conta Rápida</span>
              <p className="text-white/80 mb-4 max-w-sm">
                Transformando a gestão financeira com tecnologia e simplicidade.
                Controle suas finanças pessoais e empresariais em um só lugar.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-sm uppercase tracking-wider mb-4 text-white/90">Produto</h3>
              <ul className="space-y-2">
                <li><Link href="#recursos" className="text-sm text-white/70 hover:text-white">Recursos</Link></li>
                <li><Link href="#planos" className="text-sm text-white/70 hover:text-white">Planos</Link></li>
                <li><Link href="#empresas" className="text-sm text-white/70 hover:text-white">Para Empresas</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-sm uppercase tracking-wider mb-4 text-white/90">Suporte</h3>
              <ul className="space-y-2">
                <li><Link href="/contato" className="text-sm text-white/70 hover:text-white">Contato</Link></li>
                <li><Link href="/termos" className="text-sm text-white/70 hover:text-white">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="text-sm text-white/70 hover:text-white">Privacidade</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-white/60 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Conta Rápida. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6">
              <Link href="#" className="text-white/60 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                </svg>
              </Link>
              <Link href="#" className="text-white/60 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </Link>
              <Link href="#" className="text-white/60 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 