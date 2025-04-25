import { ArrowLeft, Building, Calendar, Mail, MessageSquare, Phone, User } from "lucide-react";
import Link from "next/link";
import { requireAuth } from "@/app/_lib/auth";
import { Button } from "@/app/_components/ui/button";
import { Textarea } from "@/app/_components/ui/textarea";
import { Input } from "@/app/_components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/app/_components/ui/select";
import { Label } from "@/app/_components/ui/label";

export default async function ContactSales() {
  const { user } = await requireAuth();
  
  return (
    <div className="flex flex-col space-y-8 p-6">
      <div className="flex flex-col space-y-2">
        <Link 
          href="/subscription" 
          className="flex items-center text-sm text-muted-foreground hover:text-primary mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar aos Planos
        </Link>
        <h1 className="text-3xl font-bold">Contato Comercial</h1>
        <p className="text-muted-foreground">
          Entre em contato com nossa equipe de vendas para saber mais sobre o plano Empresarial
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Formulário de contato */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <Input 
                  id="name" 
                  placeholder="Seu nome completo" 
                  defaultValue={user.name || ""} 
                  className="pl-9"
                />
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  defaultValue={user.email} 
                  className="pl-9"
                />
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <div className="relative">
                <Input 
                  id="company" 
                  placeholder="Nome da empresa" 
                  className="pl-9"
                />
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <Input 
                  id="phone" 
                  placeholder="(00) 00000-0000" 
                  className="pl-9"
                />
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employees">Número de Funcionários</Label>
              <Select defaultValue="10-50">
                <SelectTrigger id="employees">
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-9">1-9 funcionários</SelectItem>
                  <SelectItem value="10-50">10-50 funcionários</SelectItem>
                  <SelectItem value="51-200">51-200 funcionários</SelectItem>
                  <SelectItem value="201-500">201-500 funcionários</SelectItem>
                  <SelectItem value="501+">501+ funcionários</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meeting">Prefere Reunião?</Label>
              <div className="relative">
                <Select defaultValue="sim">
                  <SelectTrigger id="meeting">
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim, quero agendar</SelectItem>
                    <SelectItem value="nao">Não, apenas informações</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Como podemos ajudar?</Label>
            <div className="relative">
              <Textarea 
                id="message" 
                placeholder="Descreva suas necessidades..." 
                className="min-h-[120px] resize-none pl-9 pt-6"
              />
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <Button className="w-full" size="lg">
            Enviar Solicitação
          </Button>
        </div>
        
        {/* Informações adicionais */}
        <div className="space-y-6">
          <div className="bg-muted p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Plano Empresarial</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center mt-0.5">
                  <span className="text-primary-foreground text-xs font-bold">✓</span>
                </div>
                <span className="ml-3">Carteiras e usuários ilimitados</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center mt-0.5">
                  <span className="text-primary-foreground text-xs font-bold">✓</span>
                </div>
                <span className="ml-3">Gerente de conta dedicado</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center mt-0.5">
                  <span className="text-primary-foreground text-xs font-bold">✓</span>
                </div>
                <span className="ml-3">API de integração completa</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center mt-0.5">
                  <span className="text-primary-foreground text-xs font-bold">✓</span>
                </div>
                <span className="ml-3">Suporte 24/7 prioritário</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center mt-0.5">
                  <span className="text-primary-foreground text-xs font-bold">✓</span>
                </div>
                <span className="ml-3">Implementação personalizada</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center mt-0.5">
                  <span className="text-primary-foreground text-xs font-bold">✓</span>
                </div>
                <span className="ml-3">Treinamento para equipe</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-muted p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Agendar Demonstração</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Prefere ver o sistema em ação? Agende uma demonstração personalizada com nossa equipe de vendas.
            </p>
            <Button variant="outline" className="w-full flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Agendar Demonstração
            </Button>
          </div>
          
          <div className="bg-muted p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Contato Direto</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">comercial@financeai.com.br</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">(11) 3456-7890</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 