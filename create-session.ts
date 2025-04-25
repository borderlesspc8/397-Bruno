import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';

// Função para criar um token de sessão semelhante ao NextAuth
const prisma = new PrismaClient();

async function createSession() {
  try {
    // Buscar o usuário mais recente criado com email teste_*@contarapida.com.br
    const user = await prisma.user.findFirst({
      where: {
        email: {
          contains: "teste_",
          endsWith: "@contarapida.com.br"
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!user) {
      throw new Error('Usuário de teste não encontrado');
    }

    console.log('Usuário encontrado:', {
      id: user.id,
      name: user.name,
      email: user.email
    });

    // Criar uma sessão no banco de dados
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    const session = await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires
      }
    });

    console.log('Sessão criada com sucesso:', {
      id: session.id,
      expires: session.expires.toISOString()
    });

    // Criar comandos curl para usar o cookie de sessão
    const cookieValue = `next-auth.session-token=${sessionToken}`;
    const baseCurlCommand = `curl -v -b "${cookieValue}"`;
    
    // Comandos para testar diferentes endpoints
    const commands = {
      listTransactions: `${baseCurlCommand} "http://localhost:3001/api/transactions/search"`,
      listWallets: `${baseCurlCommand} "http://localhost:3001/api/wallets"`,
      getUserProfile: `${baseCurlCommand} "http://localhost:3001/api/user/profile"`
    };

    // Salvar comandos em um arquivo
    fs.writeFileSync('test-commands.sh', Object.entries(commands)
      .map(([name, cmd]) => `echo "\\n==== ${name} ===="\n${cmd}`)
      .join('\n\n'));

    console.log('Comandos de teste salvos em test-commands.sh');
    
    // Tornar o arquivo executável
    fs.chmodSync('test-commands.sh', 0o755);

    return session;
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSession()
  .then(() => console.log('Script concluído com sucesso.'))
  .catch(console.error); 