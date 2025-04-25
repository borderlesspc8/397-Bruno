/**
 * Script para configurar a integração em tempo real com o Gestão Click
 * Este script:
 * 1. Atualiza o arquivo .env para incluir as variáveis necessárias
 * 2. Verifica se as configurações básicas já estão presentes
 * 3. Gera uma chave secreta para o webhook se não existir
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Obter referência ao módulo atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para os arquivos .env
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

// Criar interface para leitura de entrada
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Função principal
 */
async function setupRealtimeIntegration() {
  console.log('🔄 Configurando integração em tempo real com o Gestão Click...');
  
  try {
    // Ler arquivo .env atual
    const envExists = fs.existsSync(envPath);
    const envContent = envExists ? fs.readFileSync(envPath, 'utf8') : '';
    
    // Verificar se já temos as variáveis necessárias
    const hasAccessToken = envContent.includes('GESTAO_CLICK_ACCESS_TOKEN=');
    const hasSecretToken = envContent.includes('GESTAO_CLICK_SECRET_ACCESS_TOKEN=');
    const hasApiUrl = envContent.includes('GESTAO_CLICK_API_URL=');
    const hasWebhookSecret = envContent.includes('GESTAO_CLICK_WEBHOOK_SECRET=');
    
    // Perguntar pelas variáveis que não encontramos
    const newEnvVars = {};
    
    if (!hasAccessToken) {
      newEnvVars.GESTAO_CLICK_ACCESS_TOKEN = await askQuestion('Digite a chave de API do Gestão Click (deixe em branco para configurar depois): ');
    }
    
    if (!hasSecretToken) {
      newEnvVars.GESTAO_CLICK_SECRET_ACCESS_TOKEN = await askQuestion('Digite o token secreto do Gestão Click (opcional, deixe em branco para configurar depois): ');
    }
    
    if (!hasApiUrl) {
      newEnvVars.GESTAO_CLICK_API_URL = await askQuestion('Digite a URL da API do Gestão Click (deixe em branco para usar o padrão "https://api.beteltecnologia.com"): ') || 'https://api.beteltecnologia.com';
    }
    
    // Gerar automaticamente uma chave secreta para o webhook
    if (!hasWebhookSecret) {
      const webhookSecret = crypto.randomBytes(32).toString('hex');
      newEnvVars.GESTAO_CLICK_WEBHOOK_SECRET = webhookSecret;
      console.log(`✅ Chave secreta do webhook gerada automaticamente: ${webhookSecret.slice(0, 8)}...`);
    }
    
    // Adicionar as novas variáveis ao arquivo .env
    let newEnvContent = envContent;
    let varsAdded = 0;
    
    for (const [key, value] of Object.entries(newEnvVars)) {
      if (value) {
        // Se o valor foi fornecido ou gerado, adicionar ao .env
        newEnvContent += `\n${key}=${value}`;
        varsAdded++;
      }
    }
    
    // Adicionar variáveis de configuração para sincronização em tempo real
    if (!envContent.includes('GESTAO_CLICK_REALTIME_ENABLED=')) {
      newEnvContent += '\nGESTAO_CLICK_REALTIME_ENABLED=true';
      varsAdded++;
    }
    
    if (!envContent.includes('GESTAO_CLICK_SYNC_FREQUENCY=')) {
      newEnvContent += '\nGESTAO_CLICK_SYNC_FREQUENCY=hourly';
      varsAdded++;
    }
    
    // Salvar apenas se tivemos mudanças
    if (varsAdded > 0) {
      fs.writeFileSync(envPath, newEnvContent, 'utf8');
      console.log(`✅ Arquivo .env atualizado com ${varsAdded} variáveis para integração em tempo real`);
    } else {
      console.log('ℹ️  Nenhuma alteração necessária no arquivo .env');
    }
    
    // Instruções de configuração do webhook no Gestão Click
    console.log('\n📋 INSTRUÇÕES PARA CONFIGURAR O WEBHOOK NO GESTÃO CLICK:');
    console.log('1. Acesse o painel administrativo do Gestão Click');
    console.log('2. Vá para Configurações > Integrações > Webhooks');
    console.log('3. Adicione um novo webhook com a seguinte URL:');
    
    // Obter a URL base do .env se disponível
    const baseUrl = getBaseUrlFromEnv(envContent) || 'https://seu-dominio.com';
    console.log(`   ${baseUrl}/api/webhooks/gestao-click`);
    
    console.log('4. Configure os seguintes eventos:');
    console.log('   - transaction.created');
    console.log('   - transaction.updated');
    console.log('   - sale.created');
    console.log('   - sale.updated');
    console.log('   - cost_center.created');
    console.log('   - cost_center.updated');
    
    console.log('\n🔒 IMPORTANTE: Configure o cabeçalho de autenticação (Authorization) no webhook:');
    const webhookSecret = getWebhookSecretFromEnv(newEnvContent);
    if (webhookSecret) {
      console.log(`   Bearer ${webhookSecret}`);
    } else {
      console.log('   Não foi possível recuperar a chave do webhook do arquivo .env');
    }
    
    console.log('\n🎉 Configuração da integração em tempo real concluída!');
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error);
  } finally {
    rl.close();
  }
}

/**
 * Função auxiliar para fazer perguntas ao usuário
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Obtém a URL base do .env
 */
function getBaseUrlFromEnv(envContent) {
  const match = envContent.match(/NEXT_PUBLIC_APP_URL=(.+)/);
  return match ? match[1].trim() : null;
}

/**
 * Obtém a chave secreta do webhook do .env
 */
function getWebhookSecretFromEnv(envContent) {
  const match = envContent.match(/GESTAO_CLICK_WEBHOOK_SECRET=(.+)/);
  return match ? match[1].trim() : null;
}

// Verificar se está sendo executado diretamente ou importado
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  // Executar o script
  setupRealtimeIntegration();
}

// Exportar a função principal
export default setupRealtimeIntegration; 