"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  ArrowLeft,
  RefreshCw,
  CalendarClock,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Edit,
  ChevronDown,
} from "lucide-react";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { Skeleton } from "@/app/_components/ui/skeleton";

import ImportMenu from "./ImportMenu";

// Schema para o formulário de agendamento
const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  frequency: z.enum(["daily", "weekly", "monthly"], {
    required_error: "Por favor selecione uma frequência",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  wallets: z.union([z.literal("all"), z.array(z.string())]),
  enabled: z.boolean().default(true),
});

// Formatar nome do dia da semana
const formatDayOfWeek = (day?: number) => {
  if (day === undefined) return "";
  
  const days = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];
  
  return days[day] || "";
};

// Formatar frequência
const formatFrequency = (frequency: string, dayOfWeek?: number, dayOfMonth?: number) => {
  switch (frequency) {
    case "daily":
      return "Diariamente";
    case "weekly":
      return `Semanalmente (${formatDayOfWeek(dayOfWeek)})`;
    case "monthly":
      return `Mensalmente (Dia ${dayOfMonth})`;
    default:
      return frequency;
  }
};

export default function ImportScheduler() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Inicializar form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      frequency: "daily",
      time: "00:00",
      wallets: "all",
      enabled: true,
    },
  });
  
  // Carregar agendamentos
  const loadSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/import-scheduler");
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar agendamentos: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSchedules(data);
    } catch (error: any) {
      console.error("Erro ao carregar agendamentos:", error);
      setError(`Erro ao carregar agendamentos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Carregar carteiras para seleção
  const loadWallets = async () => {
    try {
      const response = await fetch("/api/wallets?source=GESTAO_CLICK");
      
      if (!response.ok) {
        throw new Error("Falha ao carregar carteiras");
      }
      
      const data = await response.json();
      setWallets(data.wallets || []);
    } catch (error: any) {
      console.error("Erro ao carregar carteiras:", error);
      toast.error(`Erro ao carregar carteiras: ${error.message}`);
    }
  };
  
  // Alternar status de um agendamento
  const toggleScheduleStatus = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/import-scheduler/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      });
      
      if (!response.ok) {
        throw new Error("Falha ao atualizar status do agendamento");
      }
      
      // Atualizar a lista local
      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.id === id ? { ...schedule, enabled } : schedule
        )
      );
      
      toast.success(`Agendamento ${enabled ? "ativado" : "desativado"} com sucesso`);
    } catch (error: any) {
      console.error("Erro ao atualizar status do agendamento:", error);
      setError(`Erro ao atualizar agendamento: ${error.message}`);
    }
  };
  
  // Excluir um agendamento
  const deleteSchedule = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/import-scheduler/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Falha ao excluir agendamento");
      }
      
      // Remover da lista local
      setSchedules((prev) => prev.filter((schedule) => schedule.id !== id));
      
      toast.success("Agendamento excluído com sucesso");
    } catch (error: any) {
      console.error("Erro ao excluir agendamento:", error);
      setError(`Erro ao excluir agendamento: ${error.message}`);
    }
  };
  
  // Editar um agendamento existente
  const editSchedule = (schedule: any) => {
    setEditingSchedule(schedule);
    
    // Preencher o formulário com os dados do agendamento
    form.reset({
      name: schedule.name,
      frequency: schedule.frequency,
      time: schedule.time,
      dayOfWeek: schedule.dayOfWeek,
      dayOfMonth: schedule.dayOfMonth,
      wallets: schedule.wallets,
      enabled: schedule.enabled,
    });
    
    setOpenDialog(true);
  };
  
  // Enviar formulário
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const isEditing = !!editingSchedule;
      const url = isEditing 
        ? `/api/import-scheduler/${editingSchedule.id}` 
        : "/api/import-scheduler";
      
      const method = isEditing ? "PUT" : "POST";
      
      // Se frequency for daily, remover dayOfWeek e dayOfMonth
      if (values.frequency === "daily") {
        delete values.dayOfWeek;
        delete values.dayOfMonth;
      }
      
      // Se frequency for weekly, remover dayOfMonth
      if (values.frequency === "weekly" && !values.dayOfWeek) {
        values.dayOfWeek = new Date().getDay(); // Usar o dia atual da semana
      }
      
      // Se frequency for monthly, remover dayOfWeek
      if (values.frequency === "monthly" && !values.dayOfMonth) {
        values.dayOfMonth = new Date().getDate(); // Usar o dia atual do mês
        
        // Garantir que o dia do mês seja válido (máximo 28 para ser válido em todos os meses)
        if (values.dayOfMonth > 28) {
          values.dayOfMonth = 28;
        }
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} agendamento: ${response.statusText}`);
      }
      
      // Fechar o diálogo e recarregar os agendamentos
      setOpenDialog(false);
      setEditingSchedule(null);
      form.reset();
      loadSchedules();
    } catch (error: any) {
      console.error(`Erro ao ${editingSchedule ? 'atualizar' : 'criar'} agendamento:`, error);
      setError(`Erro ao ${editingSchedule ? 'atualizar' : 'criar'} agendamento: ${error.message}`);
    }
  };
  
  // Carregar dados ao montar o componente
  useEffect(() => {
    loadSchedules();
    loadWallets();
  }, []);
  
  // Adicionar validações condicionais ao formulário
  useEffect(() => {
    const frequency = form.watch("frequency");
    
    if (frequency === "weekly") {
      form.register("dayOfWeek", { required: "Selecione o dia da semana" });
    } else if (frequency === "monthly") {
      form.register("dayOfMonth", { required: "Selecione o dia do mês" });
    }
  }, [form.watch("frequency")]);
  
  return (
    <div>
      <ImportMenu />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/wallets/import-dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Agendamento de Importações</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadSchedules}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            
            <Button
              onClick={() => {
                form.reset({
                  name: "",
                  frequency: "daily",
                  time: "00:00",
                  wallets: "all",
                  enabled: true,
                });
                setEditingSchedule(null);
                setOpenDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo Agendamento
            </Button>
          </div>
        </div>
        
        {/* Exibir erro se houver */}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Lista de agendamentos */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum agendamento encontrado</CardTitle>
              <CardDescription>
                Clique em "Novo Agendamento" para criar seu primeiro agendamento de importação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <CalendarClock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center max-w-md">
                  Agendamentos permitem que você importe automaticamente dados do Gestão Click
                  de forma recorrente, sem precisar fazê-lo manualmente.
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => {
                    form.reset();
                    setEditingSchedule(null);
                    setOpenDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Criar Agendamento
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map((schedule) => (
              <Card 
                key={schedule.id}
                className={schedule.enabled ? "" : "opacity-70"}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{schedule.name}</CardTitle>
                      <CardDescription>
                        {formatFrequency(
                          schedule.frequency,
                          schedule.dayOfWeek,
                          schedule.dayOfMonth
                        )}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => editSchedule(schedule)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleScheduleStatus(schedule.id, !schedule.enabled)}
                        >
                          {schedule.enabled ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteSchedule(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge
                          variant={schedule.enabled ? "success" : "outline"}
                        >
                          {schedule.enabled ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Horário</p>
                        <p className="text-sm font-medium">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {schedule.time}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Próxima Execução</p>
                        <p className="text-sm font-medium">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {schedule.nextRun 
                            ? format(new Date(schedule.nextRun), "dd/MM/yyyy", { locale: ptBR }) 
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Última Execução</p>
                        <p className="text-sm font-medium">
                          {schedule.lastRun 
                            ? format(new Date(schedule.lastRun), "dd/MM/yyyy", { locale: ptBR }) 
                            : "-"}
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Carteiras</p>
                      {schedule.wallets === "all" ? (
                        <p className="text-sm">Todas as carteiras</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(schedule.wallets) && schedule.wallets.length > 0 ? (
                            schedule.wallets.map((walletId: string) => {
                              const wallet = wallets.find((w) => w.id === walletId);
                              return (
                                <Badge key={walletId} variant="outline" className="text-xs">
                                  {wallet?.name || walletId}
                                </Badge>
                              );
                            })
                          ) : (
                            <p className="text-sm text-muted-foreground">Nenhuma carteira selecionada</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between">
                  {schedule.lastError && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="destructive" className="cursor-help">
                            Erro na última execução
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{schedule.lastError}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        {/* Diálogo de criação/edição */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? "Editar Agendamento" : "Novo Agendamento"}
              </DialogTitle>
              <DialogDescription>
                Configure as opções para {editingSchedule ? "atualizar seu" : "seu novo"} agendamento de importação.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Importação diária" {...field} />
                      </FormControl>
                      <FormDescription>
                        Um nome para identificar este agendamento.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequência</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Diariamente</SelectItem>
                          <SelectItem value="weekly">Semanalmente</SelectItem>
                          <SelectItem value="monthly">Mensalmente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch("frequency") === "weekly" && (
                  <FormField
                    control={form.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia da Semana</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o dia da semana" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Domingo</SelectItem>
                            <SelectItem value="1">Segunda-feira</SelectItem>
                            <SelectItem value="2">Terça-feira</SelectItem>
                            <SelectItem value="3">Quarta-feira</SelectItem>
                            <SelectItem value="4">Quinta-feira</SelectItem>
                            <SelectItem value="5">Sexta-feira</SelectItem>
                            <SelectItem value="6">Sábado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {form.watch("frequency") === "monthly" && (
                  <FormField
                    control={form.control}
                    name="dayOfMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia do Mês</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o dia do mês" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 28 }, (_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>
                                Dia {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Utilizamos o máximo de 28 dias para compatibilidade com todos os meses.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription>
                        Horário em que a importação será iniciada.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="wallets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carteiras</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          if (value === "all") {
                            field.onChange("all");
                          } else {
                            // Aqui deveria ser um multi-select, mas para simplificar
                            // estamos usando apenas "todas" ou uma específica
                            field.onChange([value]);
                          }
                        }}
                        defaultValue={
                          field.value === "all" 
                            ? "all" 
                            : Array.isArray(field.value) && field.value.length > 0 
                              ? field.value[0] 
                              : ""
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione as carteiras" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">Todas as carteiras</SelectItem>
                          {wallets.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                              {wallet.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecione quais carteiras serão importadas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Ativo</FormLabel>
                        <FormDescription>
                          Ativar este agendamento para execução automática.
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
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpenDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingSchedule ? "Salvar" : "Criar"} Agendamento
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 