"use client";

import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Crown } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SubscriptionPlan } from "@/app/types/next-auth";

export function SubscriptionCard() {
  const router = useRouter();
  const { data: session } = useSession();
  const isPremium = session?.user?.subscriptionPlan === SubscriptionPlan.PREMIUM || 
                   session?.user?.subscriptionPlan === SubscriptionPlan.ENTERPRISE;

  const handleUpgrade = () => {
    router.push("/subscription");
  };

  if (isPremium) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-amber-500 to-amber-300 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Conta Rápida Premium
        </CardTitle>
        <CardDescription className="text-white/90">
          Desbloqueie recursos avançados para suas carteiras
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          <li>✓ Sincronização automática de transações</li>
          <li>✓ Categorização automática</li>
          <li>✓ Relatórios avançados</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleUpgrade}
          className="w-full bg-white text-amber-600 hover:bg-white/90"
        >
          Fazer upgrade
        </Button>
      </CardFooter>
    </Card>
  );
} 