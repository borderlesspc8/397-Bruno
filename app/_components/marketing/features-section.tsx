import Image from "next/image";
import { 
  LayoutDashboard, 
  PiggyBank, 
  Target, 
  Wallet, 
  BarChart4, 
  Share2, 
  BrainCircuit
} from "lucide-react";

const features = [
  {
    icon: <LayoutDashboard className="h-6 w-6 text-primary" />,
    title: "Dashboard Personalizado",
    description: "Visualize sua saúde financeira em um painel intuitivo e personalizável."
  },
  {
    icon: <PiggyBank className="h-6 w-6 text-primary" />,
    title: "Orçamentos Inteligentes",
    description: "Crie e acompanhe orçamentos por categoria com alertas automáticos."
  },
  {
    icon: <Target className="h-6 w-6 text-primary" />,
    title: "Metas Financeiras",
    description: "Defina metas de economia e veja seu progresso em tempo real."
  },
  {
    icon: <Wallet className="h-6 w-6 text-primary" />,
    title: "Múltiplas Carteiras",
    description: "Gerencie contas pessoais e empresariais em um só lugar."
  },
  {
    icon: <BarChart4 className="h-6 w-6 text-primary" />,
    title: "Análise de Tendências",
    description: "Visualize gráficos detalhados da evolução dos seus gastos e receitas."
  },
  {
    icon: <Share2 className="h-6 w-6 text-primary" />,
    title: "Compartilhamento",
    description: "Compartilhe carteiras específicas com família ou equipe com controle de acesso."
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tudo que você precisa para controlar suas finanças
          </h2>
          <p className="text-muted-foreground text-lg">
            Finance AI combina as melhores ferramentas de gestão financeira com 
            inteligência artificial para simplificar seu controle financeiro.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-background rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border"
            >
              <div className="mb-4 p-3 rounded-full bg-primary/10 w-fit">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-20 relative">
          <div className="absolute inset-0 z-0 opacity-30">
            <div className="absolute -bottom-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px]" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <h2 className="text-3xl font-bold mb-4">
                Planeje seu futuro financeiro com confiança
              </h2>
              <p className="text-muted-foreground mb-6">
                Com recursos de planejamento avançados, você pode criar um roteiro claro para 
                alcançar seus objetivos financeiros, seja comprando uma casa, pagando a faculdade 
                ou planejando a aposentadoria.
              </p>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1 mt-1">
                    <BrainCircuit className="h-4 w-4 text-primary" />
                  </div>
                  <span>Previsões inteligentes baseadas nos seus padrões de gastos</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1 mt-1">
                    <BrainCircuit className="h-4 w-4 text-primary" />
                  </div>
                  <span>Recomendações personalizadas para economizar mais</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1 mt-1">
                    <BrainCircuit className="h-4 w-4 text-primary" />
                  </div>
                  <span>Simulações para diferentes cenários financeiros</span>
                </li>
              </ul>
            </div>
            
            <div className="lg:w-1/2 order-1 lg:order-2">
              <Image
                src="/planning-feature.png"
                alt="Planejamento financeiro"
                width={600}
                height={400}
                className="rounded-xl shadow-lg border"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 
