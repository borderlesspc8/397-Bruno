import Image from "next/image";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "O Finance AI transformou completamente minha relação com dinheiro. A categorização automática e os alertas de orçamento me ajudaram a economizar mais de R$ 800 por mês.",
    author: "Ana Silva",
    role: "Designer Gráfica",
    avatar: "/testimonials/avatar-1.jpg"
  },
  {
    quote: "Como empreendedor, precisava de uma solução que funcionasse tanto para minhas finanças pessoais quanto para meu negócio. Finance AI faz exatamente isso, com uma interface intuitiva e relatórios poderosos.",
    author: "Marcos Oliveira",
    role: "Proprietário de Startup",
    avatar: "/testimonials/avatar-2.jpg"
  },
  {
    quote: "Os insights de IA são incríveis! O app identificou vários gastos recorrentes que eu havia esquecido e economizei R$ 250 no primeiro mês cancelando serviços que não usava.",
    author: "Juliana Santos",
    role: "Arquiteta",
    avatar: "/testimonials/avatar-3.jpg"
  },
  {
    quote: "Já testei vários aplicativos de finanças, mas nenhum se compara ao Finance AI. A capacidade de compartilhar carteiras com minha esposa, mantendo outras privadas, é exatamente o que precisávamos.",
    author: "Roberto Mendes",
    role: "Engenheiro de Software",
    avatar: "/testimonials/avatar-4.jpg"
  },
  {
    quote: "A função de metas financeiras me ajudou a economizar para a entrada do meu apartamento em apenas 14 meses. As sugestões personalizadas fizeram toda a diferença.",
    author: "Carla Machado",
    role: "Médica",
    avatar: "/testimonials/avatar-5.jpg"
  },
  {
    quote: "Gerenciar as finanças da minha pequena empresa ficou muito mais fácil. Os relatórios para declaração de impostos economizam horas do meu tempo todo mês.",
    author: "Felipe Costa",
    role: "Dono de Restaurante",
    avatar: "/testimonials/avatar-6.jpg"
  }
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Junte-se a milhares de pessoas transformando suas finanças
          </h2>
          <p className="text-muted-foreground text-lg">
            Veja o que nossos usuários estão dizendo sobre como o Finance AI 
            os ajudou a conquistar controle financeiro e realizar seus objetivos.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-background p-6 rounded-xl shadow-sm border flex flex-col"
            >
              <Quote className="h-8 w-8 text-primary/50 mb-4" />
              
              <p className="flex-1 italic text-muted-foreground mb-6">
                "{testimonial.quote}"
              </p>
              
              <div className="flex items-center gap-3">
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <h4 className="font-medium">{testimonial.author}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background">
            <span className="font-medium">4.9</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="h-4 w-4 fill-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              de 2,157 avaliações
            </span>
          </div>
        </div>
      </div>
    </section>
  );
} 