"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Shield, Smartphone, Lock, LogOut } from "lucide-react";

import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/app/_components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Separator } from "@/app/_components/ui/separator";
import { Switch } from "@/app/_components/ui/switch";
import { Badge } from "@/app/_components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/app/_components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";

// Schema para validação do formulário de alteração de senha
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Senha atual é obrigatória" }),
  newPassword: z.string().min(8, { message: "A nova senha deve ter pelo menos 8 caracteres" })
    .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula" })
    .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula" })
    .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número" }),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// Dispositivos conectados mockados (em produção, viriam da API)
const mockConnectedDevices = [
  {
    id: "device-1",
    name: "MacBook Pro",
    lastActive: "2023-05-15T14:30:00Z",
    location: "São Paulo, Brasil",
    browser: "Chrome",
    os: "macOS",
    current: true,
  },
  {
    id: "device-2",
    name: "iPhone 13",
    lastActive: "2023-05-14T10:15:00Z",
    location: "São Paulo, Brasil",
    browser: "Safari Mobile",
    os: "iOS 16",
    current: false,
  },
  {
    id: "device-3",
    name: "Windows PC",
    lastActive: "2023-05-10T08:20:00Z",
    location: "Rio de Janeiro, Brasil",
    browser: "Firefox",
    os: "Windows 11",
    current: false,
  },
];

interface SecuritySettingsProps {
  user: any;
}

export default function SecuritySettings({ user }: SecuritySettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [connectedDevices, setConnectedDevices] = useState(mockConnectedDevices);
  const [deviceToLogout, setDeviceToLogout] = useState<any>(null);
  const [confirmLogoutDialog, setConfirmLogoutDialog] = useState(false);

  // Preenche o formulário com valores iniciais
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmitPasswordChange = async (data: PasswordFormValues) => {
    setIsSubmitting(true);
    try {
      // Simula chamada à API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Em produção, fazer a chamada real
      // const response = await fetch("/api/user/change-password", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     currentPassword: data.currentPassword,
      //     newPassword: data.newPassword,
      //   }),
      // });

      toast.success("Senha alterada com sucesso");
      form.reset();
    } catch (error) {
      toast.error("Erro ao alterar senha");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggle2FA = async () => {
    if (is2FAEnabled) {
      // Desabilitar 2FA
      try {
        // Simulando chamada à API
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIs2FAEnabled(false);
        toast.success("Autenticação de dois fatores desativada");
      } catch (error) {
        toast.error("Erro ao desativar 2FA");
      }
    } else {
      // Mostrar QR code para configurar 2FA
      setShowQRCode(true);
    }
  };

  const setupTwoFactor = async () => {
    if (otpCode.length !== 6) {
      toast.error("Código inválido. Por favor, insira o código de 6 dígitos");
      return;
    }

    try {
      // Simulando verificação do código
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowQRCode(false);
      setIs2FAEnabled(true);
      setOtpCode("");
      toast.success("Autenticação de dois fatores ativada com sucesso");
    } catch (error) {
      toast.error("Código inválido. Tente novamente");
    }
  };

  const handleLogoutDevice = (device: any) => {
    setDeviceToLogout(device);
    setConfirmLogoutDialog(true);
  };

  const confirmDeviceLogout = async () => {
    try {
      // Simulando chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConnectedDevices(prevDevices => 
        prevDevices.filter(d => d.id !== deviceToLogout.id)
      );
      
      toast.success("Dispositivo desconectado com sucesso");
      setConfirmLogoutDialog(false);
    } catch (error) {
      toast.error("Erro ao desconectar dispositivo");
    }
  };

  return (
    <div className="space-y-8">
      {/* Alteração de Senha */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Alterar Senha</h3>
          <p className="text-sm text-muted-foreground">
            Atualize sua senha para manter sua conta segura
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitPasswordChange)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha Atual</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Digite sua senha atual" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Digite sua nova senha" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Nova Senha</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Confirme sua nova senha" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  "Alterar Senha"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      
      <Separator />
      
      {/* Autenticação de Dois Fatores */}
      <div className="space-y-4">
        <div className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Autenticação de Dois Fatores</h3>
            <p className="text-sm text-muted-foreground">
              Aumente a segurança da sua conta exigindo um código além da sua senha
            </p>
          </div>
          <Switch
            checked={is2FAEnabled}
            onCheckedChange={toggle2FA}
          />
        </div>
        
        {is2FAEnabled && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Autenticação de dois fatores ativada</AlertTitle>
            <AlertDescription>
              Sua conta está mais segura. Ao fazer login, você precisará digitar um código gerado pelo seu app de autenticação.
            </AlertDescription>
          </Alert>
        )}
        
        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Autenticação de Dois Fatores</DialogTitle>
              <DialogDescription>
                Escaneie o código QR abaixo com o seu aplicativo de autenticação (como Google Authenticator, Authy ou Microsoft Authenticator)
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center py-4">
              <div className="bg-slate-100 p-4 rounded-lg mb-4">
                {/* Aqui entraria uma imagem real do QR code */}
                <div className="w-48 h-48 bg-gray-300 flex items-center justify-center text-sm text-gray-500">
                  QR Code (Simulado)
                </div>
              </div>
              
              <p className="text-sm text-center mb-4">
                Após escanear o código, digite o código de 6 dígitos gerado pelo aplicativo para verificação
              </p>
              
              <div className="flex gap-2 w-full max-w-xs">
                <Input 
                  type="text"
                  placeholder="Código de 6 dígitos"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQRCode(false)}>
                Cancelar
              </Button>
              <Button onClick={setupTwoFactor}>
                Verificar e Ativar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Separator />
      
      {/* Dispositivos Conectados */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Dispositivos Conectados</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os dispositivos que têm acesso à sua conta
          </p>
        </div>
        
        <div className="space-y-4">
          {connectedDevices.map((device) => (
            <Card key={device.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    <CardTitle className="text-base">{device.name}</CardTitle>
                    {device.current && (
                      <Badge variant="outline" className="ml-2">
                        Dispositivo Atual
                      </Badge>
                    )}
                  </div>
                  {!device.current && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleLogoutDevice(device)}
                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Desconectar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Sistema:</div>
                  <div>{device.os}</div>
                  
                  <div className="text-muted-foreground">Navegador:</div>
                  <div>{device.browser}</div>
                  
                  <div className="text-muted-foreground">Localização:</div>
                  <div>{device.location}</div>
                  
                  <div className="text-muted-foreground">Último acesso:</div>
                  <div>{new Date(device.lastActive).toLocaleString('pt-BR')}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Dialog de confirmação para desconectar dispositivo */}
      <Dialog open={confirmLogoutDialog} onOpenChange={setConfirmLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar desconexão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desconectar este dispositivo? O usuário precisará fazer login novamente para acessar a conta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLogoutDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeviceLogout}>
              Desconectar Dispositivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 