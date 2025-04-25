#!/usr/bin/env node

/**
 * Script para verificar e copiar os certificados necessários para a integração
 * com o Banco do Brasil
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Diretórios e arquivos
const CERTS_DIR = path.join(process.cwd(), 'certs');
const REQUIRED_CERTS = [
  { name: 'ca.cer', description: 'Certificado da Autoridade Certificadora (CA)' },
  { name: 'cert.pem', description: 'Certificado do cliente' },
  { name: 'private.key', description: 'Chave privada' },
];

// Verifica se o diretório de certificados existe
function checkCertsDirectory() {
  console.log(`${colors.blue}Verificando diretório de certificados...${colors.reset}`);
  
  if (!fs.existsSync(CERTS_DIR)) {
    console.log(`${colors.yellow}Diretório 'certs' não encontrado. Criando...${colors.reset}`);
    fs.mkdirSync(CERTS_DIR, { recursive: true });
    console.log(`${colors.green}Diretório criado: ${CERTS_DIR}${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.green}Diretório 'certs' encontrado: ${CERTS_DIR}${colors.reset}`);
  return true;
}

// Verifica se os certificados necessários existem
function checkCerts() {
  console.log(`${colors.blue}Verificando certificados necessários...${colors.reset}`);
  
  let allCertsExist = true;
  const missingCerts = [];
  
  for (const cert of REQUIRED_CERTS) {
    const certPath = path.join(CERTS_DIR, cert.name);
    
    if (!fs.existsSync(certPath)) {
      console.log(`${colors.yellow}Certificado não encontrado: ${cert.name} (${cert.description})${colors.reset}`);
      allCertsExist = false;
      missingCerts.push(cert);
    } else {
      console.log(`${colors.green}Certificado encontrado: ${cert.name}${colors.reset}`);
    }
  }
  
  return { allCertsExist, missingCerts };
}

// Função principal
function main() {
  console.log(`${colors.cyan}===== Verificação de Certificados para Banco do Brasil =====${colors.reset}`);
  
  const dirExists = checkCertsDirectory();
  const { allCertsExist, missingCerts } = checkCerts();
  
  if (allCertsExist) {
    console.log(`${colors.green}Todos os certificados necessários estão presentes.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Certificados ausentes: ${missingCerts.map(c => c.name).join(', ')}${colors.reset}`);
    console.log(`${colors.yellow}Você precisa obter esses certificados para que a integração com o Banco do Brasil funcione.${colors.reset}`);
    console.log(`${colors.yellow}Para informações sobre como obter esses certificados, consulte a documentação do Banco do Brasil ou entre em contato com o suporte.${colors.reset}`);
  }
  
  console.log(`${colors.cyan}===== Verificação Concluída =====${colors.reset}`);
}

// Executar o script
main(); 