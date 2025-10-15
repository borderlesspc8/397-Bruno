"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "O Conta Rápida é seguro para minhas informações financeiras?",
    answer: "Absolutamente! Utilizamos criptografia de nível bancário para proteger suas informações. Não armazenamos senhas bancárias e nossos servidores seguem os mais altos padrões de segurança da indústria."
  },
  {
    question: "Como funciona a importação de dados bancários?",
    answer: "Oferecemos duas opções: importação de arquivos OFX/CSV dos seus extratos ou conexão direta com seu banco através de APIs seguras. Para bancos compatíveis, as transações são sincronizadas automaticamente."
  },
  {
    question: "Posso usar em dispositivos móveis?",
    answer: "Sim! O Conta Rápida possui versões para Android e iOS, além da versão web responsiva que funciona em qualquer dispositivo. Todas as suas informações são sincronizadas automaticamente entre dispositivos."
  },
  {
    question: "Como funciona o período de teste?",
    answer: "Oferecemos 7 dias de teste gratuito do plano Premium, sem necessidade de cartão de crédito. Após esse período, você pode optar por continuar no plano Premium ou voltar para o plano Gratuito."
  },
  {
    question: "Posso cancelar minha assinatura a qualquer momento?",
    answer: "Sim, você pode cancelar sua assinatura a qualquer momento através da página de configurações da sua conta. Não há taxas de cancelamento ou contratos de longo prazo."
  },
  {
    question: "Como é o suporte ao cliente?",
    answer: "Oferecemos suporte por email para todos os planos. Para planos Premium e Empresarial, também oferecemos suporte por chat em tempo real. Nossa equipe está disponível em dias úteis, das 8h às 18h."
  }
];

export default function FAQSection() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (value: string) => {
    setOpenItem(openItem === value ? null : value);
  };

  return (
    <section id="faq" className="py-20 md:py-32">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Perguntas Frequentes
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Confira as respostas para as dúvidas mais comuns sobre o Conta Rápida.
          </p>
        </div>
        
        <div className="mx-auto max-w-[800px]">
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border rounded-lg px-6">
                <button
                  onClick={() => toggleItem(`item-${i}`)}
                  className="flex w-full justify-between items-center py-4 text-lg font-medium text-left"
                >
                  {faq.question}
                  <ChevronDown 
                    className={`h-5 w-5 transition-transform ${
                      openItem === `item-${i}` ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openItem === `item-${i}` && (
                  <div className="pb-4 text-muted-foreground">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Ainda tem dúvidas? <a href="/contato" className="text-primary font-medium hover:underline">Entre em contato com nossa equipe</a>
          </p>
        </div>
      </div>
    </section>
  );
} 
