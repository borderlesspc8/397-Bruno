/**
 * Script para corrigir problemas do webhook do Gestão Click
 * 
 * Este script verifica todos os usuários ativos no sistema e cria as
 * carteiras necessárias para o funcionamento do webhook.
 * 
 * Uso: node scripts/fix-webhook.js [userId opcional]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Cria a carteira de configurações do Gestão Click
 */
async function criarCarteiraConfig(userId) {
  try {
    // Verificar se já existe
    const configExistente = await prisma.wallet.findFirst({
      where: {
        userId,
        name: "GESTAO_CLICK_GLOBAL",
        type: "SETTINGS"
      }
    });
    
    if (configExistente) {
      console.log(`[${userId}] Carteira de configurações já existe`);
      return configExistente;
    }
    
    // Criar nova carteira de configurações
    const carteira = await prisma.wallet.create({
      data: {
        userId,
        name: "GESTAO_CLICK_GLOBAL",
        type: "SETTINGS",
        balance: 0,
        metadata: {
          gestaoClick: {
            apiKey: process.env.GESTAO_CLICK_ACCESS_TOKEN || "api_key_test",
            secretToken: process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN,
            apiUrl: process.env.GESTAO_CLICK_API_URL || "https://api.beteltecnologia.com",
            testMode: process.env.NODE_ENV === "development"
          },
          fixedAt: new Date().toISOString()
        }
      }
    });
    
    console.log(`[${userId}] Carteira de configurações criada: ${carteira.id}`);
    return carteira;
  } catch (error) {
    console.error(`[${userId}] Erro ao criar carteira de configurações:`, error);
    throw error;
  }
}

/**
 * Cria a carteira de integração do Gestão Click
 */
async function criarCarteiraIntegracao(userId) {
  try {
    // Verificar se já existe
    const integracaoExistente = await prisma.wallet.findFirst({
      where: {
        userId,
        name: "GESTAO_CLICK_GLOBAL",
        type: "CHECKING"
      }
    });
    
    if (integracaoExistente) {
      console.log(`[${userId}] Carteira de integração já existe`);
      return integracaoExistente;
    }
    
    // Criar nova carteira de integração
    const carteira = await prisma.wallet.create({
      data: {
        userId,
        name: "GESTAO_CLICK_GLOBAL",
        type: "CHECKING",
        balance: 0,
        metadata: {
          gestaoClick: {
            apiKey: process.env.GESTAO_CLICK_ACCESS_TOKEN || "api_key_test",
            secretToken: process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN,
            apiUrl: process.env.GESTAO_CLICK_API_URL || "https://api.beteltecnologia.com",
            testMode: process.env.NODE_ENV === "development"
          },
          createdByScript: true,
          fixedAt: new Date().toISOString()
        }
      }
    });
    
    console.log(`[${userId}] Carteira de integração criada: ${carteira.id}`);
    return carteira;
  } catch (error) {
    console.error(`[${userId}] Erro ao criar carteira de integração:`, error);
    throw error;
  }
}

/**
 * Corrige as configurações do webhook para um usuário
 */
async function corrigirUsuario(userId) {
  try {
    console.log(`\nCorrigindo configurações para usuário: ${userId}`);
    
    // 1. Criar carteira de configurações
    await criarCarteiraConfig(userId);
    
    // 2. Criar carteira de integração
    await criarCarteiraIntegracao(userId);
    
    console.log(`[${userId}] Configurações corrigidas com sucesso`);
    return true;
  } catch (error) {
    console.error(`[${userId}] Erro ao corrigir configurações:`, error);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log("=== Script de correção do webhook do Gestão Click ===");
    console.log("Iniciando verificação e correção...");
    
    // Verificar se um ID de usuário específico foi fornecido
    const targetUserId = process.argv[2];
    
    if (targetUserId) {
      // Corrigir apenas o usuário especificado
      console.log(`Corrigindo apenas o usuário: ${targetUserId}`);
      await corrigirUsuario(targetUserId);
    } else {
      // Corrigir todos os usuários ativos
      console.log("Buscando todos os usuários ativos...");
      
      const usuarios = await prisma.user.findMany({
        select: { id: true }
      });
      
      console.log(`Encontrados ${usuarios.length} usuários para verificação`);
      
      let sucessos = 0;
      let falhas = 0;
      
      // Processar cada usuário
      for (const usuario of usuarios) {
        const sucesso = await corrigirUsuario(usuario.id);
        if (sucesso) {
          sucessos++;
        } else {
          falhas++;
        }
      }
      
      console.log("\n=== Resultado da correção ===");
      console.log(`Total de usuários: ${usuarios.length}`);
      console.log(`Sucessos: ${sucessos}`);
      console.log(`Falhas: ${falhas}`);
    }
    
    console.log("\nScript de correção concluído!");
  } catch (error) {
    console.error("Erro fatal ao executar script:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
main(); 