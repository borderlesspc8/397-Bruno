"use client";

import { useEffect, useState } from "react";
import { SubscriptionCard } from "@/app/_components/subscription-card";
import { SubscriptionPlan } from "@/app/types";
import { ArrowLeft, Info, RefreshCw } from "lucide-react";
import Link from "next/link";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/app/_components/ui/accordion";
import { formatPlanName } from "@/app/_components/user-button/utils/formatters";
import { useSession } from "next-auth/react";
import { useSessionRefresh } from "@/app/_hooks/useSessionRefresh";
import { Button } from "@/app/_components/ui/button";
import { useSearchParams } from "next/navigation";

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const { refreshSession, isRefreshing } = useSessionRefresh();
  const searchParams = useSearchParams();
  
  // Verificação segura dos parâmetros
  const successParam = searchParams?.get("success");
  const downgradeParam = searchParams?.get("downgrade");
  
  const [showUpdateMessage, setShowUpdateMessage] = useState(
    successParam === "true" || downgradeParam === "true"
  );
  const [sessionRefreshed, setSessionRefreshed] = useState(false);

  // Determinar o tipo de atualização (upgrade ou downgrade)
  const isUpgrade = successParam === "true";
  const isDowngrade = downgradeParam === "true";

  // Função para atualizar a sessão
  const handleSessionRefresh = async () => {
    const success = await refreshSession();
    if (success) {
      setSessionRefreshed(true);
      setShowUpdateMessage(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="container py-8 px-4 text-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/vendas" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Planos de Assinatura</h1>
        </div>
      </div>
      
      {/* Mensagem de plano atualizado */}
      {showUpdateMessage && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">
          <div className="flex">
            <Info className="h-5 w-5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">
                {isUpgrade 
                  ? "Sua assinatura foi atualizada com sucesso!"
                  : "Seu plano foi alterado para o gratuito com sucesso!"}
              </p>
              <p className="mt-1">
                Para que as mudanças sejam aplicadas em todas as áreas do sistema,
                clique no botão abaixo para atualizar sua sessão:
              </p>
              <div className="mt-3">
                <Button 
                  onClick={handleSessionRefresh}
                  disabled={isRefreshing}
                  className="bg-green-700 hover:bg-green-800 text-white"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar Sessão
                    </>
                  )}
                </Button>
                <span className="mx-2">ou</span>
                <Link 
                  href="/auth/logout" 
                  className="text-green-700 underline hover:text-green-800"
                >
                  Fazer logout
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mensagem de sessão atualizada com sucesso */}
      {sessionRefreshed && (
        <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700 border border-blue-200">
          <div className="flex">
            <Info className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">
                Sessão atualizada com sucesso!
              </p>
              <p className="mt-1">
                Seu plano atual é {formatPlanName(session.user.subscriptionPlan)}.
                Todas as funcionalidades do seu plano estão agora disponíveis.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <p className="mb-8 text-lg text-muted-foreground">
        Você está atualmente no plano{' '}
        <span className="font-semibold text-foreground">
          {formatPlanName(session.user.subscriptionPlan)}
        </span>
        .
      </p>
      
      <div className="grid grid-cols-1 gap-8 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 relative">
        <SubscriptionCard
          type="free"
          name="Gratuito"
          description="Para iniciantes que querem organizar suas finanças básicas."
          price="R$0"
          features={[
            "Controle de receitas e despesas básico",
            "1 conta bancária",
            "1 usuário",
            "Relatórios mensais simples",
            "Suporte por e-mail"
          ]}
          isCurrentPlan={session.user.subscriptionPlan === SubscriptionPlan.FREE || !session.user.subscriptionPlan}
        />
        <SubscriptionCard
          type="basic"
          name="Basic"
          description="Para usuários que precisam de mais recursos e flexibilidade."
          price="R$49"
          period="mês"
          features={[
            "Controle de receitas e despesas avançado",
            "Até 2 contas bancárias",
            "1 usuário",
            "Relatórios personalizados",
            "Assistente financeiro com IA (até 10 consultas/mês)",
            "Suporte prioritário por e-mail"
          ]}
          isCurrentPlan={session.user.subscriptionPlan === SubscriptionPlan.BASIC}
        />
        <SubscriptionCard
          type="premium"
          name="Premium"
          description="Para pessoas físicas que buscam organização financeira avançada."
          price="R$129"
          period="mês"
          features={[
            "Controle completo de receitas e despesas",
            "Até 3 contas bancárias",
            "2 usuários (R$29,90/usuário adicional)",
            "Relatórios avançados e personalizados",
            "Assistente financeiro com IA (até 30 consultas/mês)",
            "Previsões de gastos baseadas em IA",
            "Canal de Suporte Exclusivo"
          ]}
          isCurrentPlan={session.user.subscriptionPlan === SubscriptionPlan.PREMIUM}
        />
        <SubscriptionCard
          type="enterprise"
          name="Enterprise"
          description="Para empresas e equipes que necessitam de controle financeiro completo."
          price="R$299"
          period="mês"
          features={[
            "Gestão financeira empresarial completa",
            "Contas bancárias ilimitadas",
            "Até 10 usuários inclusos",
            "Importação automática de transações",
            "Relatórios avançados com insights de IA",
            "Previsões financeiras com machine learning",
            "Integração com sistemas contábeis",
            "Suporte 24/7 com gerente dedicado"
          ]}
          isCurrentPlan={session.user.subscriptionPlan === SubscriptionPlan.ENTERPRISE}
        />
      </div>
      
      <div className="mt-16 mb-8">
        <h2 className="text-2xl font-bold mb-6">Perguntas Frequentes</h2>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Existe um período de teste gratuito?</AccordionTrigger>
            <AccordionContent>
              Sim, oferecemos um período de teste gratuito de 14 dias para os planos Basic e Premium.
              Você pode experimentar todos os recursos destes planos sem compromisso e cancelar
              a qualquer momento durante o período de teste.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger>Como funcionam os limites de transações e contas?</AccordionTrigger>
            <AccordionContent>
              Os limites referem-se ao número máximo de transações que você pode registrar mensalmente
              e o número de contas bancárias que você pode conectar ao sistema. No plano Free, você
              tem direito a 100 transações por mês e 1 conta bancária. Os planos pagos aumentam esses
              limites conforme descrito nas características de cada plano.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger>Como funciona o suporte técnico?</AccordionTrigger>
            <AccordionContent>
              Todos os planos incluem suporte por e-mail. Os planos Basic e acima oferecem suporte
              prioritário com tempos de resposta mais rápidos. O plano Premium inclui um canal exclusivo
              de suporte, e o plano Enterprise inclui suporte 24/7 com um gerente de conta dedicado
              para ajudar sua equipe.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger>Há descontos para pagamento anual?</AccordionTrigger>
            <AccordionContent>
              Sim, oferecemos um desconto de 20% para todos os planos pagos quando você opta pelo
              faturamento anual. Isso representa uma economia significativa em comparação ao 
              pagamento mensal.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-5">
            <AccordionTrigger>Como funcionam as consultas ao assistente de IA?</AccordionTrigger>
            <AccordionContent>
              Os planos Basic e Premium incluem acesso ao nosso assistente financeiro com IA, que pode
              responder perguntas sobre suas finanças, fornecer insights e ajudar com planejamento
              financeiro. O número de consultas varia de acordo com o plano (10 por mês no Basic e
              30 por mês no Premium). O plano Enterprise oferece consultas ilimitadas.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
