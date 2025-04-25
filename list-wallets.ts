import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listWallets() {
  try {
    console.log('Buscando carteiras no banco de dados...');
    
    const wallets = await prisma.wallet.findMany({
      include: {
        bank: true
      }
    });
    
    console.log(`Total de carteiras encontradas: ${wallets.length}`);
    
    // Listar cada carteira com detalhes
    wallets.forEach((wallet, index) => {
      console.log(`\n------- Carteira ${index + 1} -------`);
      console.log(`ID: ${wallet.id}`);
      console.log(`Nome: ${wallet.name}`);
      console.log(`Tipo: ${wallet.type}`);
      console.log(`Saldo: ${wallet.balance}`);
      console.log(`Usuário: ${wallet.userId}`);
      
      if (wallet.bankId) {
        console.log(`Banco: ${wallet.bank?.name || 'N/A'} (ID: ${wallet.bankId})`);
      }
      
      // Extrair detalhes relevantes dos metadados
      const metadata = wallet.metadata as any;
      if (metadata) {
        console.log('Metadados:');
        
        if (metadata.gestaoClickId) {
          console.log(`- ID Gestão Click: ${metadata.gestaoClickId}`);
        }
        
        if (metadata.gestaoClickType) {
          console.log(`- Tipo Gestão Click: ${metadata.gestaoClickType}`);
        }
        
        if (metadata.gestaoClickBanco) {
          console.log(`- Banco Gestão Click: ${metadata.gestaoClickBanco}`);
        }
        
        if (metadata.gestaoClick) {
          console.log('- Credenciais Gestão Click: Presentes');
        }
      }
    });
  } catch (error) {
    console.error('Erro ao listar carteiras:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar função principal
listWallets(); 