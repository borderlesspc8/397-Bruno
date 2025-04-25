"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Calendar, 
  Check, 
  CircleDollarSign, 
  FileText, 
  RefreshCw, 
  Tag, 
  Wallet,
  X,
  Plus,
  CreditCard,
  Calculator,
  Briefcase,
  Building,
  PiggyBank,
  Receipt
} from 'lucide-react';
import { Button } from './button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import { Input } from './input';
import { Textarea } from './textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import { Calendar as CalendarComponent } from './calendar';
import { Checkbox } from './checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { cn } from '../../_lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { Label } from './label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';

// Definição do schema de validação
const transactionFormSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(3, {
    message: 'A descrição deve ter pelo menos 3 caracteres.',
  }),
  amount: z.coerce.number().positive({
    message: 'O valor deve ser maior que zero.',
  }),
  date: z.date({
    required_error: 'Por favor, selecione uma data.',
  }),
  type: z.enum(['income', 'expense', 'investment', 'transfer'], {
    required_error: 'Por favor, selecione um tipo de transação.',
  }),
  categoryId: z.string().optional(),
  walletId: z.string({
    required_error: 'Por favor, selecione uma carteira.',
  }),
  destinationWalletId: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isRecurrent: z.boolean().default(false),
  recurrenceInterval: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']).optional(),
  recurrenceEndDate: z.date().optional(),
  paymentMethod: z.string().optional(),
  attachment: z.any().optional(),
});

// Definição do tipo para os valores do formulário
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

// Definição do tipo para categorias
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'investment' | 'transfer' | 'all';
  icon?: React.ReactNode;
  color?: string;
}

// Definição do tipo para carteiras
export interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: string;
  icon?: React.ReactNode;
  color?: string;
}

