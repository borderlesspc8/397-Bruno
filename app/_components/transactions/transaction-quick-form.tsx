"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Calendar, 
  Check, 
  RefreshCw, 
  Tag, 
  Wallet as WalletIcon,
  X,
  Plus,
  CreditCard,
  PiggyBank,
  MessageSquare,
  Paperclip,
  RotateCw
} from 'lucide-react';

import { Button } from '@/app/_components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import { Textarea } from '@/app/_components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/_components/ui/popover';
import { Calendar as CalendarComponent } from '@/app/_components/ui/calendar';
import { Checkbox } from '@/app/_components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Badge } from '@/app/_components/ui/badge';
import { cn } from '@/app/_lib/utils';
import { Dialog, DialogContent, DialogTrigger } from '@/app/_components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/app/_components/ui/command';

import { 
  transactionFormSchema, 
  TransactionFormValues, 
  Category, 
  Wallet,
  TransactionPaymentMethod 
} from './transaction-schema';

interface TransactionQuickFormProps {
  initialData?: Partial<TransactionFormValues>;
  onSubmit: (data: TransactionFormValues) => void;
  onCancel?: () => void;
  categories: Category[];
  wallets: Wallet[];
  paymentMethods?: TransactionPaymentMethod[];
  isLoading?: boolean;
}

