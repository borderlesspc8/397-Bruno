import fs from 'node:fs';
import path from 'node:path';
import { format } from 'date-fns';
import { fileURLToPath } from 'node:url';

interface StatementData {
  startDate: string;
  endDate: string;
  fetchedAt: string;
  rawResponse: any;
}

/**
 * Garante que o diretório de armazenamento existe
 */
async function ensureStorageDirectory(): Promise<string> {
  // Obter caminho absoluto do diretório de armazenamento usando import.meta.url
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const projectRoot = path.resolve(__dirname, '../../');
  const storageDir = path.join(projectRoot, 'data', 'bank-statements');

  try {
    // Verificar se o diretório existe
    const stats = await fs.promises.stat(storageDir).catch(() => null);
    
    // Se não existir ou não for um diretório, criar
    if (!stats || !stats.isDirectory()) {
      console.log(`Criando diretório: ${storageDir}`);
      await fs.promises.mkdir(storageDir, { 
        recursive: true, 
        mode: 0o750 // Permissões: rwxr-x---
      });
      console.log(`Diretório de armazenamento criado: ${storageDir}`);
    } else {
      console.log(`Diretório já existe: ${storageDir}`);
    }

    // Verificar permissões
    const newStats = await fs.promises.stat(storageDir);
    console.log('Permissões do diretório:', {
      mode: newStats.mode.toString(8),
      uid: newStats.uid,
      gid: newStats.gid
    });

    return storageDir;
  } catch (error) {
    console.error('Erro ao criar diretório de armazenamento:', error);
    throw new Error('Falha ao criar diretório de armazenamento');
  }
}

/**
 * Valida o formato da data (YYYY-MM-DD)
 */
function validateDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/**
 * Armazena a resposta bruta do extrato bancário
 */
export async function storeRawStatement(
  startDate: string,
  endDate: string,
  rawResponse: any
): Promise<void> {
  console.log('Iniciando armazenamento do extrato bancário:', { startDate, endDate });

  // Validar datas
  if (!validateDate(startDate) || !validateDate(endDate)) {
    throw new Error('Datas devem estar no formato YYYY-MM-DD');
  }

  // Validar resposta
  if (!rawResponse) {
    throw new Error('Resposta da API está vazia');
  }

  try {
    // Garantir que o diretório existe
    const storageDir = await ensureStorageDirectory();

    // Criar nome do arquivo com timestamp
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const fileName = `statement_${startDate}_${endDate}_${timestamp}.json`;
    const filePath = path.join(storageDir, fileName);

    console.log('Preparando arquivo:', filePath);

    // Preparar dados para armazenamento
    const data: StatementData = {
      startDate,
      endDate,
      fetchedAt: new Date().toISOString(),
      rawResponse
    };

    // Converter para JSON com formatação
    const jsonContent = JSON.stringify(data, null, 2);
    console.log('Tamanho do conteúdo:', jsonContent.length, 'bytes');

    // Salvar arquivo com permissões restritas
    await fs.promises.writeFile(
      filePath,
      jsonContent,
      { 
        encoding: 'utf-8',
        mode: 0o640 // Permissões: rw-r-----
      }
    );

    // Verificar se o arquivo foi criado
    const fileStats = await fs.promises.stat(filePath);
    console.log('Arquivo criado:', {
      path: filePath,
      size: fileStats.size,
      mode: fileStats.mode.toString(8),
      created: fileStats.birthtime
    });

    console.log(`Extrato bancário salvo com sucesso em: ${filePath}`);
  } catch (error: any) {
    console.error('Erro ao armazenar extrato bancário:', error);
    throw new Error(`Falha ao armazenar extrato bancário: ${error.message || 'Erro desconhecido'}`);
  }
} 