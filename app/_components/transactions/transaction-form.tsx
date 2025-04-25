"use client";

import { useEffect, useState } from 'react';
import { 
  useTransactionForm,
  TransactionFormSchema
} from '@/app/_hooks/transaction/use-transaction-form';
import {
  TransactionType,
  TransactionCategory,
  TransactionPaymentMethod,
  Category,
  Wallet,
  TransactionFormValues
} from '@/app/_types/transaction';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import { Button } from '@/app/_components/ui/button';
import { Textarea } from '@/app/_components/ui/textarea';
import { DatePicker } from '@/app/_components/ui/date-picker';
import { Checkbox } from '@/app/_components/ui/checkbox';
import { Loader2, PlusCircle, X, Paperclip, Tag as TagIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/app/_components/ui/select';
import { ScrollArea } from '@/app/_components/ui/scroll-area';
import { Badge } from '@/app/_components/ui/badge';
import { cn } from '@/app/_lib/utils';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';

// Opções para tipos de transação
const TRANSACTION_TYPE_OPTIONS = [
  { value: TransactionType.EXPENSE, label: 'Despesa', variant: 'destructive' as const },
  { value: TransactionType.INCOME, label: 'Receita', variant: 'default' as const },
  { value: TransactionType.TRANSFER, label: 'Transferência', variant: 'secondary' as const },
  { value: TransactionType.INVESTMENT, label: 'Investimento', variant: 'outline' as const }
];

// Opções padrão para categorias
const DEFAULT_CATEGORY_OPTIONS = TransactionCategory && Object.values(TransactionCategory).map(value => ({
  value,
  label: value.charAt(0) + value.slice(1).toLowerCase().replace('_', ' ')
})) || [];

// Opções padrão para métodos de pagamento
const DEFAULT_PAYMENT_METHOD_OPTIONS = TransactionPaymentMethod && Object.values(TransactionPaymentMethod).map(value => ({
  value,
  label: value.charAt(0) + value.slice(1).toLowerCase().replace('_', ' ')
})) || [];

export interface TransactionFormProps {
  onSubmit?: (data: TransactionFormValues) => Promise<void>;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<TransactionFormValues>;
  categories?: Category[];
  wallets?: Wallet[];
  paymentMethods?: { value: string; label: string }[];
  isLoading?: boolean;
  variant?: 'default' | 'compact' | 'modal';
  showHeader?: boolean;
  headerTitle?: string;
}

/**
 * Componente de formulário reutilizável para transações
 */
export function TransactionForm({
  onSubmit,
  onSuccess,
  onCancel,
  initialData,
  categories,
  wallets = [],
  paymentMethods,
  isLoading: externalLoading,
  variant = 'default',
  showHeader = true,
  headerTitle = 'Nova Transação'
}: TransactionFormProps) {
  // Usar o hook de formulário de transação
  const { 
    form, 
    isLoading: formLoading, 
    submitForm,
    resetForm
  } = useTransactionForm({
    initialData,
    onSubmitSuccess: () => {
      if (onSuccess) onSuccess();
    }
  });
  
  // Estados locais para anexos e tags
  const [newTag, setNewTag] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Combinar estado de carregamento
  const isLoading = externalLoading || formLoading;
  
  // Atualizar valores do formulário quando props mudarem
  useEffect(() => {
    if (initialData) {
      form.reset({
        ...form.getValues(),
        ...initialData
      });
    }
  }, [initialData, form]);
  
  // Lidar com o envio do formulário
  const handleSubmit = async (values: TransactionFormSchema) => {
    // Adicionar tags do estado local ao formulário
    const formValues = {
      ...values,
      tags: form.getValues('tags') || []
    };
    
    // Adicionar anexos
    if (uploadedFiles.length > 0) {
      // Criar FormData para upload de arquivos
      const formData = new FormData();
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      // Aqui precisaríamos fazer o upload dos arquivos e obter os IDs
      // Mas como estamos apenas implementando o frontend, continuamos com os valores
    }
    
    if (onSubmit) {
      await onSubmit(formValues);
    } else {
      await submitForm(formValues);
    }
  };
  
  // Adicionar tag
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const currentTags = form.getValues('tags') || [];
    if (!currentTags.includes(newTag.trim())) {
      form.setValue('tags', [...currentTags, newTag.trim()]);
    }
    setNewTag('');
  };
  
  // Remover tag
  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };
  
  // Adicionar arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadedFiles(prev => [...prev, e.target.files![0]]);
    }
  };
  
  // Remover arquivo
  const handleRemoveFile = (fileToRemove: File) => {
    setUploadedFiles(prev => prev.filter(file => file !== fileToRemove));
  };
  
  // Determinar classes CSS com base na variante
  const getFormClasses = () => {
    switch (variant) {
      case 'compact':
        return 'space-y-3 p-2';
      case 'modal':
        return 'space-y-4 p-4';
      default:
        return 'space-y-6 p-6';
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={getFormClasses()}>
        {/* Cabeçalho do formulário */}
        {showHeader && (
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h3 className="text-lg font-medium">{headerTitle}</h3>
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <div className="flex gap-1">
                  {TRANSACTION_TYPE_OPTIONS.map(option => (
                    <Badge
                      key={option.value}
                      variant={field.value === option.value ? option.variant : 'outline'}
                      className={`cursor-pointer ${field.value === option.value ? 'opacity-100' : 'opacity-70'}`}
                      onClick={() => field.onChange(option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              )}
            />
          </div>
        )}
        
        {/* Campos do formulário */}
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Compra no supermercado" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0,00" 
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value instanceof Date ? field.value : new Date(field.value)}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value as string}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <ScrollArea className="h-60">
                        {(categories?.length ? 
                          categories.map(cat => ({
                            value: cat.id || cat.name,
                            label: cat.name
                          })) : 
                          DEFAULT_CATEGORY_OPTIONS
                        ).map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="walletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carteira</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma carteira" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <ScrollArea className="h-60">
                        {wallets.map(wallet => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de Pagamento</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um método de pagamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(paymentMethods || DEFAULT_PAYMENT_METHOD_OPTIONS).map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Abas para campos adicionais */}
          <Tabs defaultValue="detalhes" className="mt-4">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="anexos">Anexos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="detalhes" className="mt-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Adicione informações adicionais sobre a transação" 
                        {...field} 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="isReconciled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Transação reconciliada</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Marque esta opção se a transação já foi confirmada com o extrato bancário
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="tags" className="mt-4">
              <div className="space-y-4">
                <FormLabel>Tags</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(form.getValues('tags') || []).map(tag => (
                    <Badge key={tag} className="px-2 py-1 flex items-center gap-1">
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)}
                        className="text-xs rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  
                  {(form.getValues('tags') || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma tag adicionada
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova tag"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                  >
                    <TagIcon className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Pressione Enter para adicionar rapidamente
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="anexos" className="mt-4">
              <div className="space-y-4">
                <FormLabel>Anexos</FormLabel>
                <div className="flex flex-col gap-2 mb-4">
                  {uploadedFiles.length > 0 ? (
                    uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({Math.round(file.size / 1024)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(file)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum arquivo anexado
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Paperclip className="h-4 w-4 mr-1" />
                    Anexar arquivo
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: imagens, PDF, documentos Word e Excel (máx. 5MB)
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Botões de ação */}
          <div className={cn("flex justify-end gap-2", variant === 'compact' ? 'mt-2' : 'mt-6')}>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            )}
            
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData?.id ? 'Atualizar' : 'Salvar'} Transação
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
} 