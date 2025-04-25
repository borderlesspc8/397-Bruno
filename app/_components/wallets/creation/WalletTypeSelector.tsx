"use client";

import { Card, CardContent } from "@/app/_components/ui/card";
import { CreditCard, FileText, PlusCircle } from "lucide-react";
import { cn } from "@/app/_lib/utils";

export type WalletType = "MANUAL" | "BANK_INTEGRATION" | "MANUAL_INFO";

interface WalletTypeSelectorProps {
  selectedType: WalletType | null;
  onSelectType: (type: WalletType) => void;
}

export function WalletTypeSelector({ selectedType, onSelectType }: WalletTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-1 py-4">
      <Card
        className={cn(
          "cursor-pointer hover:border-primary/50 transition-all",
          selectedType === "MANUAL" ? "border-primary/70 bg-primary/5" : "border-border"
        )}
        onClick={() => onSelectType("MANUAL")}
      >
        <CardContent className="flex flex-col items-center justify-center p-6">
          <PlusCircle className="h-8 w-8 mb-2 text-primary" />
          <h3 className="font-medium text-center">Carteira Manual</h3>
          <p className="text-xs text-center text-muted-foreground mt-1">
            Crie uma carteira manual para gerenciar seus gastos
          </p>
        </CardContent>
      </Card>

      <Card
        className={cn(
          "cursor-pointer hover:border-primary/50 transition-all",
          selectedType === "BANK_INTEGRATION" ? "border-primary/70 bg-primary/5" : "border-border"
        )}
        onClick={() => onSelectType("BANK_INTEGRATION")}
      >
        <CardContent className="flex flex-col items-center justify-center p-6">
          <CreditCard className="h-8 w-8 mb-2 text-primary" />
          <h3 className="font-medium text-center">Banco do Brasil</h3>
          <p className="text-xs text-center text-muted-foreground mt-1">
            Conecte sua conta do Banco do Brasil via API direta
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 