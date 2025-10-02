import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { toast } from "sonner";

interface AlterarSenhaModalProps {
  userId: string;
  userName: string | null;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AlterarSenhaModal({ userId, userName, userEmail, isOpen, onClose }: AlterarSenhaModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Senha alterada com sucesso!");
      onClose();
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast.error("Erro ao alterar senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Alterar Senha</DialogTitle>
          <DialogDescription>
            Alterar senha do usuário {userName || userEmail}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
                required
                minLength={6}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
                required
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 