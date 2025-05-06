import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

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

  // Criar bancos disponíveis
  const banks = [
    {
      name: "Bradesco",
      logo: "/banks/bradesco.svg",
    },
    {
      name: "Itaú",
      logo: "/banks/itau.svg",
    },
    {
      name: "Santander",
      logo: "/banks/santander.svg",
    },
    {
      name: "Banco do Brasil",
      logo: "/banks/bb.svg",
    },
    {
      name: "Nubank",
      logo: "/banks/nubank.svg",
    },
  ];

  for (const bank of banks) {
    await prisma.bank.upsert({
      where: { name: bank.name },
      update: {},
      create: bank,
    });
  }

  console.log(`Bancos criados: ${banks.length}`);

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

  for (const wallet of wallets) {
    await prisma.wallet.create({
      data: wallet,
    });
  }

  console.log(`Carteiras de demonstração criadas: ${wallets.length}`);
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