"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/_components/ui/collapsible";
import { X, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Checkbox } from "@/app/_components/ui/checkbox";
import { Label } from "@/app/_components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { ScrollArea } from "@/app/_components/ui/scroll-area";

interface Wallet {
  id: string;
  name: string;
  type: string;
}

interface CostCenter {
  id: string;
  name: string;
}

interface DREFiltersProps {
  wallets: Wallet[];
  costCenters: CostCenter[];
  selectedWallets: string[];
  selectedCostCenters: string[];
  onWalletsChange: (wallets: string[]) => void;
  onCostCentersChange: (costCenters: string[]) => void;
}

/**
 * Componente de filtros para o DRE
 */
export function DREFilters({
  wallets,
  costCenters,
  selectedWallets,
  selectedCostCenters,
  onWalletsChange,
  onCostCentersChange,
}: DREFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("carteiras");

  // Funções auxiliares para gerenciar seleções
  const toggleWallet = (walletId: string) => {
    if (selectedWallets.includes(walletId)) {
      onWalletsChange(selectedWallets.filter(id => id !== walletId));
    } else {
      onWalletsChange([...selectedWallets, walletId]);
    }
  };

  const toggleCostCenter = (costCenterId: string) => {
    if (selectedCostCenters.includes(costCenterId)) {
      onCostCentersChange(selectedCostCenters.filter(id => id !== costCenterId));
    } else {
      onCostCentersChange([...selectedCostCenters, costCenterId]);
    }
  };

  const selectAllWallets = () => {
    onWalletsChange(wallets.map(wallet => wallet.id));
  };

  const selectAllCostCenters = () => {
    onCostCentersChange(costCenters.map(costCenter => costCenter.id));
  };

  const clearWallets = () => {
    onWalletsChange([]);
  };

  const clearCostCenters = () => {
    onCostCentersChange([]);
  };

  // Verificar se existem filtros ativos
  const hasActiveFilters = selectedWallets.length > 0 || selectedCostCenters.length > 0;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border rounded-lg"
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-medium">Filtros Avançados</h3>
          
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {selectedWallets.length + selectedCostCenters.length} selecionados
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearWallets();
                clearCostCenters();
              }}
            >
              Limpar filtros
            </Button>
          )}
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {isOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Fechar
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  {hasActiveFilters ? "Editar filtros" : "Mostrar filtros"}
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent>
        <CardContent className="pb-4 pt-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="carteiras">Carteiras</TabsTrigger>
              <TabsTrigger value="centros-de-custo">Centros de Custo</TabsTrigger>
            </TabsList>

            <TabsContent value="carteiras">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedWallets.length} de {wallets.length} carteiras selecionadas
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllWallets}>
                    Selecionar todas
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearWallets}>
                    Limpar
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[200px] rounded-md border">
                <div className="p-4 space-y-4">
                  {wallets.map((wallet) => (
                    <div key={wallet.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`wallet-${wallet.id}`}
                        checked={selectedWallets.includes(wallet.id)}
                        onCheckedChange={() => toggleWallet(wallet.id)}
                      />
                      <Label
                        htmlFor={`wallet-${wallet.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        {wallet.name}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({wallet.type})
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="centros-de-custo">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedCostCenters.length} de {costCenters.length} centros de custo selecionados
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllCostCenters}>
                    Selecionar todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearCostCenters}>
                    Limpar
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[200px] rounded-md border">
                <div className="p-4 space-y-4">
                  {costCenters.map((costCenter) => (
                    <div key={costCenter.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cost-center-${costCenter.id}`}
                        checked={selectedCostCenters.includes(costCenter.id)}
                        onCheckedChange={() => toggleCostCenter(costCenter.id)}
                      />
                      <Label
                        htmlFor={`cost-center-${costCenter.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        {costCenter.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </CollapsibleContent>

      {/* Mostrar seleções ativas quando o acordeão está fechado */}
      {!isOpen && hasActiveFilters && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {selectedWallets.map((walletId) => {
            const wallet = wallets.find((w) => w.id === walletId);
            return (
              wallet && (
                <Badge key={wallet.id} variant="secondary" className="flex items-center gap-1">
                  <span>Carteira: {wallet.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => toggleWallet(wallet.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )
            );
          })}

          {selectedCostCenters.map((costCenterId) => {
            const costCenter = costCenters.find((c) => c.id === costCenterId);
            return (
              costCenter && (
                <Badge key={costCenter.id} variant="secondary" className="flex items-center gap-1">
                  <span>Centro: {costCenter.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => toggleCostCenter(costCenter.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )
            );
          })}
        </div>
      )}
    </Collapsible>
  );
} 
