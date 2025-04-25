"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowUpCircle,
  Download,
  Loader2,
  Clock
} from "lucide-react";

import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Separator } from "@/app/_components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/app/_components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";

// Tipos para assinatura e pagamentos
interface Subscription {
  id: string;
  plan: "free" | "basic" | "premium" | "business";
  status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING";
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
  renewalDate: string; // ISO date string
  trialEndsAt?: string; // ISO date string
  canceledAt?: string; // ISO date string
  paymentMethod?: string;
  paymentId?: string;
}

interface PaymentHistory {
  id: string;
  date: string; // ISO date string
  amount: number;
  status: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
  invoiceUrl?: string;
  description: string;
}

// Dados mockados (em uma aplicação real viriam da API)
const mockPaymentHistory: PaymentHistory[] = [
  {
    id: "pay-1",
    date: "2023-05-01T10:00:00Z",
    amount: 29.90,
    status: "PAID",
    invoiceUrl: "#",
    description: "Plano Premium - Maio 2023"
  },
  {
    id: "pay-2",
    date: "2023-04-01T10:00:00Z",
    amount: 29.90,
    status: "PAID",
    invoiceUrl: "#",
    description: "Plano Premium - Abril 2023"
  },
  {
    id: "pay-3",
    date: "2023-03-01T10:00:00Z",
    amount: 29.90,
    status: "PAID",
    invoiceUrl: "#",
    description: "Plano Premium - Março 2023"
  },
  {
    id: "pay-4",
    date: "2023-02-01T10:00:00Z",
    amount: 19.90,
    status: "PAID",
    invoiceUrl: "#",
    description: "Plano Basic - Fevereiro 2023"
  },
  {
    id: "pay-5",
    date: "2023-01-01T10:00:00Z",
    amount: 19.90,
    status: "PAID",
    invoiceUrl: "#",
    description: "Plano Basic - Janeiro 2023"
  }
];

// Dados mockados dos planos disponíveis
const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Para uso pessoal básico",
    features: [
      "Até 100 transações por mês",
      "1 carteira conectada",
      "Exportação básica",
      "Suporte por email"
    ],
    limits: {
      transactions: 100,
      wallets: 1,
      apiCalls: 100,
      storage: 10
    }
  },
  {
    id: "basic",
    name: "Basic",
    price: 19.90,
    description: "Para uso pessoal avançado",
    features: [
      "Até 500 transações por mês",
      "3 carteiras conectadas",
      "Exportação avançada",
      "Categorização automática",
      "Suporte prioritário"
    ],
    limits: {
      transactions: 500,
      wallets: 3,
      apiCalls: 500,
      storage: 50
    }
  },
  {
    id: "premium",
    name: "Premium",
    price: 29.90,
    description: "Para uso profissional",
    features: [
      "Transações ilimitadas",
      "5 carteiras conectadas",
      "Relatórios avançados",
      "API de integração",
      "Suporte 24/7"
    ],
    limits: {
      transactions: 10000,
      wallets: 5,
      apiCalls: 1000,
      storage: 100
    }
  },
  {
    id: "business",
    name: "Business",
    price: 49.90,
    description: "Para empresas",
    features: [
      "Transações ilimitadas",
      "10 carteiras conectadas",
      "Múltiplos usuários",
      "API avançada",
      "Suporte dedicado"
    ],
    limits: {
      transactions: 50000,
      wallets: 10,
      apiCalls: 5000,
      storage: 500
    }
  }
];

interface SubscriptionDetailsProps {
  user: any;
  subscription?: Subscription | null;
}

