import Image from "next/image";
import { 
  Receipt, 
  PieChart, 
  Target, 
  Share2, 
  CloudUpload, 
  PiggyBank, 
  BrainCircuit,
  Shield
} from "lucide-react";

const features = [
  {
    icon: Receipt,
    title: "Gestão de Transações",
    description: "Registre e categorize automaticamente suas receitas e despesas com facilidade.",
  },
  {
    icon: PieChart,
    title: "Relatórios Detalhados",
    description: "Visualize gráficos e análises completas sobre seus gastos e investimentos.",
  },
  {
    icon: PiggyBank,
    title: "Orçamentos Inteligentes",
    description: "Defina limites para categorias e receba alertas quando estiver próximo de ultrapassá-los.",
  },
  {
    icon: Target,
    title: "Metas Financeiras",
    description: "Estabeleça objetivos e acompanhe seu progresso com projeções realistas.",
  },
  {
    icon: Share2,
    title: "Compartilhamento Seguro",
    description: "Colabore em finanças familiares ou empresariais com níveis personalizados de acesso.",
  },
  {
    icon: CloudUpload,
    title: "Importação e Exportação",
    description: "Sincronize com bancos ou importe extratos para manter tudo atualizado automaticamente.",
  },
  {
    icon: BrainCircuit,
    title: "Inteligência Artificial",
    description: "Receba insights personalizados e dicas para melhorar sua saúde financeira.",
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Seus dados são protegidos com criptografia de ponta a ponta e padrões bancários.",
  },
];

export default function Features() {
  return (
    <section id="recursos" className="py-20 md:py-32">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Todas as ferramentas que você precisa
          </h2>
          <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl">
            O Conta Rápida oferece recursos completos para gestão financeira pessoal e empresarial, 
            tudo em uma interface intuitiva e potencializada por IA.
          </p>
        </div>
        
        {/* Grade de recursos */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="flex flex-col items-start rounded-lg border p-6 transition-all hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="mb-4 rounded-lg bg-primary/10 p-3 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-medium">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
        
        {/* Feature destacada */}
        <div className="mt-24 grid grid-cols-1 gap-12 rounded-2xl border bg-background p-8 md:grid-cols-2 md:p-12">
          <div className="flex flex-col justify-center">
            <h3 className="mb-4 text-2xl font-bold md:text-3xl">
              Simplificando o controle financeiro com IA
            </h3>
            <p className="mb-6 text-muted-foreground">
              Nossa tecnologia de inteligência artificial analisa seus padrões de gastos para prever despesas, 
              identificar oportunidades de economia e sugerir maneiras de otimizar seu dinheiro.
            </p>
            <ul className="space-y-3">
              {[
                "Categorização automática de transações",
                "Detecção de gastos incomuns e possíveis fraudes",
                "Previsão de fluxo de caixa personalizada",
                "Sugestões inteligentes para melhorar suas finanças",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-1 text-primary">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="relative h-[300px] w-full overflow-hidden rounded-lg md:h-[350px]">
              <Image 
                src="/ai-feature.png" 
                alt="Recursos de IA do Conta Rápida" 
                fill 
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 