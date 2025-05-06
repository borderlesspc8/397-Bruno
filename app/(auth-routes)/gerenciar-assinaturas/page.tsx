"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DashboardHeader } from "@/app/(auth-routes)/dashboard/_components/DashboardHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/app/_components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Badge } from "@/app/_components/ui/badge";
import { Search, RefreshCw } from "lucide-react";
import { SubscriptionPlan } from "@/app/types";
import { toast } from "sonner";

// Tipo para usuários com informações de assinatura
interface UserWithSubscription {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  subscriptionPlan: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function GerenciarAssinaturasPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  
  // Carregar usuários
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }
      
      setUsers(data.users || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtrar usuários pelo termo de busca
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Atualizar plano de assinatura do usuário
  const updateUserPlan = async (userId: string, plan: SubscriptionPlan) => {
    setUpdatingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }
      
      // Atualizar usuário na lista
      setUsers(users.map(user => 
        user.id === userId ? { ...user, subscriptionPlan: plan } : user
      ));
      
      toast.success(`Plano de ${data.user.name || data.user.email} atualizado com sucesso!`);
    } catch (error) {
      console.error("Erro ao atualizar assinatura:", error);
      toast.error("Erro ao atualizar assinatura. Tente novamente.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Alternar status de ativação do usuário
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setUpdatingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }
      
      // Atualizar usuário na lista
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isActive: !currentStatus } : user
      ));
      
      toast.success(`Status de ${data.user.name || data.user.email} atualizado com sucesso!`);
    } catch (error) {
      console.error("Erro ao atualizar status do usuário:", error);
      toast.error("Erro ao atualizar status. Tente novamente.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Verificar se o usuário atual é o administrador autorizado
  const isAuthorizedAdmin = session?.user?.email === "mvcas95@gmail.com";

  if (!isAuthorizedAdmin) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <DashboardHeader 
          title="Acesso Restrito" 
          description="Você não tem permissão para acessar esta página."
        />
        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-center text-red-500">
              Esta funcionalidade está disponível apenas para administradores autorizados.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <DashboardHeader 
        title="Gerenciamento de Assinaturas" 
        description="Gerencie os planos de assinatura e acesso dos usuários da plataforma."
      />
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Lista de usuários e suas assinaturas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={fetchUsers}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email Verificado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {isLoading 
                        ? "Carregando usuários..." 
                        : searchTerm 
                          ? "Nenhum usuário encontrado para esta busca." 
                          : "Nenhum usuário cadastrado."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || "Sem nome"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          defaultValue={user.subscriptionPlan}
                          onValueChange={(value: string) => updateUserPlan(user.id, value as SubscriptionPlan)}
                          disabled={updatingUserId === user.id}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Selecionar plano" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SubscriptionPlan.FREE}>Gratuito</SelectItem>
                            <SelectItem value={SubscriptionPlan.BASIC}>Básico</SelectItem>
                            <SelectItem value={SubscriptionPlan.PREMIUM}>Premium</SelectItem>
                            <SelectItem value={SubscriptionPlan.ENTERPRISE}>Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {/* Badge personalizado com classes condicionais em vez de variantes */}
                        <span 
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer ${
                            user.isActive 
                              ? "bg-green-100 text-green-800 hover:bg-green-200" 
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                          onClick={() => toggleUserStatus(user.id, user.isActive)}
                        >
                          {user.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          user.emailVerified
                            ? "bg-green-50 text-green-700 border-green-200" 
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {user.emailVerified ? "Verificado" : "Não verificado"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id, user.isActive)}
                          disabled={updatingUserId === user.id}
                        >
                          {user.isActive ? "Desativar" : "Ativar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/50 flex justify-between">
          <div className="text-sm text-muted-foreground">
            Total: {filteredUsers.length} usuários
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 