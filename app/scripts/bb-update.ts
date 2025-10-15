import fs from 'fs';
import path from 'path';

/**
 * Script para atualizar as importações do módulo bb-integration.ts
 * Este script auxilia na migração do arquivo monolítico para a estrutura modular
 */

const ROOT_DIR = process.cwd();
const APP_DIR = path.join(ROOT_DIR, 'app');

// Conteúdo para o novo arquivo de barrel
const NEW_BB_INTEGRATION_CONTENT = `// Este arquivo está sendo substituído pela nova estrutura modular em /app/_lib/bb-integration/

import { BBIntegrationService, bbService } from './bb-integration';

// Re-exportar o serviço principal
export { BBIntegrationService, bbService };

// Re-exportar tipos e utilitários
export * from './bb-integration/types';
export * from './bb-integration/utils';

// Exportar a classe principal como padrão
export default BBIntegrationService;`;

// Função para fazer backup do arquivo atual
function backupFile(filePath: string) {
  const backupPath = `${filePath}.bak`;
  if (fs.existsSync(filePath)) {
    console.log(`Criando backup do arquivo: ${filePath} -> ${backupPath}`);
    fs.copyFileSync(filePath, backupPath);
    return true;
  }
  return false;
}

// Função para substituir o arquivo original
function replaceFile(filePath: string, newContent: string) {
  console.log(`Atualizando arquivo: ${filePath}`);
  fs.writeFileSync(filePath, newContent, 'utf8');
}

// Função principal para atualizar o bb-integration.ts
function updateBBIntegration() {
  const bbIntegrationPath = path.join(APP_DIR, '_lib', 'bb-integration.ts');
  
  // Verificar se o arquivo existe
  if (!fs.existsSync(bbIntegrationPath)) {
    console.error(`❌ Arquivo não encontrado: ${bbIntegrationPath}`);
    return false;
  }

  try {
    // Fazer backup do arquivo atual
    const backupCreated = backupFile(bbIntegrationPath);
    if (!backupCreated) {
      console.warn('⚠️ Não foi possível criar backup.');
    }
    
    // Substituir o arquivo original pelo novo conteúdo
    replaceFile(bbIntegrationPath, NEW_BB_INTEGRATION_CONTENT);
    
    console.log('✅ Atualização concluída com sucesso!');
    console.log(`🔄 Para restaurar o backup, execute: cp ${bbIntegrationPath}.bak ${bbIntegrationPath}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar o arquivo:', error);
    return false;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const result = updateBBIntegration();
  process.exit(result ? 0 : 1);
} 
