import 'dotenv/config';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Criar bancos disponíveis no sistema
  await prisma.bank.upsert({
    where: {
      name: "Banco do Brasil"
    },
    update: {
      logo: "https://logospng.org/download/banco-do-brasil/logo-banco-do-brasil-bb-4096.png"
    },
    create: {
      id: "1",
      name: "Banco do Brasil",
      logo: "https://logospng.org/download/banco-do-brasil/logo-banco-do-brasil-bb-4096.png"
    }
  });

  await prisma.bank.upsert({
    where: {
      name: "Nubank"
    },
    update: {
      logo: "https://logospng.org/download/nubank/logo-nubank-roxo-2048.png"
    },
    create: {
      id: "2",
      name: "Nubank",
      logo: "https://logospng.org/download/nubank/logo-nubank-roxo-2048.png"
    }
  });

  await prisma.bank.upsert({
    where: {
      name: "Itaú"
    },
    update: {
      logo: "https://logospng.org/download/itau/logo-itau-4096.png"
    },
    create: {
      id: "3",
      name: "Itaú",
      logo: "https://logospng.org/download/itau/logo-itau-4096.png"
    }
  });

  await prisma.bank.upsert({
    where: {
      name: "Bradesco"
    },
    update: {
      logo: "https://logospng.org/download/bradesco/logo-bradesco-4096.png"
    },
    create: {
      id: "4",
      name: "Bradesco",
      logo: "https://logospng.org/download/bradesco/logo-bradesco-4096.png"
    }
  });

  await prisma.bank.upsert({
    where: {
      name: "Santander"
    },
    update: {
      logo: "https://logospng.org/download/santander/logo-santander-4096.png"
    },
    create: {
      id: "5",
      name: "Santander",
      logo: "https://logospng.org/download/santander/logo-santander-4096.png"
    }
  });

  await prisma.bank.upsert({
    where: {
      name: "Caixa Econômica Federal"
    },
    update: {
      logo: "https://logospng.org/download/caixa-economica-federal/logo-caixa-economica-federal-4096.png"
    },
    create: {
      id: "6",
      name: "Caixa Econômica Federal",
      logo: "https://logospng.org/download/caixa-economica-federal/logo-caixa-economica-federal-4096.png"
    }
  });

  console.log(`Bancos disponíveis criados: 6`);
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