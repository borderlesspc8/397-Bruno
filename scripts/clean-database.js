/**
 * Script para limpar o banco de dados e preparar para integração em tempo real com o Gestão Click
 * Este script:
 * 1. Remove todas as transações existentes
 * 2. Remove históricos de importação
 * 3. Remove configurações de integração antigas
 * 4. Prepara as tabelas para receber dados em tempo real
 */

import { PrismaClient } from '@prisma/client';
import readline from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';

// Obter referência ao módulo atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar instância do Prisma
const prisma = new PrismaClient();

// Verificar argumentos para modo automático
const args = process.argv.slice(2);
const AUTO_MODE = args.includes('--auto') || args.includes('-a') || args.includes('--force') || args.includes('-f');

// Confirmar com o usuário se não estiver em modo automático
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função principal
async function cleanDatabase() {
  console.log('🧹 Iniciando limpeza do banco de dados...');
  console.log('⚠️  AVISO: Esta operação irá remover todos os dados de transações e importações!');

  try {
    // Remover transações existentes
    console.log('📊 Removendo transações...');
    await prisma.transaction.deleteMany({});
    console.log('✅ Transações removidas com sucesso');

    // Remover registros de importação
    console.log('📜 Removendo históricos de importação...');
    await prisma.importHistory.deleteMany({});
    console.log('✅ Históricos de importação removidos com sucesso');

    // Remover mapeamentos de categorias do Gestão Click
    console.log('🏷️  Removendo mapeamentos de categorias...');
    await prisma.categoryMapping.deleteMany({
      where: {
        source: 'GESTAO_CLICK'
      }
    });
    console.log('✅ Mapeamentos de categorias removidos com sucesso');

    // Remover agendamentos de importação
    console.log('🔄 Removendo agendamentos de importação...');
    try {
      await prisma.$executeRaw`DELETE FROM "ImportSchedule" WHERE metadata::text LIKE '%gestao-click%' OR metadata::text LIKE '%gestaoclick%'`;
      console.log('✅ Agendamentos de importação removidos com sucesso');
    } catch (error) {
      console.warn('⚠️  Aviso: Não foi possível remover agendamentos de importação:', error.message);
      console.log('Continuando com o processo...');
    }

    // Redefinir carteiras para balance zero
    console.log('💰 Redefinindo saldos das carteiras...');
    await prisma.wallet.updateMany({
      data: {
        balance: 0
      }
    });
    console.log('✅ Saldos das carteiras redefinidos com sucesso');

    // Remover vendas e registros de vendas relacionados ao Gestão Click
    console.log('🛒 Removendo registros de vendas...');
    try {
      // Verificar se a tabela sales_records existe antes de tentar truncar
      const tableExists = await checkTableExists('sales_records');
      if (tableExists) {
        await prisma.$executeRaw`TRUNCATE TABLE "sales_records" CASCADE;`;
        console.log('✅ Registros de vendas removidos com sucesso');
      } else {
        console.log('ℹ️  Tabela de vendas não encontrada, pulando esta etapa');
      }
    } catch (error) {
      console.warn('⚠️  Aviso: Não foi possível remover registros de vendas:', error.message);
      console.log('Continuando com o processo...');
    }

    // Remover parcelamentos
    console.log('📅 Removendo parcelamentos...');
    try {
      // Verificar se a tabela de parcelas existe antes de tentar truncar
      const tableExists = await checkTableExists('installments');
      if (tableExists) {
        await prisma.$executeRaw`TRUNCATE TABLE "installments" CASCADE;`;
        console.log('✅ Parcelamentos removidos com sucesso');
      } else {
        console.log('ℹ️  Tabela de parcelas não encontrada, pulando esta etapa');
      }
    } catch (error) {
      console.warn('⚠️  Aviso: Não foi possível remover parcelamentos:', error.message);
      console.log('Continuando com o processo...');
    }

    // Remover entradas de fluxo de caixa
    console.log('💵 Removendo entradas de fluxo de caixa...');
    try {
      // Verificar se a tabela existe antes de tentar truncar
      const tableExists = await checkTableExists('cash_flow_entries');
      if (tableExists) {
        await prisma.$executeRaw`TRUNCATE TABLE "cash_flow_entries" CASCADE;`;
        console.log('✅ Entradas de fluxo de caixa removidas com sucesso');
      } else {
        console.log('ℹ️  Tabela de fluxo de caixa não encontrada, pulando esta etapa');
      }
    } catch (error) {
      console.warn('⚠️  Aviso: Não foi possível remover entradas de fluxo de caixa:', error.message);
      console.log('Continuando com o processo...');
    }

    // Preparar configurações para integração em tempo real
    console.log('⚙️  Preparando configurações para integração em tempo real...');
    
    // Buscar carteiras específicas do Gestão Click utilizando SQL direto para evitar problemas de tipo
    let gestaoClickWallets = [];
    try {
      gestaoClickWallets = await prisma.$queryRaw`
        SELECT id, metadata FROM "Wallet" 
        WHERE name LIKE '%GESTAO_CLICK%' 
        AND metadata IS NOT NULL
      `;
    } catch (error) {
      console.warn('⚠️  Aviso: Erro ao buscar carteiras do Gestão Click:', error.message);
      console.log('Continuando com o processo...');
    }
    
    // Atualizar metadados das carteiras para ativar sincronização em tempo real
    if (gestaoClickWallets.length > 0) {
      for (const wallet of gestaoClickWallets) {
        try {
          const metadata = wallet.metadata || {};
          
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
              metadata: {
                ...metadata,
                lastSync: null, // Forçar sincronização completa
                realtimeSync: true, // Ativar sincronização em tempo real
                syncFrequency: 'hourly', // Configurar para sincronização horária
              }
            }
          });
        } catch (error) {
          console.warn(`⚠️  Aviso: Não foi possível atualizar a carteira ${wallet.id}:`, error.message);
          console.log('Continuando com o processo...');
        }
      }
      console.log('✅ Configurações de integração atualizadas para modo em tempo real');
    } else {
      console.log('ℹ️  Nenhuma carteira do Gestão Click encontrada para atualizar');
    }
    
    console.log('🎉 Limpeza do banco de dados concluída com sucesso!');
    console.log('➡️  O sistema está pronto para receber dados do Gestão Click em tempo real.');
    
    return true;
  } catch (error) {
    console.error('❌ Erro durante a limpeza do banco de dados:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Verifica se uma tabela existe no banco de dados
 * @param {string} tableName Nome da tabela
 * @returns {Promise<boolean>} Verdadeiro se a tabela existir
 */
async function checkTableExists(tableName) {
  try {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      );
    `;
    
    // O PostgreSQL retorna um array com um objeto que contém a propriedade 'exists'
    return result[0].exists;
  } catch (error) {
    console.warn(`⚠️  Erro ao verificar se a tabela ${tableName} existe:`, error.message);
    return false;
  }
}

// Função para executar após confirmação
function runWithConfirmation() {
  if (AUTO_MODE) {
    console.log('🔄 Executando em modo automático...');
    cleanDatabase().then(() => {
      console.log('🏁 Processo concluído em modo automático.');
      process.exit(0);
    }).catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
    return;
  }
  
  rl.question('⚠️  Tem certeza que deseja limpar o banco de dados? Esta ação é irreversível! (S/N): ', async (answer) => {
    if (answer.toLowerCase() === 's') {
      const success = await cleanDatabase();
      if (success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    } else {
      console.log('❌ Operação cancelada pelo usuário.');
      process.exit(0);
    }
    rl.close();
  });
}

// Verificar se está sendo executado diretamente ou importado
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  runWithConfirmation();
}

// Exportar a função principal
export default cleanDatabase; 