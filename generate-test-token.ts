import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();
const NEXTAUTH_SECRET = 'cwWOiYFMrmFsTXnWchpHRd6mHMjjaYz+kZkEKndhpqc=';

async function generateTestToken() {
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

    // Gerar um token JWT
    const secretKey = NEXTAUTH_SECRET;
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60 * 24 * 7; // Token válido por 7 dias

    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      iat,
      exp,
      jti: Date.now().toString()
    };

    const token = jwt.sign(payload, secretKey);
    console.log('Token gerado com sucesso');

    // Salvar o token em um arquivo para uso posterior
    writeFileSync('test-token.txt', token);
    console.log('Token salvo em test-token.txt');

    // Criar um comando curl pronto para uso
    const curlCommand = `curl -v "http://localhost:3001/api/transactions/search?startDate=${new Date().toISOString().split('T')[0]}&endDate=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}" -H "Authorization: Bearer ${token}"`;
    
    writeFileSync('test-curl-command.sh', curlCommand);
    console.log('Comando curl de teste salvo em test-curl-command.sh');

    return token;
  } catch (error) {
    console.error('Erro ao gerar token:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

generateTestToken()
  .then(() => console.log('Script concluído com sucesso.'))
  .catch(console.error); 