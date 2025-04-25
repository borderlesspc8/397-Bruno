/**
 * Script para configurar importação automática do Gestão Click
 * 
 * Este script configura e executa automaticamente a importação de dados do Gestão Click
 * usando as credenciais diretamente do arquivo .env
 */

import { prisma } from "../app/_lib/prisma";
import { GestaoClickService } from "../app/_services/gestao-click-service";
import { ImportSchedulerService } from "../app/_services/import-scheduler-service";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Carrega variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Obtém credenciais do arquivo .env
const GESTAO_CLICK_API_KEY = process.env.GESTAO_CLICK_API_KEY;
const GESTAO_CLICK_SECRET_TOKEN = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN;
const GESTAO_CLICK_API_URL = process.env.GESTAO_CLICK_API_URL || "https://api.beteltecnologia.com";

// Verifica se as credenciais estão configuradas
if (!GESTAO_CLICK_API_KEY) {
  console.error("❌ Credenciais do Gestão Click não encontradas no arquivo .env");
  console.error("Adicione GESTAO_CLICK_API_KEY e GESTAO_CLICK_SECRET_ACCESS_TOKEN ao arquivo .env");
  process.exit(1);
}

/**
 * Função principal para configurar e executar importação
 */
async function main() {
  try {
    console.log("🚀 Iniciando configuração de importação automática do Gestão Click...");
    
    // Buscar todos os usuários do sistema
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    
    if (users.length === 0) {
      console.error("❌ Nenhum usuário encontrado no sistema.");
      return;
    }
    
    console.log(`👥 Encontrados ${users.length} usuários no sistema.`);
    
    // Para cada usuário, configurar e executar importação
    for (const user of users) {
      console.log(`\n👤 Processando usuário: ${user.email} (${user.id})`);
      
      // 1. Verificar/Criar configuração de integração
      const integrationSettings = await configureIntegration(user.id);
      
      // 2. Executar importação imediatamente
      await runImport(user.id);
      
      // 3. Configurar agendamento automático (diário)
      await scheduleImport(user.id);
    }
    
    console.log("\n✅ Processo de configuração finalizado com sucesso!");
    console.log("🔄 Importações automáticas foram configuradas para todos os usuários.");
    
  } catch (error) {
    console.error("❌ Erro durante o processo:", error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Configura a integração com o Gestão Click para um usuário
 */
async function configureIntegration(userId: string): Promise<any> {
  // Verificar se já existe configuração
  const existingSettings = await prisma.integrationSettings.findFirst({
    where: {
      userId,
      provider: 'gestao-click',
      walletId: 'global',
    },
  });
  
  if (existingSettings) {
    console.log("ℹ️  Configuração de integração já existe. Atualizando...");
    
    // Atualizar configurações existentes
    return prisma.integrationSettings.update({
      where: { id: existingSettings.id },
      data: {
        active: true,
        metadata: {
          apiKey: GESTAO_CLICK_API_KEY,
          secretToken: GESTAO_CLICK_SECRET_TOKEN,
          apiUrl: GESTAO_CLICK_API_URL,
          autoSync: true,
          syncFrequency: "daily",
          lastUpdated: new Date().toISOString()
        }
      }
    });
  } else {
    console.log("⚙️  Criando nova configuração de integração...");
    
    // Criar novas configurações
    return prisma.integrationSettings.create({
      data: {
        userId,
        provider: 'gestao-click',
        walletId: 'global',
        active: true,
        metadata: {
          apiKey: GESTAO_CLICK_API_KEY,
          secretToken: GESTAO_CLICK_SECRET_TOKEN,
          apiUrl: GESTAO_CLICK_API_URL,
          autoSync: true,
          syncFrequency: "daily",
          lastUpdated: new Date().toISOString()
        }
      }
    });
  }
}

/**
 * Executa importação imediata do Gestão Click
 */
async function runImport(userId: string): Promise<void> {
  console.log("📥 Executando importação imediata...");
  
  try {
    // Criar instância do serviço
    const gestaoClickService = new GestaoClickService({
      userId,
      apiKey: GESTAO_CLICK_API_KEY || "",
      secretToken: GESTAO_CLICK_SECRET_TOKEN,
      apiUrl: GESTAO_CLICK_API_URL
    });
    
    // Executar importação completa
    const result = await gestaoClickService.importAllData();
    
    console.log(`✅ Importação concluída! Importadas ${result.transactions.totalImported} transações.`);
    console.log(`   Carteiras importadas: ${result.wallets.fromAccounts.totalCreated + result.wallets.fromCostCenters.totalCreated}`);
  } catch (error) {
    console.error("❌ Erro durante importação:", error);
  }
}

/**
 * Configura agendamento automático diário
 */
async function scheduleImport(userId: string): Promise<void> {
  console.log("🕒 Configurando agendamento automático diário...");
  
  try {
    // Verificar se já existe um agendamento ativo
    const existingSchedules = await prisma.importSchedule.findFirst({
      where: {
        userId,
        source: "GESTAO_CLICK",
        status: "SCHEDULED"
      }
    });
    
    if (existingSchedules) {
      console.log("ℹ️  Já existe um agendamento ativo. Não será criado um novo.");
      return;
    }
    
    // Definir horário para importação (3:00 AM)
    const scheduleTime = "03:00";
    
    // Criar serviço de agendamento
    const schedulerService = new ImportSchedulerService();
    
    // Criar agendamento diário
    const schedule = await schedulerService.createGestaoClickSchedule(
      userId,
      {
        frequency: "daily",
        time: scheduleTime,
        credentials: {
          apiKey: GESTAO_CLICK_API_KEY,
          secretToken: GESTAO_CLICK_SECRET_TOKEN,
          apiUrl: GESTAO_CLICK_API_URL
        }
      }
    );
    
    console.log(`✅ Agendamento criado com sucesso! ID: ${schedule.id}`);
    console.log(`⏱️  Próxima execução agendada para: ${new Date(schedule.scheduledAt).toLocaleString()}`);
  } catch (error) {
    console.error("❌ Erro ao configurar agendamento:", error);
  }
}

// Executar função principal
main(); 