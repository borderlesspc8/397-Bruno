/**
 * Script para limpar o banco de dados e preparar para integração em tempo real com o Gestão Click
 * Este script:
 * 1. Remove todas as transações existentes
 * 2. Remove históricos de importação
 * 3. Remove configurações de integração antigas
 * 4. Prepara as tabelas para receber dados em tempo real
 */

import { PrismaClient, WalletType } from '@prisma/client';
import { createInterface } from 'readline';

// Criar instância do Prisma
const prisma = new PrismaClient();

// Confirmar com o usuário
const readline = createInterface({
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
    await prisma.$executeRaw`DELETE FROM "ImportSchedule" WHERE metadata::text LIKE '%gestao-click%' OR metadata::text LIKE '%gestaoclick%'`;
    console.log('✅ Agendamentos de importação removidos com sucesso');

    // Redefinir carteiras para balance zero
    console.log('💰 Redefinindo saldos das carteiras...');
    await prisma.wallet.updateMany({
      data: {
        balance: 0
      }
    });
    console.log('✅ Saldos das carteiras redefinidos com sucesso');

    // Remover vendas e registros de vendas relacionados ao Gestão Click
    // Usando o nome real das tabelas conforme definido no schema
    console.log('🛒 Removendo registros de vendas...');
    await prisma.$executeRaw`TRUNCATE TABLE "sales_transaction" CASCADE;`;
    await prisma.$executeRaw`TRUNCATE TABLE "sales_records" CASCADE;`;
    console.log('✅ Registros de vendas removidos com sucesso');

    // Remover parcelamentos
    console.log('📅 Removendo parcelamentos...');
    await prisma.$executeRaw`TRUNCATE TABLE "installments" CASCADE;`;
    console.log('✅ Parcelamentos removidos com sucesso');

    // Remover entradas de fluxo de caixa
    console.log('💵 Removendo entradas de fluxo de caixa...');
    await prisma.$executeRaw`TRUNCATE TABLE "cash_flow_entries" CASCADE;`;
    console.log('✅ Entradas de fluxo de caixa removidas com sucesso');

    // Preparar configurações para integração em tempo real
    console.log('⚙️  Preparando configurações para integração em tempo real...');
    
    // Buscar carteiras específicas do Gestão Click utilizando SQL direto para evitar problemas de tipo
    const gestaoClickWallets = await prisma.$queryRaw`
      SELECT id, metadata FROM "Wallet" 
      WHERE name LIKE '%GESTAO_CLICK%' 
      AND metadata IS NOT NULL
    `;
    
    // Atualizar metadados das carteiras para ativar sincronização em tempo real
    for (const wallet of gestaoClickWallets as any[]) {
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
    }
    
    console.log('✅ Configurações de integração atualizadas para modo em tempo real');
    console.log('🎉 Limpeza do banco de dados concluída com sucesso!');
    console.log('➡️  O sistema está pronto para receber dados do Gestão Click em tempo real.');
  } catch (error) {
    console.error('❌ Erro durante a limpeza do banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Função para executar após confirmação
function runWithConfirmation() {
  readline.question('⚠️  Tem certeza que deseja limpar o banco de dados? Esta ação é irreversível! (S/N): ', async (answer) => {
    if (answer.toLowerCase() === 's') {
      await cleanDatabase();
    } else {
      console.log('❌ Operação cancelada pelo usuário.');
    }
    readline.close();
  });
}

// Verificar se está sendo executado diretamente ou importado
if (require.main === module) {
  runWithConfirmation();
} else {
  // Se for importado como módulo, exportar a função principal
  module.exports = cleanDatabase;
} 