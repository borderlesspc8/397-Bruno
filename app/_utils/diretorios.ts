import fs from 'fs';
import path from 'path';

/**
 * Utilitário para operações com diretórios do sistema
 */
export class DiretoriosUtils {
  /**
   * Garante que um diretório exista, criando-o recursivamente se necessário
   * @param dirPath Caminho do diretório a ser verificado/criado
   * @returns true se o diretório existe ou foi criado com sucesso
   */
  static garantirDiretorio(dirPath: string): boolean {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Diretório criado: ${dirPath}`);
      }
      return true;
    } catch (error) {
      console.error(`Erro ao criar diretório ${dirPath}:`, error);
      return false;
    }
  }
  
  /**
   * Garante que os diretórios de uploads do sistema existam
   * Deve ser chamado durante a inicialização da aplicação
   */
  static inicializarDiretoriosUploads(): void {
    // Diretório base de uploads
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    this.garantirDiretorio(uploadDir);
    
    // Diretórios específicos
    const diretoriosNecessarios = [
      path.join(uploadDir, 'vendedores'),
      path.join(uploadDir, 'produtos'),
      path.join(uploadDir, 'clientes'),
      path.join(uploadDir, 'documentos'),
      path.join(uploadDir, 'temp')
    ];
    
    for (const dir of diretoriosNecessarios) {
      this.garantirDiretorio(dir);
    }
    
    console.log('Diretórios de uploads inicializados com sucesso');
  }
  
  /**
   * Lista todos os arquivos em um diretório
   * @param dirPath Caminho do diretório a ser listado
   * @returns Array com os nomes dos arquivos ou array vazio em caso de erro
   */
  static listarArquivos(dirPath: string): string[] {
    try {
      if (!fs.existsSync(dirPath)) {
        return [];
      }
      
      return fs.readdirSync(dirPath)
        .filter(file => !fs.statSync(path.join(dirPath, file)).isDirectory());
    } catch (error) {
      console.error(`Erro ao listar arquivos do diretório ${dirPath}:`, error);
      return [];
    }
  }
  
  /**
   * Limpa arquivos temporários com mais de X dias
   * @param dias Número de dias para considerar um arquivo como antigo
   */
  static limparArquivosTemporarios(dias: number = 1): void {
    try {
      const tempDir = path.join(process.cwd(), 'public', 'uploads', 'temp');
      
      if (!fs.existsSync(tempDir)) {
        return;
      }
      
      const arquivos = fs.readdirSync(tempDir);
      const agora = new Date();
      
      for (const arquivo of arquivos) {
        const caminhoArquivo = path.join(tempDir, arquivo);
        const stat = fs.statSync(caminhoArquivo);
        
        const dataArquivo = new Date(stat.mtime);
        const diferencaDias = (agora.getTime() - dataArquivo.getTime()) / (1000 * 3600 * 24);
        
        if (diferencaDias > dias) {
          fs.unlinkSync(caminhoArquivo);
          console.log(`Arquivo temporário removido: ${caminhoArquivo}`);
        }
      }
    } catch (error) {
      console.error('Erro ao limpar arquivos temporários:', error);
    }
  }
} 