export function TransactionQuickForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  categories, 
  wallets, 
  paymentMethods = [],
  isLoading = false 
}: TransactionQuickFormProps) {
  // Estados para controlar o formulário
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
  
  // Obter título do formulário baseado no tipo de transação
  const getFormTitle = () => {
    switch (activeTab) {
      case 'income': return 'Nova receita';
      case 'expense': return 'Nova despesa';
      case 'investment': return 'Novo investimento';
      case 'transfer': return 'Nova transferência';
      default: return 'Nova transação';
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border rounded-xl bg-card">
      <CardHeader className="pb-3">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'income' | 'expense' | 'investment' | 'transfer')}
          className="w-full"
        >
          <div className="flex justify-between items-center mb-3">
            <CardTitle className="text-xl font-semibold">{getFormTitle()}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <TabsList className="grid grid-cols-4 mb-4 w-full">
            <TabsTrigger value="expense" className="flex items-center gap-1.5 py-2">
              <ArrowUpRight className="h-4 w-4 text-red-500" />
              <span>Despesa</span>
            </TabsTrigger>
            <TabsTrigger value="income" className="flex items-center gap-1.5 py-2">
              <ArrowDownRight className="h-4 w-4 text-emerald-500" />
              <span>Receita</span>
            </TabsTrigger>
            <TabsTrigger value="investment" className="flex items-center gap-1.5 py-2">
              <PiggyBank className="h-4 w-4 text-blue-500" />
              <span>Investimento</span>
            </TabsTrigger>
            <TabsTrigger value="transfer" className="flex items-center gap-1.5 py-2">
              <RefreshCw className="h-4 w-4 text-purple-500" />
              <span>Transferência</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="px-6 pb-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Descrição</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={
                        activeTab === 'expense' ? 'Ex: Compra no supermercado' :
                        activeTab === 'income' ? 'Ex: Salário mensal' :
                        activeTab === 'investment' ? 'Ex: Aplicação em CDB' :
                        'Ex: Transferência para poupança'
                      } 
                      {...field} 
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Linha flexível para valor e data */}
            <div className="grid grid-cols-2 gap-4">
              {/* Valor */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Valor</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                          R$
                        </div>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          {...field}
                          onChange={(e) => {
                            // Limpar o valor para permitir apenas números e vírgula
                            const value = e.target.value.replace(/[^\d,]/g, '');
                            // Converter para o formato que o field espera
                            const numericValue = parseFloat(value.replace(',', '.')) || 0;
                            field.onChange(numericValue);
                            // Manter o valor formatado no input
                            e.target.value = value;
                          }}
                          className="pl-10 h-11"
                          value={field.value ? field.value.toString().replace('.', ',') : ''}
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
                    <FormLabel className="text-sm font-medium">Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-11"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                          </Button>
                        </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Carteira (origem ou única) */}
            <FormField
              control={form.control}
              name="walletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {watchType === 'transfer' ? 'Conta/Cartão (Origem)' : 'Conta/Cartão'}
                  </FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione uma conta ou cartão" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          <div className="flex items-center">
                            {wallet.icon || <WalletIcon className="mr-2 h-4 w-4" />}
                            <span className="ml-2">{wallet.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <FormLabel className="text-sm font-medium">Conta/Cartão (Destino)</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione a conta de destino" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {destinationWallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            <div className="flex items-center">
                              {wallet.icon || <WalletIcon className="mr-2 h-4 w-4" />}
                              <span className="ml-2">{wallet.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Categoria */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Categoria</FormLabel>
                  <Popover open={openCategoryPopover} onOpenChange={setOpenCategoryPopover}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between h-11"
                        >
                          {field.value ? (
                            <div className="flex items-center">
                              {selectedCategory?.icon || (
                                watchType === 'expense' ? <ArrowUpRight className="h-4 w-4 text-red-500" /> :
                                watchType === 'income' ? <ArrowDownRight className="h-4 w-4 text-emerald-500" /> :
                                watchType === 'investment' ? <PiggyBank className="h-4 w-4 text-blue-500" /> :
                                <RefreshCw className="h-4 w-4 text-purple-500" />
                              )}
                              <span className="ml-2">{selectedCategory?.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-muted-foreground">
                              <Tag className="mr-2 h-4 w-4" />
                              <span>Buscar a categoria...</span>
                            </div>
                          )}
                        </Button>
                      </FormControl>
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
                                  {category.icon || (
                                    watchType === 'expense' ? <ArrowUpRight className="h-4 w-4 text-red-500" /> :
                                    watchType === 'income' ? <ArrowDownRight className="h-4 w-4 text-emerald-500" /> :
                                    watchType === 'investment' ? <PiggyBank className="h-4 w-4 text-blue-500" /> :
                                    <RefreshCw className="h-4 w-4 text-purple-500" />
                                  )}
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
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Opções adicionais em formato de ícones clicáveis */}
            <div className="grid grid-cols-4 gap-2 py-2">
              {/* Recorrência */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="flex flex-col items-center justify-center cursor-pointer p-3 rounded-full hover:bg-muted">
                    <RotateCw className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Repetir</span>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <div className="space-y-4 py-2">
                    <h3 className="text-lg font-medium">Configurar Recorrência</h3>
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
                            <p className="text-sm text-muted-foreground">
                              Marque esta opção para configurar recorrência.
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {watchIsRecurrent && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="recurrenceInterval"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Intervalo de Recorrência</FormLabel>
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
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className="w-full justify-start text-left font-normal"
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {field.value ? (
                                        format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                      ) : (
                                        <span>Selecione a data final</span>
                                      )}
                                    </Button>
                                  </FormControl>
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Observação */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="flex flex-col items-center justify-center cursor-pointer p-3 rounded-full hover:bg-muted">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Observação</span>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <div className="space-y-4 py-2">
                    <h3 className="text-lg font-medium">Adicionar Observação</h3>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Informações adicionais sobre a transação"
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Anexo */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="flex flex-col items-center justify-center cursor-pointer p-3 rounded-full hover:bg-muted">
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Anexo</span>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <div className="space-y-4 py-2">
                    <h3 className="text-lg font-medium">Adicionar Anexo</h3>
                    <FormField
                      control={form.control}
                      name="attachment"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
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
                          <p className="text-sm text-muted-foreground mt-2">
                            Anexe um recibo ou comprovante (PDF, JPG, PNG).
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Tags */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="flex flex-col items-center justify-center cursor-pointer p-3 rounded-full hover:bg-muted">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Tags</span>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <div className="space-y-4 py-2">
                    <h3 className="text-lg font-medium">Gerenciar Tags</h3>
                    <div className="space-y-2">
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
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="pb-6 pt-4">
        <Button
          type="submit"
          onClick={form.handleSubmit(handleSubmit)}
          disabled={isLoading}
          className={cn(
            "w-full h-14 rounded-full text-md font-medium",
            activeTab === 'expense' ? "bg-red-500 hover:bg-red-600" : 
            activeTab === 'income' ? "bg-emerald-500 hover:bg-emerald-600" :
            activeTab === 'investment' ? "bg-blue-500 hover:bg-blue-600" :
            "bg-purple-500 hover:bg-purple-600"
          )}
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              Processando...
            </>
          ) : (
            <Check className="mr-2 h-5 w-5" />
          )}
          Confirmar
        </Button>
      </CardFooter>
    </Card>
  );
} 