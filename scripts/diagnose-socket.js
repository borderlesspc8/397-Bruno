/**
 * Script para diagnosticar problemas de conexão do socket
 * Execute com: node scripts/diagnose-socket.js
 */

// Importações
const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Configurações
const DEFAULT_URL = 'https://dashboard.lojapersonalprime.com';
const SOCKET_PATH = '/api/socket';
const TEST_TIMEOUT = 10000; // 10 segundos

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Função para imprimir com cores
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Função para testar a conexão HTTP(S) básica
async function testHttpConnection(url) {
  return new Promise((resolve) => {
    log(`\n🔍 Testando conexão HTTP para: ${url}`, colors.cyan);
    
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, (res) => {
      log(`  ✅ Conexão HTTP estabelecida: ${res.statusCode} ${res.statusMessage}`, colors.green);
      resolve(true);
    });
    
    req.on('error', (error) => {
      log(`  ❌ Erro na conexão HTTP: ${error.message}`, colors.red);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      log('  ❌ Timeout na conexão HTTP', colors.red);
      resolve(false);
    });
  });
}

// Função para testar conexão Socket.IO
async function testSocketConnection(url, path) {
  return new Promise((resolve) => {
    log(`\n🔌 Testando conexão Socket.IO para: ${url}${path}`, colors.cyan);
    
    const socket = io(url, {
      path,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 2,
      timeout: 5000,
    });
    
    // Evento de conexão
    socket.on('connect', () => {
      log(`  ✅ Socket conectado com sucesso! ID: ${socket.id}`, colors.green);
      
      // Testar envio de evento
      socket.emit('ping', { time: new Date().toISOString() });
      log('  📤 Evento "ping" enviado', colors.cyan);
      
      setTimeout(() => {
        socket.disconnect();
        resolve(true);
      }, 2000);
    });
    
    // Evento de erro de conexão
    socket.on('connect_error', (error) => {
      log(`  ❌ Erro de conexão do socket: ${error.message}`, colors.red);
      
      // Analisar o erro
      if (error.message.includes('CORS')) {
        log('  🛑 Erro de CORS detectado! Verificar configuração de CORS no servidor.', colors.red);
      } else if (error.message.includes('xhr poll error')) {
        log('  🛑 Erro de polling XHR! Pode ser um problema de rede ou firewall.', colors.red);
      } else if (error.message.includes('timeout')) {
        log('  🛑 Timeout na conexão! O servidor pode estar inacessível ou sobrecarregado.', colors.red);
      }
      
      socket.disconnect();
      resolve(false);
    });
    
    // Evento de desconexão
    socket.on('disconnect', (reason) => {
      log(`  🔌 Socket desconectado: ${reason}`, colors.yellow);
    });
    
    // Timeout para garantir que não fique travado
    setTimeout(() => {
      if (socket.connected) {
        log('  ⚠️ Teste concluído por timeout, socket ainda conectado', colors.yellow);
        socket.disconnect();
      } else if (!socket.disconnected) {
        log('  ❌ Timeout no teste de conexão do socket', colors.red);
        socket.disconnect();
      }
      resolve(false);
    }, TEST_TIMEOUT);
  });
}

// Função principal
async function main() {
  log('\n📊 DIAGNÓSTICO DE CONEXÃO SOCKET', colors.magenta);
  log('============================', colors.magenta);
  
  // Obter URL do ambiente ou usar padrão
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_URL;
  const socketPath = process.env.NEXT_PUBLIC_SOCKET_PATH || SOCKET_PATH;
  
  log(`URL Base: ${baseUrl}`, colors.blue);
  log(`Caminho do Socket: ${socketPath}`, colors.blue);
  
  // Testar conexão HTTP básica
  await testHttpConnection(baseUrl);
  
  // Testar conexão Socket.IO
  await testSocketConnection(baseUrl, socketPath);
  
  log('\n📋 RESUMO E RECOMENDAÇÕES:', colors.magenta);
  log('=========================', colors.magenta);
  log('1. Verifique se o servidor está rodando e acessível', colors.yellow);
  log('2. Garanta que as configurações CORS estão corretas no servidor', colors.yellow);
  log('3. Confirme que a URL e o caminho do socket estão configurados corretamente', colors.yellow);
  log('4. Verifique se há problemas de rede ou firewall bloqueando a conexão', colors.yellow);
  log('5. Em produção, use HTTPS tanto para o cliente quanto para o servidor', colors.yellow);
}

// Executar diagnóstico
main().catch((error) => {
  log(`\n❌ ERRO NO DIAGNÓSTICO: ${error.message}`, colors.red);
  process.exit(1);
}); 