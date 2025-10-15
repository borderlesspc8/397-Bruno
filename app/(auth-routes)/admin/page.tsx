import { Button } from "@/app/_components/ui/button";
import { Card } from "@/app/_components/ui/card";
import { Users, CreditCard, Activity, Settings } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-gray-600">Gerencie usuários, planos e configurações do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h3 className="text-xl font-semibold">Usuários</h3>
              <p className="text-3xl font-bold">5,234</p>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4">
            Gerenciar Usuários
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <CreditCard className="h-8 w-8 text-primary" />
            <div>
              <h3 className="text-xl font-semibold">Assinaturas</h3>
              <p className="text-3xl font-bold">1,892</p>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4">
            Ver Assinaturas
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h3 className="text-xl font-semibold">Atividade</h3>
              <p className="text-3xl font-bold">12,543</p>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4">
            Ver Atividades
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h3 className="text-xl font-semibold">Configurações</h3>
              <p className="text-sm text-gray-600">Ajustes do Sistema</p>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4">
            Configurar
          </Button>
        </Card>
      </div>
    </div>
  );
} 
