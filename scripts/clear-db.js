#!/usr/bin/env node

/**
 * Script para limpar o banco de dados
 * Este é apenas um wrapper que executa o arquivo clear-database.js
 */

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtendo o diretório atual em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Iniciando script de limpeza do banco de dados...');

const scriptPath = path.join(__dirname, 'clear-database.js');

// Executando o script
const command = `node ${scriptPath}`;

console.log(`Executando: ${command}`);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Erro ao executar o script: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Erros de execução: ${stderr}`);
  }
  
  console.log(stdout);
  console.log('Operação concluída!');
}); 