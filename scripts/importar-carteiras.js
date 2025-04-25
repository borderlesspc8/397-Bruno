import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Dados das carteiras conforme exibido na imagem
const carteirasDados = [
  {
    name: "BANCO DO BRASIL",
    balance: -3172.99,
    type: "MANUAL",
  },
  {
    name: "Conta Stone",
    balance: 223914.37,
    type: "MANUAL",
  },
  {
    name: "PIX C6 BANK",
    balance: -644416.27,
    type: "MANUAL",
  },
  {
    name: "STONE",
    balance: 11864.28,
    type: "MANUAL",
  },
  {
    name: "C6 BANK",
    balance: 268452.62,
    type: "MANUAL",
  },
  {
    name: "ESPEIE", // Mantenho o nome conforme na imagem, mesmo com possível erro de digitação
    balance: 107653.89,
    type: "MANUAL",
  },
  {
    name: "Conta Safra",
    balance: 327967.42,
    type: "MANUAL",
  },
  {
    name: "NUBANK JURÍDICA",
    balance: -320137.09,
    type: "MANUAL",
  },
  {
    name: "SAFRA PAY",
    balance: -3141.60,
    type: "MANUAL",
  }
];

async function importarCarteiras() {
  try {
    console.log('Iniciando importação de carteiras...');
    
    // Primeiro, verificar se temos usuário para associar as carteiras
    const usuario = await prisma.user.findFirst();
    
    if (!usuario) {
      console.error('Nenhum usuário encontrado no banco de dados. Crie um usuário primeiro.');
      return;
    }
    
    console.log(`Usando usuário: ${usuario.email} (ID: ${usuario.id})`);
    
    // Importando cada carteira
    for (const dadosCarteira of carteirasDados) {
      const carteira = await prisma.wallet.create({
        data: {
          name: dadosCarteira.name,
          balance: dadosCarteira.balance,
          type: dadosCarteira.type,
          userId: usuario.id,
          metadata: {
            source: 'SCRIPT_IMPORT',
            importDate: new Date().toISOString()
          }
        }
      });
      
      console.log(`Carteira criada: ${carteira.name} - Saldo: ${carteira.balance}`);
    }
    
    // Verificar as carteiras criadas
    const carteiras = await prisma.wallet.findMany({
      where: { userId: usuario.id }
    });
    
    console.log('\nResumo das carteiras importadas:');
    console.log(`Total de carteiras: ${carteiras.length}`);
    
    const saldoTotal = carteiras.reduce((total, wallet) => total + wallet.balance, 0);
    console.log(`Saldo total combinado: ${saldoTotal.toFixed(2)}`);
    
    console.log('\nImportação concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao importar carteiras:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a função principal
importarCarteiras(); 