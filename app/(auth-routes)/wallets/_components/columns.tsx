"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Landmark, MoreHorizontal, Pencil, Trash, Wallet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { Button } from "@/app/_components/ui/button";
import { deleteWallet } from "@/app/_actions/delete-wallet";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { Label } from "@/app/_components/ui/label";
import { Input } from "@/app/_components/ui/input";
import { updateWallet } from "@/app/_actions/update-wallet";

interface WalletData {
  id: string;
  name: string;
  balance: number;
  type: "MANUAL" | "BANK";
  bank?: {
    name: string;
    logo: string;
  } | null;
}

export const walletColumns: ColumnDef<WalletData>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const bank = row.original.bank;

      return (
        <div className="flex items-center gap-2">
          {type === "BANK" ? (
            <>
              <Landmark className="h-4 w-4" />
              <span>{bank?.name}</span>
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              <span>Manual</span>
            </>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "balance",
    header: "Saldo",
    cell: ({ row }) => {
      const balance = row.getValue("balance") as number;

      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(balance);
    },
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
      const router = useRouter();
      const wallet = row.original;
      const [open, setOpen] = useState(false);
      const [loading, setLoading] = useState(false);

      const handleDelete = async () => {
        try {
          const { error } = await deleteWallet(wallet.id);

          if (error) {
            toast.error("Erro ao excluir carteira");
            return;
          }

          toast.success("Carteira excluída com sucesso!");
          router.refresh();
        } catch (error) {
          toast.error("Erro ao excluir carteira");
        }
      };

      const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        try {
          const formData = new FormData(event.currentTarget);
          const name = formData.get("name") as string;
          const balance = parseFloat(formData.get("balance") as string);

          const { error } = await updateWallet(wallet.id, {
            name,
            balance,
          });

          if (error) {
            toast.error("Erro ao atualizar carteira");
            return;
          }

          toast.success("Carteira atualizada com sucesso!");
          setOpen(false);
          router.refresh();
        } catch (error) {
          toast.error("Erro ao atualizar carteira");
        } finally {
          setLoading(false);
        }
      };

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete}>
                <Trash className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Carteira</DialogTitle>
                <DialogDescription>
                  Atualize as informações da sua carteira.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome da Carteira</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={wallet.name}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="balance">Saldo</Label>
                    <Input
                      id="balance"
                      name="balance"
                      type="number"
                      defaultValue={wallet.balance}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      );
    },
  },
]; 