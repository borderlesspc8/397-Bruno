#!/usr/bin/env node

// Credenciais
const metadata = {
  provider: "banco-do-brasil",
  applicationKey: "17a393f98a8573db7b3e5282ed806395",
  clientBasic: "ZXlKcFpDSTZJbUl4TWpZMU56TXRNVFV6SWl3aVkyOWthV2R2VUhWaWJHbGpZV1J2Y2lJNk1Dd2lZMjlrYVdkdlUyOW1kSGRoY21VaU9qRXdNemcyTVN3aWMyVnhkV1Z1WTJsaGJFbHVjM1JoYkdGallXOGlPako5OmV5SnBaQ0k2SWpJek16YzBZamt0WW1ZMlpTMDBZelUzTFRreVpqQXROamN3WkRZd05UY3hZemMwWXpGbFpUQmxNVFF0WlRFMElpd2lZMjlrYVdkdlVIVmliR2xqWVdSdmNpSTZNQ3dpWTI5a2FXZHZVMjltZEhkaGNtVWlPakV3TXpnMk1Td2ljMlZ4ZFdWdVkybGhiRWx1YzNSaGJHRmpZVzhpT2pJc0luTmxjWFZsYm1OcFlXeERjbVZrWlc1amFXRnNJam94TENKaGJXSnBaVzUwWlNJNkluQnliMlIxWTJGdklpd2lhV0YwSWpveE56TTVPVGMwT1RreU16UXpmUQ==",
  clientId: "eyJpZCI6ImIxMjY1NzMtMTUzIiwiY29kaWdvUHVibGljYWRvciI6MCwiY29kaWdvU29mdHdhcmUiOjEwMzg2MSwic2VxdWVuY2lhbEluc3RhbGFjYW8iOjJ9",
  clientSecret: "eyJpZCI6IjIzMzc0YjktYmY2ZS00YzU3LTkyZjAtNjcwZDYwNTcxYzc0YzFlZTBlMTQtZTE0IiwiY29kaWdvUHVibGljYWRvciI6MCwiY29kaWdvU29mdHdhcmUiOjEwMzg2MSwic2VxdWVuY2lhbEluc3RhbGFjYW8iOjIsInNlcXVlbmNpYWxDcmVkZW5jaWFsIjoxLCJhbWJpZW50ZSI6InByb2R1Y2FvIiwiaWF0IjoxNzM5OTc0OTkyMzQzfQ"
};

// Certificados
const certPath = "certs/cm80v4mr50002gmfb0qzmdrgv/cert.pem";
const keyPath = "certs/cm80v4mr50002gmfb0qzmdrgv/private.key";
const caPath = "certs/cm80v4mr50002gmfb0qzmdrgv/ca.cer";

// Dados da conta
const agencia = "5750";
const conta = "2383";

// Gerar comandos
console.log("\n===== COMANDOS PARA TESTE DA API DO BANCO DO BRASIL =====\n");

console.log("1. COMANDO PARA OBTER TOKEN OAUTH:");
console.log("-----------------------------------------");
console.log(`curl -X POST https://oauth.bb.com.br/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -H "Authorization: Basic ${metadata.clientBasic}" \\
  --data-urlencode "grant_type=client_credentials" \\
  --data-urlencode "scope=extrato-info" \\
  --cert ${certPath} \\
  --key ${keyPath} \\
  --cacert ${caPath}`);

// Calcular datas
const dataFim = new Date();
const dataInicio = new Date();
dataInicio.setDate(dataInicio.getDate() - 7);

const formatDate = (date) => {
  const day = date.getDate().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}${month}${year}`;
};

const dataInicioFormatada = formatDate(dataInicio);
const dataFimFormatada = formatDate(dataFim);

console.log("\n2. COMANDO PARA OBTER EXTRATO:");
console.log("-----------------------------------------");
console.log(`curl "https://api-extratos.bb.com.br/extratos/v1/conta-corrente/agencia/${agencia}/conta/${conta}?numeroPagina=1&quantidadeRegistros=50&dataInicioSolicitacao=${dataInicioFormatada}&dataFimSolicitacao=${dataFimFormatada}" \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Accept: application/json" \\
  -H "Content-Type: application/json" \\
  -H "gw-dev-app-key: ${metadata.applicationKey}" \\
  -H "X-Application-Key: ${metadata.applicationKey}" \\
  --cert ${certPath} \\
  --key ${keyPath} \\
  --cacert ${caPath}`);

console.log("\n===== INSTRUÇÕES =====\n");
console.log("1. Execute o primeiro comando para obter o token OAuth");
console.log("2. Copie o valor do token da resposta (campo \"access_token\")");
console.log("3. Substitua \"SEU_TOKEN_AQUI\" no segundo comando pelo token obtido");
console.log("4. Execute o segundo comando para obter o extrato bancário");

console.log("\n===== FIM =====\n");
