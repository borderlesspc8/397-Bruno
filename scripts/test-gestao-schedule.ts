/**
 * Script para testar a criação de agendamentos de importação do Gestão Click
 * 
 * Este script cria um agendamento de teste para importação automática
 * Pode ser executado com: npm run test:schedule
 */

import { prisma } from "../app/_lib/prisma";
import { ImportSchedulerService } from "../app/_services/import-scheduler-service";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Carrega variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * Função principal
 */
async function main() {
  try {
    console.log("🚀 Iniciando teste de agendamento de importação do Gestão Click...");
    
    // Buscar o primeiro usuário disponível para teste
    const user = await prisma.user.findFirst({
      select: { id: true, email: true }
    });
    
    if (!user) {
      console.error("❌ Nenhum usuário encontrado. Execute npm run seed:system primeiro.");
      return;
    }
    
    console.log(`👤 Usando usuário: ${user.email} (${user.id})`);
    
    // Criar serviço de agendamento
    const schedulerService = new ImportSchedulerService();
    
    // Verificar se já existe um agendamento para este usuário
    const existingSchedules = await prisma.importSchedule.findMany({
      where: {
        userId: user.id,
        source: "GESTAO_CLICK"
      }
    });
    
    if (existingSchedules.length > 0) {
      console.log(`📅 Encontrados ${existingSchedules.length} agendamentos existentes:`);
      existingSchedules.forEach(schedule => {
        console.log(`   - ID: ${schedule.id}, Status: ${schedule.status}, Data: ${schedule.scheduledAt}`);
      });
      
      // Perguntar se deseja excluir os agendamentos existentes
      const answer = await question("❓ Deseja excluir os agendamentos existentes? (s/n): ");
      
      if (answer.toLowerCase() === 's') {
        for (const schedule of existingSchedules) {
          await prisma.importSchedule.delete({
            where: { id: schedule.id }
          });
          console.log(`🗑️  Agendamento ${schedule.id} excluído.`);
        }
      } else {
        console.log("ℹ️  Mantendo agendamentos existentes. Saindo...");
        return;
      }
    }
    
    // Buscar configurações de integração
    const integrationSettings = await prisma.integrationSettings.findFirst({
      where: {
        userId: user.id,
        provider: 'gestao-click',
        walletId: 'global',
      },
    });
    
    if (!integrationSettings) {
      // Criar configurações de integração básicas para teste
      console.log("⚙️  Criando configurações de integração básicas para teste...");
      
      await prisma.integrationSettings.create({
        data: {
          userId: user.id,
          provider: 'gestao-click',
          walletId: 'global',
          active: true,
          metadata: {
            apiKey: process.env.GESTAO_CLICK_API_KEY || "test-api-key",
            secretToken: process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || "test-secret-token",
            apiUrl: process.env.GESTAO_CLICK_API_URL || "https://api.beteltecnologia.com",
            autoSync: true,
            syncFrequency: "daily",
            lastUpdated: new Date().toISOString()
          }
        }
      });
      
      console.log("✅ Configurações de integração criadas com sucesso!");
    } else {
      console.log("ℹ️  Configurações de integração já existem.");
    }
    
    // Criar agendamento para execução em 1 minuto
    const now = new Date();
    const nextMinute = new Date(now.getTime() + 60 * 1000);
    const hours = nextMinute.getHours().toString().padStart(2, '0');
    const minutes = nextMinute.getMinutes().toString().padStart(2, '0');
    const scheduleTime = `${hours}:${minutes}`;
    
    console.log(`⏰ Criando agendamento para execução às ${scheduleTime}...`);
    
    // Criar agendamento
    const schedule = await schedulerService.createGestaoClickSchedule(
      user.id,
      {
        frequency: "daily",
        time: scheduleTime,
        credentials: {
          apiKey: process.env.GESTAO_CLICK_API_KEY || "test-api-key",
          secretToken: process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || "test-secret-token",
          apiUrl: process.env.GESTAO_CLICK_API_URL || "https://api.beteltecnologia.com"
        }
      }
    );
    
    console.log("✅ Agendamento criado com sucesso!");
    console.log(`📅 ID: ${schedule.id}`);
    console.log(`⏱️  Agendado para: ${schedule.scheduledAt}`);
    console.log(`📊 Status: ${schedule.status}`);
    
    console.log("\n⚠️  Para testar o processamento, execute:");
    console.log("   CRON_API_KEY=sua-chave npm run cron:schedules");
    
    console.log("\n🏁 Teste finalizado com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Função auxiliar para fazer perguntas no terminal
 */
function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    const stdin = process.stdin;
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

// Executar função principal
main(); 