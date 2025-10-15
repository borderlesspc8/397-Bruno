import Link from "next/link";
import Image from "next/image";
import { Button } from "@/app/_components/ui/button";
import { ArrowRight, BarChart, PieChart, LineChart, Layers } from "lucide-react";

export const metadata = {
  title: "Conta Rápida | Dashboards Inteligentes para sua Empresa",
  description: "Visualize métricas essenciais para o seu negócio com dashboards intuitivos e poderosos. Acompanhe vendas, atendimentos e performance em tempo real.",
};

export default function DashboardsPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Header já é renderizado pelo layout */}
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 bg-primary text-white">
          <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                Dashboards <span className="text-white/90">inteligentes</span> para 
                <span className="text-white/80"> decisões rápidas</span>
              </h1>
              <p className="text-xl text-white/80 mb-8 max-w-md">
                Transforme dados em insights. Acompanhe métricas essenciais, analise tendências e tome decisões baseadas em dados.
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
                  Mais de <span className="font-medium text-white">2,000+</span> empresas confiam em nós
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 flex items-center justify-center h-[350px] border border-white/10">
              <div className="text-center">
                <p className="text-lg font-medium">Dashboard de Vendas</p>
                <p className="text-sm text-white/60 mt-2">
                  Visualize métricas de vendas, ranking de vendedores e produtos mais vendidos
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
                Recursos dos <span className="text-primary">Dashboards</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Conheça as ferramentas analíticas que impulsionarão o desempenho do seu negócio.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <BarChart className="h-8 w-8 text-primary" />,
                  title: "Vendas em Tempo Real",
                  description: "Acompanhe o volume de vendas, faturamento e ticket médio em tempo real."
                },
                {
                  icon: <PieChart className="h-8 w-8 text-primary" />,
                  title: "Análise de Produtos",
                  description: "Identifique produtos mais vendidos e oportunidades de cross-selling."
                },
                {
                  icon: <LineChart className="h-8 w-8 text-primary" />,
                  title: "Performance de Vendedores",
                  description: "Ranking e análise detalhada do desempenho de cada vendedor."
                },
                {
                  icon: <Layers className="h-8 w-8 text-primary" />,
                  title: "Métricas de Conversão",
                  description: "Analise taxas de conversão e performance de atendimento."
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

        {/* Dashboard Preview Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Dashboards Poderosos e Intuitivos
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Interface moderna, responsiva e fácil de usar para acompanhar todas as métricas importantes.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-muted rounded-lg p-6 flex items-center justify-center h-80">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Dashboard de Vendas</h3>
                  <p className="text-muted-foreground">
                    Acompanhe faturamento, vendas, produtos e desempenho de vendedores.
                  </p>
                </div>
              </div>
              
              <div className="bg-muted rounded-lg p-6 flex items-center justify-center h-80">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Dashboard de Atendimentos</h3>
                  <p className="text-muted-foreground">
                    Analise taxas de conversão, tempo médio e qualidade dos atendimentos.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <Link href="/auth">
                <Button variant="default" size="lg">
                  Experimente Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Pronto para transformar dados em decisões?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Comece hoje mesmo a usar nossos dashboards inteligentes e impulsione os resultados do seu negócio.
            </p>
            
            <Link href="/auth">
              <Button variant="outline" size="lg" className="text-primary border-white hover:bg-white hover:text-secundary">
                Começar Agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
} 
