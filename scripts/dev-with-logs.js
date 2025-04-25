/**
 * Script para iniciar o servidor de desenvolvimento com logs
 * Execute com: node scripts/dev-with-logs.js
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obter o diretório atual no contexto de ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Criar pasta de logs se não existir
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Arquivo de log com data atual
const date = format(new Date(), 'yyyyMMdd');
const logFile = path.join(logsDir, `server-${date}.log`);

// Criar ou abrir arquivo de log
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Escrever cabeçalho no log
logStream.write(`\n\n--- SERVIDOR INICIADO ${new Date().toISOString()} ---\n\n`);

// Iniciar servidor Next.js
const nextProcess = spawn('npm', ['run', 'dev'], { shell: true });

// Encaminhar saída para o console e para o arquivo de log
nextProcess.stdout.on('data', (data) => {
  process.stdout.write(data); // Mostra no console
  logStream.write(data);     // Escreve no arquivo de log
});

nextProcess.stderr.on('data', (data) => {
  process.stderr.write(data); // Mostra no console
  logStream.write(`[ERRO] ${data}`);  // Escreve no arquivo de log
});

// Tratamento de conclusão do processo
nextProcess.on('close', (code) => {
  const message = `\n--- SERVIDOR ENCERRADO COM CÓDIGO ${code} - ${new Date().toISOString()} ---\n`;
  logStream.write(message);
  console.log(message);
  logStream.end();
});

// Capturar sinais de interrupção para encerrar corretamente
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
  process.on(signal, () => {
    const message = `\n--- SERVIDOR INTERROMPIDO POR SINAL ${signal} - ${new Date().toISOString()} ---\n`;
    logStream.write(message);
    console.log(message);
    nextProcess.kill();
    setTimeout(() => {
      process.exit(0);
    }, 500);
  });
});

console.log(`Servidor iniciado. Logs serão salvos em: ${logFile}`);
console.log('Pressione Ctrl+C para encerrar.'); 