"use client";

import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, DollarSign, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "../_lib/utils";
import Link from "next/link";
import { Button } from "./ui/button";

// Formato comum para os dados
interface SummaryCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label: string;
  };
  icon?: React.ReactNode;
  variant?: "default" | "positive" | "negative" | "neutral";
  href?: string;
  loading?: boolean;
}

// Componente para um único cartão
function SummaryCard({
  title,
  value,
  description,
  trend,
  icon,
  variant = "default",
  href,
  loading = false,
}: SummaryCardProps) {
  // Definir cores com base na variante
  const variantStyles = {
    default: {
      iconClass: "text-primary",
      valueClass: "text-foreground",
      trendUp: "text-green-500",
      trendDown: "text-red-500",
      trendNeutral: "text-muted-foreground",
    },
    positive: {
      iconClass: "text-green-500",
      valueClass: "text-green-500",
      trendUp: "text-green-500",
      trendDown: "text-amber-500",
      trendNeutral: "text-muted-foreground",
    },
    negative: {
      iconClass: "text-red-500",
      valueClass: "text-red-500",
      trendUp: "text-amber-500",
      trendDown: "text-red-500",
      trendNeutral: "text-muted-foreground",
    },
    neutral: {
      iconClass: "text-muted-foreground",
      valueClass: "text-foreground",
      trendUp: "text-green-500",
      trendDown: "text-red-500",
      trendNeutral: "text-muted-foreground",
    },
  };

  const cardContent = (
    <Card className={cn(
      "relative overflow-hidden shadow-sm hover:shadow transition-shadow duration-200",
      href && "hover:border-primary/50 cursor-pointer"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon || (
          <div className={cn("h-4 w-4", variantStyles[variant].iconClass)}>
            {variant === "positive" ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : variant === "negative" ? (
              <ArrowDownIcon className="h-4 w-4" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-28 bg-muted animate-pulse rounded-md mb-1"></div>
        ) : (
          <div className={cn("text-2xl font-bold", variantStyles[variant].valueClass)}>
            {value}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-1">
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
          
          {trend && (
            <div className={cn(
              "flex items-center text-xs font-medium",
              trend.direction === "up" ? variantStyles[variant].trendUp :
              trend.direction === "down" ? variantStyles[variant].trendDown :
              variantStyles[variant].trendNeutral
            )}>
              {trend.direction === "up" ? (
                <ArrowUpIcon className="mr-1 h-3 w-3" />
              ) : trend.direction === "down" ? (
                <ArrowDownIcon className="mr-1 h-3 w-3" />
              ) : (
                <ArrowRightIcon className="mr-1 h-3 w-3" />
              )}
              {trend.value}% {trend.label}
            </div>
          )}
        </div>
        
        {href && (
          <div className="absolute bottom-0 right-0 p-1">
            <ArrowRightIcon className="h-3 w-3 text-muted-foreground opacity-50" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}

// Componente principal que renderiza todos os cartões
export default function SummaryCards({
  depositsTotal = "0",
  expensesTotal = "0",
  balance = "0",
  walletsCount = "0",
  loading = false,
}: {
  depositsTotal?: string | number;
  expensesTotal?: string | number;
  balance?: string | number;
  walletsCount?: string | number;
  loading?: boolean;
}) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Receitas"
        value={`R$ ${depositsTotal}`}
        description="Todas as receitas do período"
        variant="positive"
        loading={loading}
        href="/transactions?type=DEPOSIT"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-green-500"
          >
            <path d="M12 2v20M2 12h20" />
          </svg>
        }
      />
      
      <SummaryCard
        title="Despesas"
        value={`R$ ${expensesTotal}`}
        description="Todas as despesas do período"
        variant="negative"
        loading={loading}
        href="/transactions?type=EXPENSE"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-red-500"
          >
            <path d="M5 12h14" />
          </svg>
        }
      />
      
      <SummaryCard
        title="Saldo"
        value={`R$ ${balance}`}
        description="Diferença entre receitas e despesas"
        variant="default"
        loading={loading}
        href="/reports/balance"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-primary"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        }
      />
      
      <SummaryCard
        title="Carteiras"
        value={walletsCount}
        description="Total de carteiras ativas"
        variant="neutral"
        loading={loading}
        href="/wallets"
        icon={
          <Wallet className="h-4 w-4 text-muted-foreground" />
        }
      />
    </div>
  );
} 