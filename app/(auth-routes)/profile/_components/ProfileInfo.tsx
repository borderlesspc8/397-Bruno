"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Upload, Check, Info } from "lucide-react";

import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/app/_components/ui/radio-group";
import { Separator } from "@/app/_components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { Switch } from "@/app/_components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";

// Schema para validação do formulário
const profileFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  image: z.string().optional(),
  phoneNumber: z.string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true; // Permite valores vazios
        // Verificar formato com ou sem máscara
        const digitsOnly = value.replace(/\D/g, '');
        return digitsOnly.length === 0 || digitsOnly.length === 11;
      },
      { message: "O número de celular deve ter 11 dígitos no padrão (DDD) + 9 dígitos" }
    ),
  colorTheme: z.string().optional(),
  emailNotifications: z.boolean().default(true),
  appNotifications: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileInfoProps {
  user: any;
  userProfile: any;
}

export default function ProfileInfo({ user, userProfile }: ProfileInfoProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.image || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [initialValues, setInitialValues] = useState<ProfileFormValues | null>(null);

  // Função para formatar número de telefone no padrão brasileiro
  const formatPhoneNumber = (value: string) => {
    // Remove todos os caracteres não numéricos
    const phoneNumber = value.replace(/\D/g, '');
    
    // Aplicação mais precisa da máscara para celular brasileiro
    if (!phoneNumber) return '';
    
    // Formato: (XX)
    if (phoneNumber.length <= 2) {
      return `(${phoneNumber}`;
    }
    
    // Formato: (XX) X
    if (phoneNumber.length <= 3) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    }
    
    // Formato: (XX) X XXXX
    if (phoneNumber.length <= 7) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 3)} ${phoneNumber.slice(3)}`;
    }
    
    // Formato: (XX) X XXXX-X...
    if (phoneNumber.length <= 11) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 3)} ${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7)}`;
    }
    
    // Limita ao número máximo de dígitos (11 - considerando DDD + 9 dígitos)
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 3)} ${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  // Preenche o formulário com os dados existentes
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      image: user?.image || "",
      phoneNumber: user?.phoneNumber ? formatPhoneNumber(user.phoneNumber) : "",
      colorTheme: userProfile?.colorTheme || "default",
      emailNotifications: userProfile?.emailNotifications || true,
      appNotifications: userProfile?.appNotifications || true,
      marketingEmails: userProfile?.marketingEmails || false,
    },
  });

  // Salvar valores iniciais para verificar mudanças
  useEffect(() => {
    if (!initialValues) {
      setInitialValues(form.getValues());
    }
    
    const subscription = form.watch((value) => {
      if (initialValues) {
        const hasChanged = Object.keys(value).some((key) => {
          // @ts-ignore
          return value[key] !== initialValues[key];
        });
        setFormChanged(hasChanged);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, initialValues]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Limpar formatação do telefone
      const cleanData = { 
        ...data,
        phoneNumber: data.phoneNumber ? data.phoneNumber.replace(/\D/g, '') : ''
      };
      
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanData),
      });

      if (!response.ok) {
        throw new Error("Falha ao atualizar o perfil");
      }

      toast.success("Perfil atualizado com sucesso!");
      setFormChanged(false);
      setInitialValues(form.getValues());
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.includes("image")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setUploadingAvatar(true);

    try {
      // Criar preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarPreview(event.target.result as string);
          form.setValue("image", event.target.result as string);
          setFormChanged(true);
        }
      };
      reader.readAsDataURL(file);
      
      // Aqui você implementaria o upload real para um serviço de armazenamento
      // Simulando um delay para demonstração
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Avatar atualizado! Salve o perfil para confirmar as alterações.");
    } catch (error) {
      console.error("Erro ao fazer upload do avatar:", error);
      toast.error("Erro ao fazer upload do avatar. Tente novamente.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Seção do Avatar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Foto de Perfil</CardTitle>
            <CardDescription>
              Essa foto será exibida em seu perfil e em outras áreas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-28 w-28 border-4 border-muted">
                <AvatarImage src={avatarPreview || ""} />
                <AvatarFallback className="text-2xl">
                  {user?.name?.charAt(0) || user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-3 w-full">
              <Button 
                variant="outline" 
                className="flex gap-2 relative overflow-hidden"
                disabled={uploadingAvatar}
              >
                <Upload className="h-4 w-4" />
                Escolher Imagem
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Formulário Principal */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize seus dados pessoais e preferências de contato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} />
                        </FormControl>
                        <FormDescription>
                          Este é o nome exibido para outros usuários
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="seu@email.com" 
                            {...field} 
                            disabled 
                            className="opacity-70"
                          />
                        </FormControl>
                        <FormDescription>
                          Para alterar seu email, entre em contato com o suporte
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de WhatsApp</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(99) 9 9999-9999" 
                            value={field.value}
                            onChange={(e) => {
                              // Limita a entrada para garantir que não exceda o tamanho máximo após formatação
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 11) {
                                field.onChange(formatPhoneNumber(value));
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Usado para comunicações importantes e interações com o agente de IA
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="colorTheme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tema de Cores</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um tema" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="default">Padrão do Sistema</SelectItem>
                            <SelectItem value="light">Claro</SelectItem>
                            <SelectItem value="dark">Escuro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Escolha um tema para a interface do sistema
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Preferências de Notificação</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure como você deseja receber notificações
                  </p>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Notificações por Email
                          </FormLabel>
                          <FormDescription>
                            Receba emails sobre atividades importantes e alertas
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="appNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Notificações no Aplicativo
                          </FormLabel>
                          <FormDescription>
                            Receba notificações dentro do sistema
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="marketingEmails"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Emails de Marketing
                          </FormLabel>
                          <FormDescription>
                            Receba atualizações sobre novos recursos e promoções
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Alert className="bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Informações de Perfil</AlertTitle>
                  <AlertDescription>
                    Os dados fornecidos são usados apenas para melhorar sua experiência com o Conta Rápida e não são compartilhados com terceiros.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !formChanged} 
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : formChanged ? (
                      <Check className="h-4 w-4" />
                    ) : null}
                    {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
