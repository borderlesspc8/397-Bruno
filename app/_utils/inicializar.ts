'use server';

import { DiretoriosUtils } from './diretorios';

/**
 * Inicializa os recursos do sistema que precisam ser preparados
 * durante o boot da aplicação (apenas no lado do servidor)
 */
export async function inicializarDiretorios() {
  // Verificar se estamos no servidor (não no cliente)
  if (typeof window === 'undefined') {
    try {
      console.log('Inicializando diretórios do sistema...');
      DiretoriosUtils.inicializarDiretoriosUploads();
      
      // Limpar arquivos temporários com mais de 7 dias
      DiretoriosUtils.limparArquivosTemporarios(7);
      
      console.log('Inicialização do sistema concluída com sucesso');
    } catch (error) {
      console.error('Erro durante a inicialização do sistema:', error);
    }
  }
} 
