import Image from "next/image";

const testimonials = [
  {
    quote: "O Conta Rápida transformou completamente minhas finanças. As previsões de gastos são incrivelmente precisas e me ajudaram a economizar mais de R$ 500 por mês!",
    author: "Ana Silva",
    role: "Designer Freelancer",
    avatar: "/avatars/ana.jpg",
  },
  {
    quote: "Como empreendedor, precisava de algo que unificasse minhas finanças pessoais e da empresa. O Conta Rápida resolveu isso perfeitamente com a função de carteiras separadas.",
    author: "Carlos Mendes",
    role: "CEO, TechStart",
    avatar: "/avatars/carlos.jpg",
  },
  {
    quote: "A categorização automática economiza horas do meu tempo todo mês. Os relatórios são claros e me dão exatamente as informações que preciso para tomar decisões.",
    author: "Juliana Costa",
    role: "Contadora",
    avatar: "/avatars/juliana.jpg",
  },
  {
    quote: "Minha esposa e eu agora temos uma visão clara das nossas finanças familiares. O compartilhamento de carteiras é perfeito para casais.",
    author: "Roberto Almeida",
    role: "Engenheiro",
    avatar: "/avatars/roberto.jpg",
  },
  {
    quote: "O suporte a multiple moedas foi essencial para mim que trabalho com clientes internacionais. Simples e eficiente!",
    author: "Fernanda Lima",
    role: "Consultora Internacional",
    avatar: "/avatars/fernanda.jpg",
  },
  {
    quote: "Como gestor financeiro, uso o plano empresarial para coordenar todo o fluxo de caixa da empresa. A interface é intuitiva até para quem não é da área.",
    author: "Marcelo Santos",
    role: "CFO, IndustryTech",
    avatar: "/avatars/marcelo.jpg",
  },
];

export default function Testimonials() {
  return (
    <section id="depoimentos" className="py-20 md:py-32">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            O que nossos usuários dizem
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Milhares de pessoas e empresas confiam no Conta Rápida para gerenciar suas finanças diariamente.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <div key={i} className="rounded-lg border bg-background p-6 transition-all hover:border-primary/50 hover:bg-primary/5">
              <div className="mb-4 text-lg font-medium leading-relaxed">
                "{testimonial.quote}"
              </div>
              <div className="flex items-center">
                <div className="mr-4 h-12 w-12 overflow-hidden rounded-full">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Métricas */}
        <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { value: "98%", label: "Satisfação de clientes" },
            { value: "5,000+", label: "Usuários ativos" },
            { value: "R$ 250M+", label: "Economia total gerada" },
            { value: "4.8/5", label: "Nota média" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 
