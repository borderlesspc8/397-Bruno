import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Criar usuário de teste
  const hashedPassword = await bcrypt.hash("teste123", 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: "teste@acceleracrm.com.br" },
    update: {},
    create: {
      email: "teste@acceleracrm.com.br",
      name: "Usuário de Teste",
      password: hashedPassword,
      emailVerified: new Date(),
      image: "https://ui-avatars.com/api/?name=Usuario+Teste",
      role: "USER",
    },
  });

  console.log(`Usuário de teste criado: ${testUser.id}`);

  // Verificar carteiras existentes
  const existingWallets = await prisma.wallet.findMany({
    where: { userId: testUser.id }
  });

  // Criar carteiras de demonstração
  const wallets = [
    {
      name: "Carteira Principal",
      balance: 5000,
      type: "MANUAL",
      userId: testUser.id,
    },
    {
      name: "Carteira de Investimentos",
      balance: 10000,
      type: "MANUAL",
      userId: testUser.id,
    },
    {
      name: "Carteira de Emergência",
      balance: 3000,
      type: "MANUAL",
      userId: testUser.id,
    },
  ];

  const createdWallets = [];
  
  // Se não houver carteiras, criar novas
  if (existingWallets.length === 0) {
    for (const wallet of wallets) {
      const createdWallet = await prisma.wallet.create({
        data: wallet,
      });
      createdWallets.push(createdWallet);
    }
    console.log(`Carteiras de demonstração criadas: ${createdWallets.length}`);
  } else {
    console.log(`Carteiras já existentes: ${existingWallets.length}`);
    createdWallets.push(...existingWallets);
  }

  // Verificar transações existentes
  const existingTransactions = await prisma.transaction.findMany({
    where: { userId: testUser.id }
  });

  // Se já existirem transações, não criar novas
  if (existingTransactions.length > 0) {
    console.log(`Transações já existentes: ${existingTransactions.length}`);
    return;
  }

  // Criar algumas transações de demonstração
  const transaction1 = await prisma.transaction.create({
    data: {
      name: "Salário",
      type: "DEPOSIT",
      amount: 5000,
      category: "VENDAS_BALCAO",
      paymentMethod: "BANK_TRANSFER",
      date: new Date(),
      userId: testUser.id,
      walletId: createdWallets[0].id,
    },
  });

  const transaction2 = await prisma.transaction.create({
    data: {
      name: "Conta de Luz",
      type: "EXPENSE",
      amount: 150,
      category: "ENERGIA_AGUA",
      paymentMethod: "BANK_TRANSFER",
      date: new Date(),
      userId: testUser.id,
      walletId: createdWallets[0].id,
    },
  });

  console.log(`Transações de demonstração criadas: 2`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 