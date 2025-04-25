#!/usr/bin/env node

/**
 * Script para testar a API do Banco do Brasil via cURL
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Obter o diretório atual em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Função principal
async function main() {
  console.log(`${colors.cyan}===== Teste de API do Banco do Brasil via cURL =====${colors.reset}`);
  
  // Obter credenciais - do arquivo JSON
  console.log(`${colors.blue}Carregando credenciais...${colors.reset}`);
  
  const metadataPath = path.join(process.cwd(), 'bank-metadata.json');
  
  if (!fs.existsSync(metadataPath)) {
    console.log(`${colors.red}Arquivo de metadados não encontrado: ${metadataPath}${colors.reset}`);
    console.log(`${colors.yellow}Criando arquivo de metadados com valores padrão...${colors.reset}`);
    
    // Valores padrão extraídos do código-fonte
    const defaultCredentials = {
      provider: "banco-do-brasil",
      applicationKey: "17a393f98a8573db7b3e5282ed806395",
      clientBasic: "ZXlKcFpDSTZJbUl4TWpZMU56TXRNVFV6SWl3aVkyOWthV2R2VUhWaWJHbGpZV1J2Y2lJNk1Dd2lZMjlrYVdkdlUyOW1kSGRoY21VaU9qRXdNemcyTVN3aWMyVnhkV1Z1WTJsaGJFbHVjM1JoYkdGallXOGlPako5OmV5SnBaQ0k2SWpJek16YzBZamt0WW1ZMlpTMDBZelUzTFRreVpqQXROamN3WkRZd05UY3hZemMwWXpGbFpUQmxNVFF0WlRFMElpd2lZMjlrYVdkdlVIVmliR2xqWVdSdmNpSTZNQ3dpWTI5a2FXZHZVMjltZEhkaGNtVWlPakV3TXpnMk1Td2ljMlZ4ZFdWdVkybGhiRWx1YzNSaGJHRmpZVzhpT2pJc0luTmxjWFZsYm1OcFlXeERjbVZrWlc1amFXRnNJam94TENKaGJXSnBaVzUwWlNJNkluQnliMlIxWTJGdklpd2lhV0YwSWpveE56TTVPVGMwT1RreU16UXpmUQ==",
      clientId: "eyJpZCI6ImIxMjY1NzMtMTUzIiwiY29kaWdvUHVibGljYWRvciI6MCwiY29kaWdvU29mdHdhcmUiOjEwMzg2MSwic2VxdWVuY2lhbEluc3RhbGFjYW8iOjJ9",
      clientSecret: "eyJpZCI6IjIzMzc0YjktYmY2ZS00YzU3LTkyZjAtNjcwZDYwNTcxYzc0YzFlZTBlMTQtZTE0IiwiY29kaWdvUHVibGljYWRvciI6MCwiY29kaWdvU29mdHdhcmUiOjEwMzg2MSwic2VxdWVuY2lhbEluc3RhbGFjYW8iOjIsInNlcXVlbmNpYWxDcmVkZW5jaWFsIjoxLCJhbWJpZW50ZSI6InByb2R1Y2FvIiwiaWF0IjoxNzM5OTc0OTkyMzQzfQ"
    };
    
    fs.writeFileSync(metadataPath, JSON.stringify(defaultCredentials, null, 2));
    console.log(`${colors.green}Arquivo de metadados criado com sucesso.${colors.reset}`);
  }
  
  // Carregar credenciais
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  
  // Verificar certificados
  console.log(`${colors.blue}Verificando certificados...${colors.reset}`);
  const certsDir = path.join(process.cwd(), 'certs/cm80v4mr50002gmfb0qzmdrgv');
  
  const requiredCerts = [
    { name: 'ca.cer', path: path.join(certsDir, 'ca.cer') },
    { name: 'cert.pem', path: path.join(certsDir, 'cert.pem') },
    { name: 'private.key', path: path.join(certsDir, 'private.key') }
  ];
  
  const missingCerts = requiredCerts.filter(cert => !fs.existsSync(cert.path));
  
  if (missingCerts.length > 0) {
    console.log(`${colors.red}Certificados ausentes: ${missingCerts.map(c => c.name).join(', ')}${colors.reset}`);
    console.log(`${colors.red}Por favor, verifique o diretório: ${certsDir}${colors.reset}`);
    return;
  }
  
  console.log(`${colors.green}Todos os certificados encontrados.${colors.reset}`);
  
  // Definir dados da agência e conta para teste
  // Usar valores de exemplo - isso deve ser substituído por valores reais obtidos do banco de dados
  const agencia = "5750";
  const conta = "2383";
  
  console.log(`${colors.blue}Testando com: Agência ${agencia}, Conta ${conta}${colors.reset}`);
  
  // Passo 1: Testar obtenção do token OAuth
  console.log(`${colors.yellow}Gerando comando cURL para obter token OAuth...${colors.reset}`);
  
  const oauthCommand = `curl -X POST https://oauth.bb.com.br/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -H "Authorization: Basic ${metadata.clientBasic}" \\
  --data-urlencode "grant_type=client_credentials" \\
  --data-urlencode "scope=extrato-info" \\
  --cert ${requiredCerts[1].path} \\
  --key ${requiredCerts[2].path} \\
  --cacert ${requiredCerts[0].path}`;
  
  console.log(`${colors.yellow}Comando OAuth:${colors.reset}`);
  console.log(oauthCommand);
  
  // Passo 2: Após obter o token, testar obtenção de extrato
  console.log(`\n${colors.yellow}Com o token obtido, use o seguinte comando para obter o extrato:${colors.reset}`);
  
  // Gerar datas para o período (últimos 7 dias)
  const dataFim = new Date();
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - 7);
  
  const dia = dataInicio.getDate().toString();
  const mes = (dataInicio.getMonth() + 1).toString().padStart(2, '0');
  const ano = dataInicio.getFullYear();
  
  const diaFim = dataFim.getDate().toString();
  const mesFim = (dataFim.getMonth() + 1).toString().padStart(2, '0');
  const anoFim = dataFim.getFullYear();
  
  const dataInicioFormatada = `${dia}${mes}${ano}`;
  const dataFimFormatada = `${diaFim}${mesFim}${anoFim}`;
  
  const extractCommand = `curl "https://api-extratos.bb.com.br/extratos/v1/conta-corrente/agencia/${agencia}/conta/${conta}?numeroPagina=1&quantidadeRegistros=50&dataInicioSolicitacao=${dataInicioFormatada}&dataFimSolicitacao=${dataFimFormatada}" \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Accept: application/json" \\
  -H "Content-Type: application/json" \\
  -H "gw-dev-app-key: ${metadata.applicationKey}" \\
  -H "X-Application-Key: ${metadata.applicationKey}" \\
  --cert ${requiredCerts[1].path} \\
  --key ${requiredCerts[2].path} \\
  --cacert ${requiredCerts[0].path}`;
  
  console.log(`${colors.yellow}Comando Extrato:${colors.reset}`);
  console.log(extractCommand);
  
  console.log(`\n${colors.cyan}===== Instruções =====\n${colors.reset}`);
  console.log(`${colors.green}1. Execute o primeiro comando para obter o token OAuth${colors.reset}`);
  console.log(`${colors.green}2. Copie o valor do token da resposta (campo "access_token")${colors.reset}`);
  console.log(`${colors.green}3. Substitua "SEU_TOKEN_AQUI" no segundo comando pelo token obtido${colors.reset}`);
  console.log(`${colors.green}4. Execute o segundo comando para obter o extrato bancário${colors.reset}`);
  
  console.log(`\n${colors.cyan}===== Teste Concluído =====${colors.reset}`);
}

// Executar o script
main().catch(error => {
  console.error(`${colors.red}Erro ao executar o script:${colors.reset}`, error);
});