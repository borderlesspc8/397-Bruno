import { createClient } from '@/app/_lib/supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

export interface ImageMetadata {
  vendedorId: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

/**
 * Serviço para gerenciar upload e download de imagens no Supabase Storage
 * Especializado para imagens de vendedores
 */
export class SupabaseStorageService {
  private static supabase = createClient();
  private static readonly BUCKET_NAME = 'vendedores-imagens';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

  /**
   * Valida se o arquivo é uma imagem válida
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'Arquivo não fornecido' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: `Arquivo muito grande. Máximo permitido: ${this.MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: `Tipo de arquivo não permitido. Tipos aceitos: ${this.ALLOWED_TYPES.join(', ')}` };
    }

    return { valid: true };
  }

  /**
   * Gera um nome único para o arquivo baseado no ID do vendedor
   */
  private static generateFileName(vendedorId: string, originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    return `vendedor_${vendedorId}_${timestamp}.${extension}`;
  }

  /**
   * Faz upload de uma imagem para o Supabase Storage
   */
  static async uploadImage(
    vendedorId: string, 
    file: File, 
    position?: { x: number; y: number; rotation: number }
  ): Promise<UploadResult> {
    try {
      // Validar arquivo
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Gerar nome único para o arquivo
      const fileName = this.generateFileName(vendedorId, file.name);
      const filePath = `${vendedorId}/${fileName}`;

      // Fazer upload para o Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Substituir arquivo se já existir
          contentType: file.type
        });

      if (error) {
        console.error('Erro no upload para Supabase:', error);
        return { success: false, error: error.message };
      }

      // Obter URL pública da imagem
      const { data: urlData } = this.supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        return { success: false, error: 'Erro ao obter URL pública da imagem' };
      }

      // Adicionar timestamp para evitar cache
      const urlWithTimestamp = `${urlData.publicUrl}?t=${Date.now()}`;

      return {
        success: true,
        url: urlWithTimestamp,
        path: filePath
      };

    } catch (error) {
      console.error('Erro no upload da imagem:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido no upload' 
      };
    }
  }

  /**
   * Busca a URL de uma imagem de vendedor
   */
  static async getImageUrl(vendedorId: string): Promise<string | null> {
    try {
      // Listar arquivos do vendedor
      const { data: files, error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .list(vendedorId, {
          limit: 1,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Erro ao listar arquivos:', error);
        return null;
      }

      if (!files || files.length === 0) {
        return null;
      }

      // Obter URL pública do arquivo mais recente
      const { data: urlData } = this.supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(`${vendedorId}/${files[0].name}`);

      return urlData?.publicUrl || null;

    } catch (error) {
      console.error('Erro ao buscar URL da imagem:', error);
      return null;
    }
  }

  /**
   * Lista todas as imagens de um vendedor
   */
  static async listVendedorImages(vendedorId: string): Promise<ImageMetadata[]> {
    try {
      const { data: files, error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .list(vendedorId);

      if (error) {
        console.error('Erro ao listar imagens do vendedor:', error);
        return [];
      }

      if (!files) {
        return [];
      }

      return files.map(file => ({
        vendedorId,
        originalName: file.name,
        size: file.metadata?.size || 0,
        mimeType: file.metadata?.mimetype || 'image/jpeg',
        uploadedAt: new Date(file.created_at)
      }));

    } catch (error) {
      console.error('Erro ao listar imagens do vendedor:', error);
      return [];
    }
  }

  /**
   * Remove uma imagem específica
   */
  static async deleteImage(vendedorId: string, fileName: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .remove([`${vendedorId}/${fileName}`]);

      if (error) {
        console.error('Erro ao deletar imagem:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      return false;
    }
  }

  /**
   * Remove todas as imagens de um vendedor
   */
  static async deleteAllVendedorImages(vendedorId: string): Promise<boolean> {
    try {
      const { data: files, error: listError } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .list(vendedorId);

      if (listError) {
        console.error('Erro ao listar arquivos para exclusão:', listError);
        return false;
      }

      if (!files || files.length === 0) {
        return true; // Nenhum arquivo para deletar
      }

      const filePaths = files.map(file => `${vendedorId}/${file.name}`);
      
      const { error: deleteError } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .remove(filePaths);

      if (deleteError) {
        console.error('Erro ao deletar imagens:', deleteError);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Erro ao deletar imagens do vendedor:', error);
      return false;
    }
  }

  /**
   * Obtém estatísticas do bucket
   */
  static async getBucketStats(): Promise<{ totalFiles: number; totalSize: number }> {
    try {
      const { data: files, error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .list('', { limit: 1000 }); // Listar até 1000 arquivos

      if (error) {
        console.error('Erro ao obter estatísticas do bucket:', error);
        return { totalFiles: 0, totalSize: 0 };
      }

      const totalFiles = files?.length || 0;
      const totalSize = files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;

      return { totalFiles, totalSize };

    } catch (error) {
      console.error('Erro ao obter estatísticas do bucket:', error);
      return { totalFiles: 0, totalSize: 0 };
    }
  }
}





