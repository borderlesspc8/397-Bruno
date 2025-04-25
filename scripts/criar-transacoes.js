import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function criarTransacoes() {
  try {
    console.log('Iniciando criação de transações...');
    
    // Obter as carteiras
    const carteiras = await prisma.wallet.findMany();
    
    if (carteiras.length === 0) {
      console.error('Nenhuma carteira encontrada. Execute primeiro o script de importação de carteiras.');
      return;
    }
    
    console.log(`Encontradas ${carteiras.length} carteiras.`);
    
    // Verificar saldos das carteiras
    console.log('Saldos das carteiras:');
    for (const carteira of carteiras) {
      console.log(`${carteira.name}: ${carteira.balance}`);
    }
    
    // Forçar saldos para algumas carteiras para testes
    console.log('\nForçando saldos para fins de teste:');
    
    // Primeira carteira com saldo positivo
    const carteira1 = carteiras[0];
    const saldo1 = 5000; // R$ 5.000,00
    console.log(`Definindo saldo de ${saldo1} para ${carteira1.name}`);
    
    // Segunda carteira com saldo negativo
    const carteira2 = carteiras[1];
    const saldo2 = -2500; // R$ -2.500,00
    console.log(`Definindo saldo de ${saldo2} para ${carteira2.name}`);
    
    // Alterar saldos no banco
    await prisma.wallet.update({
      where: { id: carteira1.id },
      data: { balance: saldo1 }
    });
    
    await prisma.wallet.update({
      where: { id: carteira2.id },
      data: { balance: saldo2 }
    });
    
    // Recarregar carteiras com saldos atualizados
    const carteirasAtualizadas = await prisma.wallet.findMany();
    console.log('\nCarteiras atualizadas:');
    for (const carteira of carteirasAtualizadas) {
      console.log(`${carteira.name}: ${carteira.balance}`);
    }
    
    // Usamos o userId da primeira carteira para as categorias
    const userId = carteiras[0].userId;
    console.log(`\nUsando userId ${userId} para as categorias`);
    
    // Buscar categorias existentes para usar nas transações
    const categorias = await prisma.category.findMany({
      where: { userId }
    });
    
    if (categorias.length === 0) {
      console.log('Nenhuma categoria encontrada. Criando categorias padrão...');
      
      // Criar categorias padrão
      await prisma.category.createMany({
        data: [
          { name: 'Alimentação', icon: '🍽️', color: '#FF5722', type: 'EXPENSE', userId },
          { name: 'Transporte', icon: '🚗', color: '#2196F3', type: 'EXPENSE', userId },
          { name: 'Moradia', icon: '🏠', color: '#4CAF50', type: 'EXPENSE', userId },
          { name: 'Lazer', icon: '🎮', color: '#9C27B0', type: 'EXPENSE', userId },
          { name: 'Saúde', icon: '💊', color: '#F44336', type: 'EXPENSE', userId },
          { name: 'Educação', icon: '📚', color: '#FFC107', type: 'EXPENSE', userId },
          { name: 'Salário', icon: '💰', color: '#4CAF50', type: 'INCOME', userId },
          { name: 'Investimentos', icon: '📈', color: '#9C27B0', type: 'INCOME', userId },
          { name: 'Transferência', icon: '↔️', color: '#2196F3', type: 'TRANSFER', userId },
        ],
      });
      
      // Buscar as categorias criadas
      const novasCategorias = await prisma.category.findMany({
        where: { userId }
      });
      console.log(`Criadas ${novasCategorias.length} categorias padrão.`);
      
      // Atualizar a variável de categorias
      categorias.push(...novasCategorias);
    } else {
      console.log(`Encontradas ${categorias.length} categorias existentes.`);
    }
    
    // Lista de categorias que podemos usar
    const categoriasEnum = [
      'VENDAS_BALCAO',
      'VENDAS_PRODUTOS',
      'DELIVERY',
      'REMUNERACAO_FUNCIONARIOS',
      'ENCARGOS_FGTS',
      'ENCARGOS_INSS',
      'ENCARGOS_ALIMENTACAO',
      'ENCARGOS_VALE_TRANSPORTE',
      'ENCARGOS_13_SALARIO',
      'ENCARGOS_14_SALARIO',
      'ENCARGOS_RESCISOES',
      'ENCARGOS_EXAMES',
      'REPOSICAO_ESTOQUE',
      'MANUTENCAO_EQUIPAMENTOS',
      'MATERIAL_REFORMA',
      'MATERIAL_ESCRITORIO',
      'AQUISICAO_EQUIPAMENTOS',
      'MARKETING_PUBLICIDADE',
      'TELEFONIA_INTERNET',
      'ENERGIA_AGUA',
      'TRANSPORTADORA',
      'CONTABILIDADE',
      'TROCO',
      'COMPRAS',
      'FERIAS',
      'OTHER'
    ];

    // Valores de enums de TransactionPaymentMethod corretos
    const metodosPagamento = [
      'CREDIT_CARD',
      'DEBIT_CARD',
      'BANK_TRANSFER',
      'BANK_SLIP',
      'CASH',
      'PIX',
      'OTHER'
    ];
    
    // Mapear carteiras por nome para facilitar acesso
    const carteirasPorNome = {};
    carteiras.forEach(carteira => {
      carteirasPorNome[carteira.name] = carteira;
    });
    
    // Definir algumas transações para cada carteira
    // Observe que o saldo já está definido, então estamos apenas criando transações de exemplo
    // que ilustrem como esse saldo poderia ter sido alcançado
    
    const transacoes = [];
    
    // Para cada carteira, vamos criar algumas transações que somem aproximadamente o saldo atual
    for (const carteira of carteirasAtualizadas) {
      const saldoAlvo = carteira.balance;
      console.log(`\nProcessando carteira ${carteira.name} com saldo ${saldoAlvo}`);
      
      // Se o saldo for negativo, criar algumas despesas
      if (saldoAlvo < 0) {
        // Dividir o saldo negativo em 3-5 transações de despesa
        const numTransacoes = Math.floor(Math.random() * 3) + 3; // 3 a 5 transações
        const valorMedio = Math.abs(saldoAlvo) / numTransacoes;
        
        console.log(`Criando ${numTransacoes} despesas de aproximadamente ${valorMedio.toFixed(2)} cada`);
        
        for (let i = 0; i < numTransacoes; i++) {
          // Variar um pouco o valor para ser mais realista
          const variacao = (Math.random() * 0.4) - 0.2; // -20% a +20%
          const valor = valorMedio * (1 + variacao);
          
          // Selecionar uma categoria aleatória do enum
          const categoria = categoriasEnum[Math.floor(Math.random() * categoriasEnum.length)];
          
          // Selecionar uma categoria de modelo Category para o relacionamento
          const categoriaId = categorias.length > 0 
            ? categorias[Math.floor(Math.random() * categorias.length)].id 
            : null;
          
          // Selecionar um método de pagamento aleatório
          const paymentMethod = metodosPagamento[Math.floor(Math.random() * metodosPagamento.length)];
          
          transacoes.push({
            walletId: carteira.id,
            userId: carteira.userId,
            date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Dias anteriores
            amount: -Math.abs(valor), // Negativo para despesa
            name: `Despesa ${i+1} - ${carteira.name}`,
            type: 'EXPENSE',
            status: 'PENDING',
            category: categoria, // Usar o valor do enum diretamente
            categoryId: categoriaId, // Adicionar o ID da categoria do modelo Category
            paymentMethod, // Adicionar método de pagamento
            metadata: { source: 'SCRIPT_IMPORT' }
          });
          
          console.log(`Despesa ${i+1}: ${valor.toFixed(2)} - Categoria: ${categoria}`);
        }
      } 
      // Se o saldo for positivo, criar algumas receitas
      else if (saldoAlvo > 0) {
        // Dividir o saldo positivo em 2-4 transações de receita
        const numTransacoes = Math.floor(Math.random() * 3) + 2; // 2 a 4 transações
        const valorMedio = saldoAlvo / numTransacoes;
        
        console.log(`Criando ${numTransacoes} receitas de aproximadamente ${valorMedio.toFixed(2)} cada`);
        
        for (let i = 0; i < numTransacoes; i++) {
          // Variar um pouco o valor para ser mais realista
          const variacao = (Math.random() * 0.4) - 0.2; // -20% a +20%
          const valor = valorMedio * (1 + variacao);
          
          // Selecionar uma categoria aleatória do enum
          const categoria = categoriasEnum[Math.floor(Math.random() * categoriasEnum.length)];
          
          // Selecionar uma categoria de modelo Category para o relacionamento
          const categoriaId = categorias.length > 0 
            ? categorias[Math.floor(Math.random() * categorias.length)].id 
            : null;
          
          // Selecionar um método de pagamento aleatório
          const paymentMethod = Math.random() > 0.7 
            ? metodosPagamento[Math.floor(Math.random() * metodosPagamento.length)]
            : 'PIX';
          
          transacoes.push({
            walletId: carteira.id,
            userId: carteira.userId,
            date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Dias anteriores
            amount: Math.abs(valor), // Positivo para receita
            name: `Receita ${i+1} - ${carteira.name}`,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            category: categoria, // Usar o valor do enum diretamente
            categoryId: categoriaId, // Adicionar o ID da categoria do modelo Category
            paymentMethod, // Adicionar método de pagamento
            metadata: { source: 'SCRIPT_IMPORT' }
          });
          
          console.log(`Receita ${i+1}: ${valor.toFixed(2)} - Categoria: ${categoria}`);
        }
      } else {
        console.log(`Carteira com saldo 0, nenhuma transação criada.`);
      }
    }
    
    console.log(`\nPronto para criar ${transacoes.length} transações no banco de dados.`);
    
    // Se temos transações para criar
    if (transacoes.length > 0) {
      // Criar as transações no banco de dados
      const resultado = await prisma.transaction.createMany({
        data: transacoes,
        skipDuplicates: true
      });
      
      console.log(`${resultado.count} transações criadas com sucesso.`);
    } else {
      console.log('Nenhuma transação para criar.');
    }
    
    // Verificar se o cálculo do saldo está funcionando
    console.log('\nVerificando cálculo de saldo das carteiras:');
    
    for (const carteira of carteirasAtualizadas) {
      // Buscar todas as transações da carteira
      const transacoesCarteira = await prisma.transaction.findMany({
        where: { walletId: carteira.id }
      });
      
      // Calcular o saldo com base nas transações
      const saldoCalculado = transacoesCarteira.reduce((total, tx) => {
        return total + tx.amount;
      }, 0);
      
      console.log(`${carteira.name}: Saldo armazenado=${carteira.balance}, Saldo calculado=${saldoCalculado.toFixed(2)}`);
      
      // Se houver diferença significativa, alertar
      if (Math.abs(carteira.balance - saldoCalculado) > 0.01) {
        console.log(`   ⚠️ ALERTA: Diferença encontrada no saldo da carteira ${carteira.name}`);
      }
    }
    
    console.log('\nProcesso concluído!');
  } catch (error) {
    console.error('Erro ao criar transações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a função principal
criarTransacoes(); 