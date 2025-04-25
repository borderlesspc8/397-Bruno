// Script principal para migração completa de fluxo de caixa
import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'child_process';
import { createInterface } from 'readline';

const prisma = new PrismaClient();
const readline = createInterface({
  input: process.stdin,
  output: process.stdout
});

async function prompt(question) {
  return new Promise((resolve) => {
    readline.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function executeMigration() {
  try {
    console.log('=== MIGRAÇÃO DE FLUXO DE CAIXA E INTEGRAÇÃO COM VENDAS ===');
    console.log('Este script executará as seguintes etapas:');
    console.log('1. População da tabela de fluxo de caixa com transações existentes');
    console.log('2. Importação de vendas do Gestão Click e associação com fluxo de caixa');
    console.log('3. Associação de transações a centros de custo');
    console.log('4. Verificação e validação dos dados migrados');
    console.log('\nIMPORTANTE: Recomenda-se fazer backup do banco de dados antes de continuar.\n');
    
    const confirmation = await prompt('Deseja continuar? (S/N): ');
    if (confirmation.toLowerCase() !== 's') {
      console.log('Operação cancelada pelo usuário.');
      readline.close();
      return;
    }
    
    // Etapa 1: Verificar estado atual
    console.log('\n[Etapa Preliminar] Verificando estado atual do banco de dados...');
    
    const transactionCount = await prisma.transaction.count();
    const cashFlowCount = await prisma.cash_flow_entries.count();
    const salesCount = await prisma.sales_records.count();
    const installmentsCount = await prisma.installments.count();
    const costCentersCount = await prisma.costCenter.count();
    
    console.log(`- Transações: ${transactionCount}`);
    console.log(`- Entradas de fluxo de caixa: ${cashFlowCount}`);
    console.log(`- Vendas: ${salesCount}`);
    console.log(`- Parcelas: ${installmentsCount}`);
    console.log(`- Centros de custo: ${costCentersCount}`);
    
    // Etapa 2: População do fluxo de caixa com transações
    console.log('\n[Etapa 1] Populando tabela de fluxo de caixa com transações existentes...');
    
    if (cashFlowCount > 0) {
      const overwrite = await prompt('Já existem entradas na tabela de fluxo de caixa. Deseja continuar mesmo assim? (S/N): ');
      if (overwrite.toLowerCase() !== 's') {
        console.log('Pulando etapa de população de fluxo de caixa.');
      } else {
        await executeScript('populate-cash-flow.js');
      }
    } else {
      await executeScript('populate-cash-flow.js');
    }
    
    // Etapa 3: Importação de vendas do Gestão Click
    console.log('\n[Etapa 2] Importando vendas do Gestão Click...');
    
    if (salesCount > 0) {
      const overwriteSales = await prompt('Já existem vendas importadas. Deseja continuar mesmo assim? (S/N): ');
      if (overwriteSales.toLowerCase() !== 's') {
        console.log('Pulando etapa de importação de vendas.');
      } else {
        await executeScript('import-gestao-click-sales.js');
      }
    } else {
      await executeScript('import-gestao-click-sales.js');
    }
    
    // Etapa 4: Associar transações a centros de custo
    console.log('\n[Etapa 3] Associando transações a centros de custo...');
    await executeScript('associate-transactions-cost-centers.js');
    
    // Etapa 5: Verificação final
    console.log('\n[Etapa 4] Verificando estado final do banco de dados...');
    
    const finalTransactionCount = await prisma.transaction.count();
    const finalCashFlowCount = await prisma.cash_flow_entries.count();
    const finalSalesCount = await prisma.sales_records.count();
    const finalInstallmentsCount = await prisma.installments.count();
    const finalCostCentersCount = await prisma.costCenter.count();
    
    console.log('Estado inicial:');
    console.log(`- Transações: ${transactionCount}`);
    console.log(`- Entradas de fluxo de caixa: ${cashFlowCount}`);
    console.log(`- Vendas: ${salesCount}`);
    console.log(`- Parcelas: ${installmentsCount}`);
    console.log(`- Centros de custo: ${costCentersCount}`);
    
    console.log('\nEstado final:');
    console.log(`- Transações: ${finalTransactionCount}`);
    console.log(`- Entradas de fluxo de caixa: ${finalCashFlowCount} (+${finalCashFlowCount - cashFlowCount})`);
    console.log(`- Vendas: ${finalSalesCount} (+${finalSalesCount - salesCount})`);
    console.log(`- Parcelas: ${finalInstallmentsCount} (+${finalInstallmentsCount - installmentsCount})`);
    console.log(`- Centros de custo: ${finalCostCentersCount} (+${finalCostCentersCount - costCentersCount})`);
    
    // Verificação detalhada
    console.log('\nExecutando verificação detalhada de fluxo de caixa...');
    await executeScript('check-cash-flow.js');
    
    console.log('\n===== MIGRAÇÃO CONCLUÍDA COM SUCESSO =====');
    console.log('Seu sistema agora possui um fluxo de caixa completo com:');
    console.log('- Entradas baseadas em transações existentes');
    console.log('- Vendas e parcelas importadas do Gestão Click');
    console.log('- Transações associadas a centros de custo e vendas');
    console.log('\nO que fazer agora:');
    console.log('1. Verifique o fluxo de caixa na interface da aplicação');
    console.log('2. Configure suas carteiras e mapeamentos de centro de custo');
    console.log('3. Crie previsões manuais de fluxo de caixa para o futuro');
    
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    readline.close();
    await prisma.$disconnect();
  }
}

/**
 * Executa um script específico usando Node.js
 */
function executeScript(scriptName) {
  console.log(`Executando script: ${scriptName}`);
  
  const result = spawnSync('node', [`scripts/${scriptName}`], {
    stdio: 'inherit',
    env: process.env
  });
  
  if (result.error) {
    console.error(`Erro ao executar script ${scriptName}:`, result.error);
    throw result.error;
  }
  
  if (result.status !== 0) {
    console.error(`Script ${scriptName} falhou com código de saída ${result.status}`);
    throw new Error(`Script ${scriptName} falhou com código de saída ${result.status}`);
  }
  
  console.log(`Script ${scriptName} concluído com sucesso.`);
}

// Executar a migração
executeMigration(); 