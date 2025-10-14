import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createVendorUser() {
  try {
    console.log('🚀 Criando usuário vendedor...');
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash('Vendedor231719', 12);
    
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'vendedorpersonalprime@gmail.com' }
    });

    if (existingUser) {
      console.log('⚠️ Usuário já existe. Atualizando role para vendor...');
      
      const updatedUser = await prisma.user.update({
        where: { email: 'vendedorpersonalprime@gmail.com' },
        data: {
          role: 'vendor',
          password: hashedPassword,
          updatedAt: new Date()
        }
      });

      console.log('✅ Usuário atualizado com sucesso!');
      console.log('📧 Email:', updatedUser.email);
      console.log('🔑 Role:', updatedUser.role);
      console.log('🆔 ID:', updatedUser.id);

      // Verificar se já existe registro na tabela vendedores
      const existingVendedor = await prisma.vendedor.findFirst({
        where: { userId: updatedUser.id }
      });

      if (!existingVendedor) {
        // Criar registro na tabela vendedores
        const vendedorData = await prisma.vendedor.create({
          data: {
            nome: 'Vendedor Personal Prime',
            email: 'vendedorpersonalprime@gmail.com',
            userId: updatedUser.id,
          }
        });

        console.log('✅ Registro de vendedor criado com sucesso!');
        console.log('🆔 Vendedor ID:', vendedorData.id);
      } else {
        console.log('ℹ️ Registro de vendedor já existe');
      }

    } else {
      // Dados do usuário vendedor
      const vendorUser = {
        email: 'vendedorpersonalprime@gmail.com',
        password: hashedPassword,
        name: 'Vendedor Personal Prime',
        role: 'vendor', // Role específico para vendedores
        authProvider: 'EMAIL',
        isOnboarded: true,
        isTermsAccepted: true,
      };

      // Inserir usuário na tabela users
      const userData = await prisma.user.create({
        data: vendorUser
      });

      console.log('✅ Usuário vendedor criado com sucesso!');
      console.log('📧 Email:', vendorUser.email);
      console.log('🔑 Role:', vendorUser.role);
      console.log('🆔 ID:', userData.id);

      // Criar registro na tabela vendedores
      const vendedorData = await prisma.vendedor.create({
        data: {
          nome: 'Vendedor Personal Prime',
          email: 'vendedorpersonalprime@gmail.com',
          userId: userData.id,
        }
      });

      console.log('✅ Registro de vendedor criado com sucesso!');
      console.log('🆔 Vendedor ID:', vendedorData.id);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
createVendorUser();
