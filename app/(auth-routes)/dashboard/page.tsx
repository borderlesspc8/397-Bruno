"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { BarChart, Users, LineChart, MousePointerClick, ArrowRight, DollarSign } from "lucide-react";
import { DashboardHeader } from "./_components/DashboardHeader";
import { useAuth } from "@/app/_hooks/useAuth";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Redirecionar automaticamente para dashboard/vendas
  useEffect(() => {
    router.push("/dashboard/vendas");
  }, [router]);

  // Este conteúdo só será exibido enquanto o redirecionamento não ocorre
  return (
    <div className="container mx-auto p-4 md:p-6">
      <DashboardHeader 
        title="Dashboard" 
        description="Bem-vindo ao seu painel de controle. Visualize indicadores importantes para o seu negócio."
      />
      

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-2 border-primary/20 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2">
            <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mb-2">
              <BarChart className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Dashboard de Vendas</CardTitle>
            <CardDescription>
              Acompanhe seu desempenho de vendas, faturamento e ticket médio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li>Faturamento total e por período</li>
              <li>Número de vendas realizadas</li>
              <li>Ticket médio</li>
              <li>Produtos mais vendidos</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/vendas">
              <Button variant="default">
                Ver Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="border-2 border-emerald-600/20 hover:border-emerald-600/50 transition-colors">
          <CardHeader className="pb-2">
            <div className="bg-emerald-100 dark:bg-emerald-900/20 w-10 h-10 rounded-full flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
            </div>
            <CardTitle>Dashboard Financeiro</CardTitle>
            <CardDescription>
              Controle completo das suas finanças com gráficos e análises detalhadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li>Saldo, receitas e despesas</li>
              <li>Fluxo de caixa detalhado</li>
              <li>Categorização de gastos</li>
              <li>Tendências e insights</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/financeiro">
              <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700">
                Ver Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="border-2 border-muted hover:border-primary/20 transition-colors">
          <CardHeader className="pb-2">
            <div className="bg-amber-100 dark:bg-amber-900/20 w-10 h-10 rounded-full flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            </div>
            <CardTitle>Dashboard de Vendedores</CardTitle>
            <CardDescription>
              Analise o desempenho da sua equipe de vendas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li>Ranking de vendedores</li>
              <li>Faturamento por vendedor</li>
              <li>Número de vendas por vendedor</li>
              <li>Histórico de desempenho</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/vendedores">
              <Button variant="outline">
                Ver Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="border-2 border-muted hover:border-primary/20 transition-colors">
          <CardHeader className="pb-2">
            <div className="bg-emerald-100 dark:bg-emerald-900/20 w-10 h-10 rounded-full flex items-center justify-center mb-2">
              <MousePointerClick className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
            </div>
            <CardTitle>Dashboard de Atendimentos</CardTitle>
            <CardDescription>
              Monitore sua taxa de conversão e qualidade de atendimento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li>Taxa de conversão</li>
              <li>Tempo médio de atendimento</li>
              <li>Número de atendimentos</li>
              <li>Satisfação dos clientes</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/atendimentos">
              <Button variant="outline">
                Ver Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="border-2 border-muted hover:border-primary/20 transition-colors">
          <CardHeader className="pb-2">
            <div className="bg-blue-100 dark:bg-blue-900/20 w-10 h-10 rounded-full flex items-center justify-center mb-2">
              <LineChart className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            </div>
            <CardTitle>Dashboard de Consultores</CardTitle>
            <CardDescription>
              Analise o desempenho dos consultores e clientes atendidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li>Clientes por consultor</li>
              <li>Vendas por consultor</li>
              <li>Performance histórica</li>
              <li>Categorias de produtos vendidos</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/consultores">
              <Button variant="outline">
                Ver Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 
