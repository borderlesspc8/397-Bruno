#!/usr/bin/env node

/**
 * Script para limpar as sessões do NextAuth e redefinir o segredo de autenticação
 * Executar este script antes de iniciar o servidor em produção para evitar erros de decriptação JWT
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Obter o caminho atual usando ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o arquivo .env
const envPath = path.join(path.dirname(__dirname), '.env');
const envExamplePath = path.join(path.dirname(__dirname), '.env.example');

// Função principal
async function cleanAuth() {
  console.log('⚙️ Iniciando limpeza de autenticação...');

  try {
    // 1. Limpar sessões salvas no banco de dados
    console.log('🔄 Conectando ao banco de dados...');
    const prisma = new PrismaClient();
    
    try {
      console.log('🗑️ Limpando sessões existentes...');
      await prisma.session.deleteMany({});
      console.log('✅ Sessões removidas com sucesso!');
      
      // Opcional: limpar também os tokens verificação
      await prisma.verificationToken.deleteMany({});
      console.log('✅ Tokens de verificação removidos!');
    } catch (dbError) {
      console.error('❌ Erro ao limpar sessões:', dbError);
    } finally {
      await prisma.$disconnect();
    }

    // 2. Gerar novo segredo
    console.log('🔑 Gerando novo segredo para NextAuth...');
    const newSecret = crypto.randomBytes(32).toString('hex');
    console.log('🔐 Novo segredo gerado!');

    // 3. Atualizar o arquivo .env com o novo segredo
    try {
      console.log('📝 Atualizando arquivo .env...');
      let envContent = '';
      
      // Verificar se o arquivo .env existe
      if (fs.existsSync(envPath)) {
        // Ler o arquivo .env atual
        envContent = fs.readFileSync(envPath, 'utf8');
        
        // Substituir ou adicionar a variável NEXTAUTH_SECRET
        if (envContent.includes('NEXTAUTH_SECRET=')) {
          envContent = envContent.replace(/NEXTAUTH_SECRET=.*\n/, `NEXTAUTH_SECRET=${newSecret}\n`);
        } else {
          envContent += `\nNEXTAUTH_SECRET=${newSecret}\n`;
        }

        // Salvar o arquivo atualizado
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Arquivo .env atualizado com sucesso!');
      } else {
        // Criar um novo arquivo .env se não existir
        console.log('❗ Arquivo .env não encontrado, criando novo...');
        
        // Se houver um arquivo .env.example, usar como base
        if (fs.existsSync(envExamplePath)) {
          envContent = fs.readFileSync(envExamplePath, 'utf8');
        }
        
        // Adicionar o segredo ao conteúdo
        if (envContent.includes('NEXTAUTH_SECRET=')) {
          envContent = envContent.replace(/NEXTAUTH_SECRET=.*\n/, `NEXTAUTH_SECRET=${newSecret}\n`);
        } else {
          envContent += `\nNEXTAUTH_SECRET=${newSecret}\n`;
        }
        
        // Salvar o novo arquivo .env
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Novo arquivo .env criado com sucesso!');
      }
    } catch (fileError) {
      console.error('❌ Erro ao atualizar arquivo .env:', fileError);
      console.log('⚠️ Por favor, adicione manualmente a seguinte linha ao seu arquivo .env:');
      console.log(`NEXTAUTH_SECRET=${newSecret}`);
    }

    // 4. Limpar arquivos de build
    console.log('🧹 Limpando arquivos de build existentes...');
    try {
      execSync('rm -rf .next', { stdio: 'inherit' });
      console.log('✅ Arquivos de build limpos com sucesso!');
    } catch (buildError) {
      console.error('❌ Erro ao limpar arquivos de build:', buildError);
    }

    console.log('\n✨ Processo de limpeza concluído com sucesso!');
    console.log('🚀 Você pode iniciar o servidor agora com: npm run build && npm run start');
  } catch (error) {
    console.error('❌ Erro durante o processo de limpeza:', error);
    process.exit(1);
  }
}

// Executar a função principal
cleanAuth(); 