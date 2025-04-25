/**
 * Script para excluir todas as transações do banco de dados
 * ⚠️ ATENÇÃO: Este script exclui PERMANENTEMENTE todos os dados de transações
 * 
 * Execução:
 * 1. Modo simulação (não exclui, apenas mostra o que seria excluído):
 *    npm run delete-transactions -- dryRun=true
 * 
 * 2. Exclusão real (necessita confirmação explícita):
 *    npm run delete-transactions -- confirm=DELETAR_TODAS_TRANSACOES
 * 
 * 3. Filtrar por usuário específico:
 *    npm run delete-transactions -- userId=USER_ID confirm=DELETAR_TODAS_TRANSACOES
 * 
 * 4. Exportar dados antes de apagar:
 *    npm run delete-transactions -- exportData=true confirm=DELETAR_TODAS_TRANSACOES
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Parâmetros da linha de comando
const args = process.argv.slice(2);
const params = {};

// Processar argumentos
args.forEach(arg => {
  const [key, value] = arg.split('=');
  if (key && value) {
    params[key] = value;
  }
});

// Verificar opções
const dryRun = params.dryRun === 'true';
const confirmCode = params.confirm;
const userId = params.userId;
const exportData = params.exportData === 'true';
const CONFIRMATION_CODE = 'DELETAR_TODAS_TRANSACOES';

// Cores para console
const colors = {
  red: '\x1b[31m%s\x1b[0m',
  green: '\x1b[32m%s\x1b[0m',
  yellow: '\x1b[33m%s\x1b[0m',
  blue: '\x1b[34m%s\x1b[0m',
  magenta: '\x1b[35m%s\x1b[0m',
  cyan: '\x1b[36m%s\x1b[0m',
};

/**
 * Função para exportar as transações para um arquivo JSON
 */
async function exportTransactionsToFile(transactions) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportDir = './exports';
    
    // Criar diretório de exports se não existir
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const filePath = path.join(exportDir, `transactions_export_${timestamp}.json`);
    
    // Converter as datas para string para evitar problemas de serialização
    const serializedData = transactions.map(tx => ({
      ...tx,
      date: tx.date.toISOString(),
      createdAt: tx.createdAt.toISOString(),
      updatedAt: tx.updatedAt.toISOString()
    }));
    
    fs.writeFileSync(filePath, JSON.stringify(serializedData, null, 2));
    console.log(colors.green, `✅ Dados exportados para: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(colors.red, `❌ Erro ao exportar dados: ${error.message}`);
    return null;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log(colors.blue, '🔍 Iniciando operação de exclusão de transações');
  
  // Verificar se o modo de simulação está ativo
  if (dryRun) {
    console.log(colors.yellow, '⚠️ MODO SIMULAÇÃO: Nenhuma alteração será feita no banco de dados');
  } 
  // Verificar se a confirmação foi fornecida
  else if (confirmCode !== CONFIRMATION_CODE) {
    console.error(colors.red, `❌ ERRO: Confirmação inválida ou não fornecida.`);
    console.log(colors.yellow, `⚠️ Para confirmar a exclusão, execute:`);
    console.log(`   npm run delete-transactions -- confirm=${CONFIRMATION_CODE}`);
    process.exit(1);
  }
  
  // Construir condição de filtro
  const whereCondition = userId ? { userId } : {};
  
  try {
    // Contar transações antes da exclusão
    const count = await prisma.transaction.count({
      where: whereCondition
    });
    
    if (count === 0) {
      console.log(colors.yellow, '⚠️ Nenhuma transação encontrada com os critérios especificados.');
      return;
    }
    
    console.log(colors.magenta, `📊 Total de transações encontradas: ${count}`);
    
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });
      
      if (user) {
        console.log(colors.cyan, `👤 Filtrando por usuário: ${user.email} (${userId})`);
      } else {
        console.log(colors.yellow, `⚠️ Usuário com ID ${userId} não encontrado, mas prosseguindo mesmo assim.`);
      }
    } else {
      console.log(colors.red, `❗ ATENÇÃO: Todas as transações de TODOS os usuários serão excluídas.`);
    }
    
    // Exportar dados se solicitado
    if (exportData) {
      console.log(colors.blue, '📥 Exportando transações antes da exclusão...');
      
      // Buscar as transações
      const transactions = await prisma.transaction.findMany({
        where: whereCondition,
        include: {
          wallet: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        }
      });
      
      await exportTransactionsToFile(transactions);
    }
    
    // Aguardar confirmação final se não for dry run
    if (!dryRun) {
      console.log(colors.red, '⚠️ ATENÇÃO: Esta operação não pode ser desfeita!');
      console.log(colors.yellow, '🕒 Aguardando 5 segundos antes de prosseguir... Pressione Ctrl+C para cancelar');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Executar exclusão
    if (!dryRun) {
      console.log(colors.blue, '🗑️ Excluindo transações...');
      
      const result = await prisma.transaction.deleteMany({
        where: whereCondition
      });
      
      console.log(colors.green, `✅ ${result.count} transações foram excluídas com sucesso.`);
    } else {
      console.log(colors.yellow, `🔍 SIMULAÇÃO: ${count} transações seriam excluídas.`);
    }
    
  } catch (error) {
    console.error(colors.red, `❌ Erro durante a operação: ${error.message}`);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar função principal
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(colors.red, `❌ Erro fatal: ${error.message}`);
    process.exit(1);
  }); 