export default function SubscriptionDetails({ user, subscription }: SubscriptionDetailsProps) {
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("current");
  
  // Simula o carregamento de dados da API
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        // Em uma aplicação real, buscar da API:
        // const response = await fetch('/api/user/payment-history');
        // const data = await response.json();
        
        // Usando dados mockados para simulação
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPaymentHistory(mockPaymentHistory);
      } catch (error) {
        console.error("Erro ao buscar histórico de pagamentos:", error);
        toast.error("Erro ao carregar histórico de pagamentos");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPaymentHistory();
  }, []);
  
  // Formata a data
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  // Formata o valor monetário
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  
  // Obtém o plano atual
  const getCurrentPlan = () => {
    if (!subscription) return plans[0]; // Free
    return plans.find(p => p.id === subscription.plan) || plans[0];
  };
  
  // Renderiza o status da assinatura
  const renderSubscriptionStatus = (status?: string) => {
    if (!status) return null;
    
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Ativa
          </Badge>
        );
      case "CANCELED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelada
          </Badge>
        );
      case "PAST_DUE":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pagamento Pendente
          </Badge>
        );
      case "TRIALING":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Período de Teste
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Renderiza o status do pagamento
  const renderPaymentStatus = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Pago
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Falhou
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <ArrowUpCircle className="h-3 w-3 mr-1" />
            Reembolsado
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Simula o cancelamento da assinatura
  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      // Em uma aplicação real, chamar a API:
      // const response = await fetch('/api/subscription/cancel', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ subscriptionId: subscription?.id }),
      // });
      
      // Simulando chamada à API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Assinatura cancelada com sucesso");
      setShowCancelDialog(false);
      // Em uma aplicação real, atualizar o estado da assinatura
    } catch (error) {
      toast.error("Erro ao cancelar assinatura");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Simula a atualização do plano
  const handleUpgradePlan = async () => {
    if (!selectedPlan) {
      toast.error("Selecione um plano");
      return;
    }
    
    setIsLoading(true);
    try {
      // Em uma aplicação real, chamar a API:
      // const response = await fetch('/api/subscription/upgrade', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ planId: selectedPlan }),
      // });
      
      // Simulando chamada à API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`Plano atualizado para ${selectedPlan}`);
      setShowUpgradeDialog(false);
      // Em uma aplicação real, atualizar o estado da assinatura
    } catch (error) {
      toast.error("Erro ao atualizar plano");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const currentPlan = getCurrentPlan();
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="current">Plano Atual</TabsTrigger>
          <TabsTrigger value="history">Histórico de Pagamentos</TabsTrigger>
        </TabsList>
        
        {/* Plano Atual */}
        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Plano {currentPlan.name}
                  </CardTitle>
                  <CardDescription>{currentPlan.description}</CardDescription>
                </div>
                {renderSubscriptionStatus(subscription?.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(currentPlan.price)}
                    <span className="text-sm font-normal text-muted-foreground"> /mês</span>
                  </p>
                </div>
                {subscription?.status === "ACTIVE" && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Calendar className="h-3 w-3 mr-1" />
                    Próxima cobrança: {formatDate(subscription?.renewalDate)}
                  </Badge>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Recursos Incluídos</h4>
                <ul className="space-y-2">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {subscription?.status === "ACTIVE" && (
                <Alert>
                  <AlertTitle>Informações da Assinatura</AlertTitle>
                  <AlertDescription>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>Data de início:</div>
                      <div>{formatDate(subscription?.startDate)}</div>
                      
                      <div>Próxima renovação:</div>
                      <div>{formatDate(subscription?.renewalDate)}</div>
                      
                      {subscription?.paymentMethod && (
                        <>
                          <div>Método de pagamento:</div>
                          <div>{subscription.paymentMethod}</div>
                        </>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="default" 
                className="w-full sm:w-auto"
                onClick={() => setShowUpgradeDialog(true)}
              >
                {subscription?.plan === "business" ? "Alterar Plano" : "Fazer Upgrade"}
              </Button>
              
              {subscription?.status === "ACTIVE" && subscription.plan !== "free" && (
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto text-destructive hover:text-destructive"
                  onClick={() => setShowCancelDialog(true)}
                >
                  Cancelar Assinatura
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Histórico de Pagamentos */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Histórico de Pagamentos
              </CardTitle>
              <CardDescription>
                Seus pagamentos recentes e faturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-md">
                      <div className="space-y-1 mb-2 sm:mb-0">
                        <p className="font-medium">{payment.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payment.date)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(payment.amount)}</span>
                          {renderPaymentStatus(payment.status)}
                        </div>
                        
                        {payment.invoiceUrl && (
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            <Download className="h-4 w-4 mr-1" />
                            Fatura
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Dialog de Cancelamento */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Assinatura</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos premium no final do período atual.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                Ao cancelar, você ainda terá acesso ao plano {currentPlan.name} até {formatDate(subscription?.renewalDate)}.
                Após essa data, sua conta será rebaixada para o plano Free.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Voltar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelSubscription}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Upgrade */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Escolha seu Plano</DialogTitle>
            <DialogDescription>
              Selecione o plano que melhor atende às suas necessidades
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`cursor-pointer transition-all ${selectedPlan === plan.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold mb-4">
                    {formatCurrency(plan.price)}
                    <span className="text-sm font-normal text-muted-foreground"> /mês</span>
                  </p>
                  
                  <ul className="text-sm space-y-2">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-1 flex-shrink-0" />
                        <span className="text-xs">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-xs text-muted-foreground">
                        + {plan.features.length - 3} recursos
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpgradePlan}
              disabled={isLoading || !selectedPlan || selectedPlan === subscription?.plan}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Confirmar Alteração"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 