// Definição do tipo para métodos de pagamento
export interface PaymentMethod {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

// Props para o componente TransactionForm
export interface TransactionFormProps {
  initialData?: Partial<TransactionFormValues>;
  onSubmit: (data: TransactionFormValues) => void;
  onCancel?: () => void;
  categories: Category[];
  wallets: Wallet[];
  paymentMethods?: PaymentMethod[];
  isLoading?: boolean;
  allowAttachments?: boolean;
  showCancelButton?: boolean;
  submitButtonText?: string;
  variant?: 'default' | 'compact' | 'dialog';
  className?: string;
}

/**
 * TransactionForm - Componente de formulário para criação e edição de transações
 * Esta versão equilibrada suporta múltiplos tipos de transações financeiras:
 * - Despesas (gastos)
 * - Receitas (entradas)
 * - Investimentos
 * - Transferências entre contas
 */
export function TransactionForm({
  initialData,
  onSubmit,
  onCancel,
  categories,
  wallets,
  paymentMethods = [],
  isLoading = false,
  allowAttachments = false,
  showCancelButton = true,
  submitButtonText = 'Salvar',
  variant = 'default',
  className,
}: TransactionFormProps) {
  // Estados locais
  const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'investment' | 'transfer'>(
    initialData?.type || 'expense'
  );
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [openCategoryPopover, setOpenCategoryPopover] = useState(false);
  
  // Inicialização do formulário
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      id: initialData?.id,
      description: initialData?.description || '',
      amount: initialData?.amount || undefined,
      date: initialData?.date || new Date(),
      type: initialData?.type || 'expense',
      categoryId: initialData?.categoryId || undefined,
      walletId: initialData?.walletId || '',
      destinationWalletId: initialData?.destinationWalletId || '',
      notes: initialData?.notes || '',
      tags: initialData?.tags || [],
      isRecurrent: initialData?.isRecurrent || false,
      recurrenceInterval: initialData?.recurrenceInterval || undefined,
      recurrenceEndDate: initialData?.recurrenceEndDate || undefined,
      paymentMethod: initialData?.paymentMethod || undefined,
    },
  });
  
  // Observando valores do formulário
  const watchType = form.watch('type');
  const watchIsRecurrent = form.watch('isRecurrent');
  const watchWalletId = form.watch('walletId');
  
  // Filtrar categorias baseado no tipo de transação
  const filteredCategories = useMemo(() => 
    categories.filter(cat => cat.type === 'all' || cat.type === watchType),
    [categories, watchType]
  );
  
  // Filtrar carteiras de destino para transferências
  const destinationWallets = useMemo(() => 
    wallets.filter(wallet => wallet.id !== watchWalletId),
    [wallets, watchWalletId]
  );
  
  // Sincronizar a aba ativa com o tipo de transação
  useEffect(() => {
    setActiveTab(watchType);
  }, [watchType]);
  
  useEffect(() => {
    form.setValue('type', activeTab);
  }, [activeTab, form]);
  
  // Manipular adição de tags
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      form.setValue('tags', newTags);
      setTagInput('');
    }
  };
  
  // Manipular remoção de tags
  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setValue('tags', newTags);
  };
  
  // Manipular envio do formulário
  const handleSubmit = (values: TransactionFormValues) => {
    onSubmit(values);
  };
  
  // Obter a categoria selecionada
  const selectedCategory = useMemo(() => {
    const categoryId = form.getValues('categoryId');
    return categoryId ? categories.find(cat => cat.id === categoryId) : undefined;
  }, [form, categories]);
  
  // Configurações de interface com base no variant
  const isCompact = variant === 'compact';
  const isDialog = variant === 'dialog';
  
  // Determinar as classes do cartão
  const cardClasses = cn(
    "w-full",
    {
      "max-w-3xl mx-auto": !isCompact && !isDialog,
      "bg-white dark:bg-[hsl(224,25%,10%)] shadow-md": !isDialog,
      "border-0 shadow-none": isDialog,
    },
    className
  );
  
  return (
    <Card className={cardClasses}>
      <CardHeader className={cn("px-6", { "py-4": isCompact })}>
        <CardTitle className={cn("font-semibold", { "text-xl": !isCompact, "text-lg": isCompact })}>
          {initialData?.id ? 'Editar Transação' : 'Nova Transação'}
        </CardTitle>
        {!isCompact && (
          <CardDescription>
            {initialData?.id
              ? 'Atualize os detalhes da transação existente'
              : 'Preencha os detalhes para registrar uma nova transação'}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className={cn("px-6", { "py-3": isCompact })}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Tipo de Transação (Tabs) */}
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'income' | 'expense' | 'investment' | 'transfer')}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="expense" className="flex items-center gap-1.5">
                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                  <span>Despesa</span>
                </TabsTrigger>
                <TabsTrigger value="income" className="flex items-center gap-1.5">
                  <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                  <span>Receita</span>
                </TabsTrigger>
                <TabsTrigger value="investment" className="flex items-center gap-1.5">
                  <PiggyBank className="h-4 w-4 text-blue-500" />
                  <span>Investimento</span>
                </TabsTrigger>
                <TabsTrigger value="transfer" className="flex items-center gap-1.5">
                  <RefreshCw className="h-4 w-4 text-purple-500" />
                  <span>Transferência</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Os TabsContent não precisam de conteúdo específico nesse caso */}
            </Tabs>
            
            {/* Inputs comuns para todos os tipos */}
            <div className={cn("grid gap-4", { "grid-cols-1": isCompact, "grid-cols-2": !isCompact })}>
              {/* Descrição */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className={isCompact ? "col-span-1" : "col-span-2"}>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Compra no supermercado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Valor */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          R$
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                          className="pl-10"
                          min={0}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Data */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Categoria */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Popover open={openCategoryPopover} onOpenChange={setOpenCategoryPopover}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {field.value ? (
                            <div className="flex items-center">
                              {selectedCategory?.icon || <Tag className="mr-2 h-4 w-4" />}
                              <span className="ml-2">{selectedCategory?.name || "Selecione uma categoria"}</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-muted-foreground">
                              <Tag className="mr-2 h-4 w-4" />
                              <span>Selecione uma categoria</span>
                            </div>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Buscar categoria..." />
                          <CommandEmpty>Nenhuma categoria encontrada</CommandEmpty>
                          <CommandList className="max-h-[200px]">
                            <CommandGroup>
                              {filteredCategories.map((category) => (
                                <CommandItem
                                  key={category.id}
                                  value={category.name}
                                  onSelect={() => {
                                    form.setValue("categoryId", category.id);
                                    setOpenCategoryPopover(false);
                                  }}
                                >
                                  <div className="flex items-center">
                                    {category.icon || 
                                      (watchType === 'expense' ? <ArrowUpRight className="h-4 w-4 text-red-500" /> :
                                       watchType === 'income' ? <ArrowDownRight className="h-4 w-4 text-emerald-500" /> :
                                       watchType === 'investment' ? <PiggyBank className="h-4 w-4 text-blue-500" /> :
                                       <RefreshCw className="h-4 w-4 text-purple-500" />)
                                    }
                                    <span className="ml-2">{category.name}</span>
                                  </div>
                                  {field.value === category.id && (
                                    <Check className="ml-auto h-4 w-4" />
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Inputs específicos por tipo de transação */}
            <div className={cn("grid gap-4", { "grid-cols-1": isCompact, "grid-cols-2": !isCompact })}>
              {/* Carteira de origem (para todos os tipos) */}
              <FormField
                control={form.control}
                name="walletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{watchType === 'transfer' ? 'Carteira de Origem' : 'Carteira'}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma carteira" />
                        </SelectTrigger>
                        <SelectContent>
                          {wallets.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                              <div className="flex items-center">
                                {wallet.icon || <Wallet className="mr-2 h-4 w-4" />}
                                <span className="ml-2">{wallet.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Carteira de destino (apenas para transferências) */}
              {watchType === 'transfer' && (
                <FormField
                  control={form.control}
                  name="destinationWalletId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carteira de Destino</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a carteira de destino" />
                          </SelectTrigger>
                          <SelectContent>
                            {destinationWallets.map((wallet) => (
                              <SelectItem key={wallet.id} value={wallet.id}>
                                <div className="flex items-center">
                                  {wallet.icon || <Wallet className="mr-2 h-4 w-4" />}
                                  <span className="ml-2">{wallet.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Método de pagamento (para despesas e investimentos) */}
              {(watchType === 'expense' || watchType === 'investment') && paymentMethods.length > 0 && (
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pagamento</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um método de pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((method) => (
                              <SelectItem key={method.id} value={method.id}>
                                <div className="flex items-center">
                                  {method.icon || <CreditCard className="mr-2 h-4 w-4" />}
                                  <span className="ml-2">{method.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            {/* Opções de recorrência */}
            <FormField
              control={form.control}
              name="isRecurrent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Transação Recorrente</FormLabel>
                    <FormDescription>
                      Marque esta opção para configurar recorrência.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Detalhes da recorrência, exibidos apenas se isRecurrent for verdadeiro */}
            {watchIsRecurrent && (
              <div className={cn("grid gap-4", { "grid-cols-1": isCompact, "grid-cols-2": !isCompact })}>
                <FormField
                  control={form.control}
                  name="recurrenceInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intervalo de Recorrência</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o intervalo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="biweekly">Quinzenal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                            <SelectItem value="quarterly">Trimestral</SelectItem>
                            <SelectItem value="yearly">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="recurrenceEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Término</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione a data final</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              locale={ptBR}
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {/* Notas */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre a transação"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Adicionar tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={handleAddTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Anexo (opcional) */}
            {allowAttachments && (
              <FormField
                control={form.control}
                name="attachment"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Anexo</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        {...field}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          onChange(file);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Anexe um recibo ou comprovante (PDF, JPG, PNG).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-between px-6 py-4">
        {showCancelButton && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        )}
        <Button
          onClick={form.handleSubmit(handleSubmit)}
          disabled={isLoading}
          className={!showCancelButton ? "w-full" : ""}
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            submitButtonText
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 