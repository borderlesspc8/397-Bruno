import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Criar um usuário de teste
    const email = `teste_${Date.now()}@contarapida.com.br`;
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: randomUUID(),
        name: 'Usuário de Teste',
        email,
        emailVerified: new Date(),
        image: null,
      },
    });

    console.log('Usuário de teste criado com sucesso:');
    console.log({
      id: user.id,
      name: user.name,
      email: user.email
    });

    // Verificar se as carteiras do Gestão Click estão associadas ao usuário
    const wallets = await prisma.wallet.findMany({
      where: {
        OR: [
          { type: 'GESTAO_CLICK' },
          { type: 'GESTAO_CLICK_COST_CENTER' }
        ]
      }
    });

    if (wallets.length > 0) {
      console.log(`Encontradas ${wallets.length} carteiras do Gestão Click.`);
      
      // Associar carteiras ao usuário de teste
      for (const wallet of wallets) {
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { userId: user.id }
        });
      }
      
      console.log(`Carteiras associadas ao usuário de teste.`);
    } else {
      console.log('Nenhuma carteira do Gestão Click encontrada.');
    }

    // Verificar transações associadas às carteiras
    const transactions = await prisma.transaction.findMany({
      where: {
        wallet: {
          OR: [
            { type: 'GESTAO_CLICK' },
            { type: 'GESTAO_CLICK_COST_CENTER' }
          ]
        }
      },
      include: {
        wallet: true
      }
    });

    console.log(`Encontradas ${transactions.length} transações nas carteiras do Gestão Click.`);
    
    // Associar transações ao usuário de teste
    if (transactions.length > 0) {
      for (const transaction of transactions) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { userId: user.id }
        });
      }
      
      console.log(`Transações associadas ao usuário de teste.`);
    }

    return user;
  } catch (error) {
    console.error('Erro ao criar usuário de teste:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser()
  .then(() => console.log('Script concluído com sucesso.'))
  .catch(console.error); 