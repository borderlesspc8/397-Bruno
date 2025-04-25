"use client";

import { Check, CreditCard, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/app/_lib/utils";
import { useState } from "react";
import Link from "next/link";

interface SubscriptionCardProps {
  type: "free" | "basic" | "premium" | "enterprise";
  name: string;
  description: string;
  price: string;
  period?: string;
  features: string[];
  isCurrentPlan?: boolean;
}

export function SubscriptionCard({
  type,
  name,
  description,
  price,
  period = "/mês",
  features,
  isCurrentPlan = false,
}: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Determinar classes com base no tipo do plano
  const getBgClass = () => {
    switch (type) {
      case "premium":
        return "border-primary/20 bg-primary/5";
      case "enterprise":
        return "border-destructive/20 bg-destructive/5";
      case "basic":
        return "border-secondary/20 bg-secondary/5";
      default:
        return "border-border";
    }
  };

  // Determinar classes para o botão com base no tipo do plano
  const getButtonVariant = () => {
    switch (type) {
      case "premium":
        return "default";
      case "enterprise":
        return "destructive";
      case "basic":
        return "secondary";
      default:
        return "outline";
    }
  };
  
  // Determinar texto do botão com base no estado atual
  const getButtonText = () => {
    if (isCurrentPlan) {
      return "Plano Atual";
    }
    
    return "Começar Agora";
  };
  
  // Determinar URL para checkout/upgrade
  const getActionUrl = () => {
    switch (type) {
      case "free":
        return "/api/subscription/downgrade";
      default:
        return `/api/subscription/checkout?plan=${type}`;
    }
  };
  
  const handleSubscribe = async () => {
    if (isCurrentPlan || isLoading) return;
    
    setIsLoading(true);
    // Implementação real aqui - redirecionando para checkout ou para downgrade
    try {
      window.location.href = getActionUrl();
    } catch (error) {
      console.error("Erro ao processar assinatura:", error);
      setIsLoading(false);
    }
  };
  
  return (
    <div 
      className={cn(
        "flex flex-col rounded-lg border p-6 shadow-sm transition-all relative",
        getBgClass(),
        isCurrentPlan && "ring-2 ring-primary",
        type === "premium" && "md:scale-105"
      )}
    >
      {type === "premium" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-semibold">
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span>Mais Popular</span>
          </div>
        </div>
      )}
      
      <div className="mb-4 flex-1">
        <h3 className="text-xl font-bold">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 flex items-baseline">
          <span className="text-3xl font-bold">{price}</span>
          {period && (
            <span className="ml-1 text-sm text-muted-foreground">{period}</span>
          )}
        </div>
        
        <ul className="mt-4 space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <Button 
        variant={getButtonVariant()} 
        className="mt-6 w-full"
        disabled={isCurrentPlan || isLoading}
        onClick={handleSubscribe}
      >
        {isLoading ? (
          <>
            <CreditCard className="mr-2 h-4 w-4 animate-pulse" />
            Processando...
          </>
        ) : (
          getButtonText()
        )}
      </Button>
      
      {isCurrentPlan && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Você está utilizando este plano atualmente
        </p>
      )}
    </div>
  );
} 