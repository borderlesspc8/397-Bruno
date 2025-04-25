import { api } from '@/app/_lib/api';

interface ImagemVendedorResponse {
  url?: string;
  erro?: string;
}

interface UploadImagemResponse {
  sucesso?: boolean;
  success?: boolean;
  url?: string;
  filename?: string;
  erro?: string;
  error?: string;
  timestamp?: number;
  nota?: string;
}

interface ImagePosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

/**
 * Serviço para gerenciar as imagens de perfil dos vendedores
 * 
 * Fornece funcionalidades para buscar, salvar e gerenciar as imagens
 * de perfil dos vendedores no sistema. Inclui cache em memória para
 * minimizar requisições repetidas à API.
 */
export class VendedorImagensService {
  // Cache em memória para minimizar requisições repetidas
  private static cacheImagens: Map<string, string> = new Map();
  
  // Imagem padrão quando não há foto disponível
  private static readonly DEFAULT_IMAGE = '/images/default-avatar.svg';
  
  /**
   * Busca a URL da imagem do vendedor pelo ID
   * @param vendedorId ID do vendedor
   * @param forceRefresh Forçar atualização do cache
   * @returns URL da imagem ou imagem padrão em caso de erro
   */
  static async buscarImagemVendedor(vendedorId: string, forceRefresh = false): Promise<string> {
    try {
      // Verificar se ID é válido
      if (!vendedorId) {
        console.warn('ID do vendedor não fornecido para buscar imagem');
        return this.DEFAULT_IMAGE;
      }
      
      // Verificar se a imagem já está em cache e não está forçando atualização
      if (!forceRefresh && this.cacheImagens.has(vendedorId)) {
        return this.cacheImagens.get(vendedorId) || this.DEFAULT_IMAGE;
      }
      
      // Buscar a imagem do vendedor na API
      const { data } = await api.get<ImagemVendedorResponse>(
        `/api/dashboard/vendedores/${vendedorId}/imagem`,
        { params: { t: Date.now() } } // Adicionar timestamp para evitar cache do navegador
      );
      
      if (data.erro || !data.url) {
        console.warn(`Imagem não encontrada para vendedor ${vendedorId}:`, data.erro);
        return this.DEFAULT_IMAGE;
      }
      
      // Adicionar parâmetro de timestamp à URL para prevenir cache
      const urlComTimestamp = data.url.includes('?') 
        ? `${data.url}&t=${Date.now()}` 
        : `${data.url}?t=${Date.now()}`;
      
      // Guardar no cache
      this.cacheImagens.set(vendedorId, urlComTimestamp);
      
      return urlComTimestamp;
    } catch (error) {
      console.error(`Erro ao buscar imagem do vendedor ${vendedorId}:`, error);
      return this.DEFAULT_IMAGE;
    }
  }
  
  /**
   * Salva uma nova imagem para o vendedor
   * @param vendedorId ID do vendedor
   * @param imagemFile Arquivo de imagem a ser enviado
   * @param position Dados de posicionamento da imagem (opcional)
   * @returns true se salvo com sucesso, false em caso de erro
   */
  static async salvarImagemVendedor(
    vendedorId: string, 
    imagemFile: File, 
    position?: ImagePosition
  ): Promise<boolean> {
    try {
      // Verificar se ID e arquivo são válidos
      if (!vendedorId) {
        console.error('ID do vendedor não fornecido');
        return false;
      }
      
      if (!imagemFile) {
        console.error('Arquivo de imagem não fornecido');
        return false;
      }
      
      // Verificar tipo de arquivo
      if (!imagemFile.type.startsWith('image/')) {
        console.error('Tipo de arquivo inválido:', imagemFile.type);
        return false;
      }
      
      // Criar um FormData para enviar o arquivo
      const formData = new FormData();
      formData.append('file', imagemFile);
      
      // Adicionar dados de posicionamento se disponíveis
      if (position) {
        // Garantir que os valores são números válidos
        const positionData = {
          x: typeof position.x === 'number' ? position.x : 0,
          y: typeof position.y === 'number' ? position.y : 0,
          scale: typeof position.scale === 'number' ? position.scale : 1,
          rotation: typeof position.rotation === 'number' ? position.rotation : 0
        };
        
        console.log('Dados de posicionamento validados:', positionData);
        formData.append('posicionamento', JSON.stringify(positionData));
      }
      
      // Enviar para a API com timeout mais longo para processamento de imagens
      const { data } = await api.post<UploadImagemResponse>(
        `/api/dashboard/vendedores/${vendedorId}/imagem`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 segundos para permitir o processamento de imagens maiores
        }
      );
      
      // Verificar sucesso - a API retorna success: true ou error
      if (!data.success && !data.sucesso) {
        console.error(`Erro ao salvar imagem do vendedor ${vendedorId}:`, data.erro || data.error);
        return false;
      }
      
      // Atualizar o cache se houver URL retornada
      if (data.url || data.filename) {
        // URL pode estar em 'url' ou 'filename' dependendo da implementação da API
        const fileUrl = data.url || data.filename || '';
        
        // Adicionar parâmetro de timestamp à URL
        const urlComTimestamp = fileUrl.includes('?') 
          ? `${fileUrl}&t=${Date.now()}` 
          : `${fileUrl}?t=${Date.now()}`;
        
        this.cacheImagens.set(vendedorId, urlComTimestamp);
      } else {
        // Se não retornou URL, limpar o cache para forçar nova busca
        this.cacheImagens.delete(vendedorId);
      }
      
      return true;
    } catch (error) {
      console.error(`Erro ao salvar imagem do vendedor ${vendedorId}:`, error);
      return false;
    }
  }
  
  /**
   * Limpa o cache de imagens para forçar nova busca
   * @param vendedorId Opcional: ID do vendedor específico para limpar do cache
   */
  static limparCache(vendedorId?: string): void {
    if (vendedorId) {
      this.cacheImagens.delete(vendedorId);
    } else {
      this.cacheImagens.clear();
    }
  }
} 