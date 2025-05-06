import { PrismaClient } from '@prisma/client';
import { GestaoClickService } from './app/_services/gestao-click-service';

const prisma = new PrismaClient();

async function testImportWithNewCategories() {
  try {
    console.log('Iniciando teste de importação com novas categorias...');
    
    // Obter usuário de teste
    const user = await prisma.user.findFirst({
      where: {
        email: {
          contains: "teste_",
          endsWith: "@acceleracrm.com.br"
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!user) {
      throw new Error('Usuário de teste não encontrado');
    }

    console.log(`Usuário de teste encontrado: ${user.email}`);

    // Configurar serviço do Gestão Click em modo de desenvolvimento
    const gestaoClickService = new GestaoClickService({
      apiKey: 'teste_dev_key',
      secretToken: 'teste_dev_token',
      apiUrl: 'https://api.gestaoclick.com',
      userId: user.id,
      empresa: 'Teste Empresa'
    });

    // Forçar o modo de desenvolvimento/simulação
    console.log('Configurando modo de desenvolvimento para simulação...');
    
    // Importar carteiras
    console.log('Importando carteiras...');
    const walletsResult = await gestaoClickService.importAllWallets();
    
    console.log(`Carteiras importadas: ${walletsResult.totalCreated}`);
    console.log(`Carteiras ignoradas: ${walletsResult.skipped}`);
    
    // Listar IDs das carteiras importadas
    const walletIds = walletsResult.wallets.map(w => w.id);
    
    // Para cada carteira, importar transações simuladas
    console.log('\nImportando transações para cada carteira...');
    let totalTransactionsImported = 0;
    
    for (const walletId of walletIds) {
      // Usar a data de início um mês atrás e fim hoje
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      
      const endDate = new Date();
      
      console.log(`Importando transações para carteira ${walletId}...`);
      
      try {
        const result = await gestaoClickService.importTransactions(walletId, {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });
        
        console.log(`- Transações importadas: ${result.totalImported}`);
        totalTransactionsImported += result.totalImported;
      } catch (error) {
        console.error(`Erro ao importar transações para carteira ${walletId}:`, error);
      }
    }
    
    console.log(`\nTotal de transações importadas: ${totalTransactionsImported}`);
    
    // Verificar categorias das transações importadas
    console.log('\nVerificando categorias das transações:');
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        wallet: {
          OR: [
            { type: 'GESTAO_CLICK' },
            { type: 'GESTAO_CLICK_COST_CENTER' }
          ]
        }
      },
      select: {
        id: true,
        name: true,
        category: true
      }
    });
    
    // Agrupar por categoria
    const categoryCounts: Record<string, number> = {};
    transactions.forEach(t => {
      if (!categoryCounts[t.category]) {
        categoryCounts[t.category] = 0;
      }
      categoryCounts[t.category]++;
    });
    
    console.log('\nContagem de transações por categoria:');
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`- ${category}: ${count} transações`);
      });
    
    return { success: true, message: 'Teste concluído com sucesso' };
  } catch (error) {
    console.error('Erro ao testar importação:', error);
    return { success: false, error };
  } finally {
    await prisma.$disconnect();
  }
}

testImportWithNewCategories()
  .then(result => {
    console.log('\nResultado final:', result);
    if (!result.success) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Erro não tratado:', error);
    process.exit(1);
  }); 