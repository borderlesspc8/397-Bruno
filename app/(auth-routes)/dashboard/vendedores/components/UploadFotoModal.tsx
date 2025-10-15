"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Vendedor } from "@/app/_services/betelTecnologia";
import { VendedorImagensService } from "@/app/_services/vendedorImagens";
import { SupabaseStorageService } from "@/app/_services/supabaseStorageService";
import DefaultAvatar from "@/app/components/DefaultAvatar";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface UploadFotoModalProps {
  vendedor: Vendedor | null;
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  onFotoAtualizada: () => void;
}

export function UploadFotoModal({ 
  vendedor, 
  aberto, 
  onOpenChange,
  onFotoAtualizada
}: UploadFotoModalProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imagemAtual, setImagemAtual] = useState<string | undefined>(undefined);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Buscar imagem atual quando o modal é aberto
  useEffect(() => {
    if (aberto && vendedor && !imagemAtual && !previewUrl) {
      buscarImagemAtual();
    }
    
    // Limpar estado quando o modal é fechado
    if (!aberto) {
      setArquivo(null);
      setPreviewUrl(null);
      setErro(null);
      setImagemAtual(undefined);
    }
  }, [aberto, vendedor, imagemAtual, previewUrl]);
  
  const buscarImagemAtual = async () => {
    if (vendedor) {
      try {
        const url = await VendedorImagensService.buscarImagemVendedor(vendedor.id);
        setImagemAtual(url);
      } catch (error) {
        console.error("Erro ao buscar imagem atual:", error);
        setImagemAtual(undefined);
      }
    }
  };
  
  // Resetar estado quando o modal é fechado
  const handleClose = () => {
    setArquivo(null);
    setPreviewUrl(null);
    setErro(null);
    onOpenChange(false);
  };
  
  // Manipular seleção de arquivo
  const handleSelecaoArquivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (files && files[0]) {
      const file = files[0];
      
      // Verificar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setErro('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      
      // Verificar tamanho do arquivo (limite de 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErro('O arquivo é muito grande. O tamanho máximo é 5MB.');
        return;
      }
      
      // Verificar se o arquivo não é muito pequeno (menos de 10KB provavelmente tem qualidade baixa)
      if (file.size < 10 * 1024) {
        setErro('O arquivo é muito pequeno. Selecione uma imagem de melhor qualidade.');
        return;
      }
      
      // Criar objeto URL para verificar dimensões
      const url = URL.createObjectURL(file);
      const img = new Image();
      
      img.onload = () => {
        // Verificar dimensões mínimas (pelo menos 160x160 pixels)
        if (img.width < 160 || img.height < 160) {
          setErro('A imagem é muito pequena. Use uma imagem com pelo menos 160x160 pixels.');
          URL.revokeObjectURL(url);
          return;
        }
        
        // Verificar dimensões máximas (evita problemas com memória)
        if (img.width > 5000 || img.height > 5000) {
          setErro('A imagem é muito grande em dimensões. O tamanho máximo é 5000x5000 pixels.');
          URL.revokeObjectURL(url);
          return;
        }
        
        // Imagem válida
        setErro(null);
        setArquivo(file);
        setPreviewUrl(url);
        
        console.log(`Imagem selecionada: ${file.name} (${file.type})`);
        console.log(`Dimensões: ${img.width}x${img.height}, Tamanho: ${Math.round(file.size / 1024)}KB`);
      };
      
      img.onerror = () => {
        setErro('Não foi possível carregar a imagem. Selecione outro arquivo.');
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    }
  };
  
  // Limpar seleção de arquivo
  const limparSelecao = () => {
    setArquivo(null);
    setPreviewUrl(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  // Fazer o upload da imagem
  const enviarImagem = async () => {
    if (!arquivo || !vendedor) return;

    try {
      setCarregando(true);
      setErro(null);

      console.log(`Enviando imagem para vendedor ID: ${vendedor.id}`);

      // Primeiro, tentar salvar no Supabase Storage
      try {
        const result = await SupabaseStorageService.uploadImage(vendedor.id, arquivo);
        
        if (result.success && result.url) {
          // Forçar a limpeza do cache da imagem para garantir que a nova versão seja exibida
          VendedorImagensService.limparCache(vendedor.id);
          
          console.log('Imagem salva com sucesso no Supabase Storage');
          
          // Inserir um pequeno atraso para garantir que a imagem está disponível
          setTimeout(() => {
            // Verificar se a imagem está realmente disponível
            buscarImagemAtual(); 
            
            toast.success('Foto atualizada com sucesso no Supabase!');
            onFotoAtualizada();
            handleClose();
          }, 500);
          
          return; // Sucesso, sair da função
        } else {
          console.warn(`Falha ao salvar no Supabase Storage: ${result.error}`);
        }
      } catch (supabaseError) {
        console.warn(`Erro no Supabase Storage, tentando API legada:`, supabaseError);
      }

      // Fallback: usar API legada se Supabase falhar
      try {
        // Criar FormData
        const formData = new FormData();
        
        // Adicionar arquivo com chave 'file' para corresponder ao backend
        formData.append('file', arquivo);

        // Preparar dados de posicionamento - apenas para compatibilidade
        const posicionamento = {
          imageFile: {
            name: arquivo.name,
            type: arquivo.type,
            size: arquivo.size
          }
        };
        
        console.log("Enviando dados de arquivo via API legada:", posicionamento);
        formData.append('posicionamento', JSON.stringify(posicionamento));

        // Chamada à API
        const response = await fetch(`/api/dashboard/vendedores/${vendedor.id}/imagem`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.erro || 'Erro ao enviar imagem');
        }

        // Forçar a limpeza do cache da imagem para garantir que a nova versão seja exibida
        VendedorImagensService.limparCache(vendedor.id);
        
        // Inserir um pequeno atraso para garantir que o servidor processou a imagem
        setTimeout(() => {
          // Verificar se a imagem está realmente disponível
          buscarImagemAtual(); 
          
          toast.success('Foto atualizada com sucesso!');
          onFotoAtualizada();
          handleClose();
        }, 500);
        
      } catch (apiError) {
        console.error('Erro na API legada:', apiError);
        throw apiError; // Re-throw para ser capturado pelo catch externo
      }
      
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      
      // Mensagem mais detalhada para o usuário
      if (error instanceof Error) {
          toast.error(error.message);
      } else {
        toast.error('Erro ao processar imagem. Tente novamente mais tarde.');
      }
    } finally {
      setCarregando(false);
    }
  };
  
  if (!vendedor) return null;
  
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload de Foto - {vendedor.nome}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center justify-center gap-4">
            <div 
              ref={containerRef}
              className="relative h-60 w-full rounded-md overflow-hidden border-2 border-[#faba33] flex items-center justify-center"
            >
              {previewUrl ? (
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    ref={imageRef}
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                <DefaultAvatar 
                  src={imagemAtual}
                  alt={`Foto de ${vendedor.nome}`}
                    size={140}
                />
                  <p className="text-sm text-muted-foreground mt-2">
                    Selecione uma imagem para visualizar
                  </p>
                </div>
              )}
            </div>
            
            {arquivo && (
              <div className="flex items-center gap-2 text-sm">
                <ImageIcon className="h-4 w-4 text-green-500" />
                <span className="font-medium">{arquivo.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({Math.round(arquivo.size / 1024)} KB)
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={limparSelecao}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {erro && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded w-full">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{erro}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="foto">Selecione uma nova foto</Label>
            <Input
              ref={inputRef}
              id="foto"
              type="file"
              accept="image/*"
              onChange={handleSelecaoArquivo}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formatos aceitos: JPG, PNG. Tamanho máximo: 5MB. 
              A imagem será salva em alta resolução e sem cortes.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={carregando}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={enviarImagem}
            disabled={!arquivo || carregando}
            className="bg-[#faba33] hover:bg-[#e9a92a] text-white"
          >
            {carregando ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Enviando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>Enviar Foto</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
