"use client";

import React, { useState } from "react";
import { Wallet2, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { MdAccountBalance } from "react-icons/md";
import { TbBrandCashapp } from "react-icons/tb";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

interface EmptyWalletsListProps {
  filterType?: string;
}

export const EmptyWalletsList: React.FC<EmptyWalletsListProps> = ({ filterType = "ALL" }) => {
  const [createWalletModalOpen, setCreateWalletModalOpen] = useState(false);
  const [gestaoClickModalOpen, setGestaoClickModalOpen] = useState(false);
  
  const noWalletsMessage = filterType === "ALL" 
    ? "Nenhuma carteira encontrada"
    : `Nenhuma carteira do tipo ${filterType.toLowerCase()} encontrada`;

  return (
    <div className="text-center p-4 space-y-3">
      <Wallet2 className="h-10 w-10 text-muted-foreground mx-auto" />
      <p className="text-muted-foreground">{noWalletsMessage}</p>
      
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Carteira
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Adicionar carteira</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setCreateWalletModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Carteira Manual
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/wallets/new?type=bank">
                <MdAccountBalance className="mr-2 h-4 w-4" />
                Banco do Brasil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Importação automática</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setGestaoClickModalOpen(true)}>
              <TbBrandCashapp className="mr-2 h-4 w-4" />
              Gestão Click
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modal para criar carteira manualmente */}
      {createWalletModalOpen && (
        <Dialog open={createWalletModalOpen} onOpenChange={setCreateWalletModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nova Carteira</DialogTitle>
              <DialogDescription>
                Crie uma nova carteira para gerenciar suas finanças
              </DialogDescription>
            </DialogHeader>
            {/* Substituir este componente pelo formulário de criação de carteira */}
            <div className="p-4 text-center">
              <p>Formulário de criação de carteira será renderizado aqui</p>
              <Button 
                className="mt-4" 
                onClick={() => {
                  setCreateWalletModalOpen(false);
                  window.location.reload();
                }}
              >
                Simular criação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal para importação via Gestão Click */}
      {gestaoClickModalOpen && (
        <Dialog open={gestaoClickModalOpen} onOpenChange={setGestaoClickModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Importar do Gestão Click</DialogTitle>
              <DialogDescription>
                Importe suas carteiras do sistema Gestão Click
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 text-center">
              <p>O componente de importação será renderizado aqui</p>
              <Button 
                className="mt-4" 
                onClick={() => setGestaoClickModalOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}; 