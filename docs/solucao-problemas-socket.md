# Solução de Problemas de Conexão Socket

## Problema Identificado

Os logs mostram erros repetidos de conexão socket:

```
Erro de conexão do socket: – Error: server error
```

A aplicação estava tentando se conectar ao servidor socket em `http://localhost:3000`, mas a origem atual do socket é `https://dashboard.lojapersonalprime.com`, o que causa erros de CORS e problemas de conexão.

## Alterações Realizadas

Foram implementadas as seguintes correções:

1. **Configuração do Cliente Socket** (`app/_hooks/use-socket-notifications.ts`):
   - Simplificação da lógica para obter a URL do socket
   - Uso consistente da origem atual da janela (`window.location.origin`)
   - Aumento dos tempos de timeout e tentativas de reconexão
   - Adição de suporte explícito para WebSocket e polling

2. **Configuração do Servidor Socket** (`app/_services/socket-service.ts`):
   - Configuração para permitir todas as origens em ambiente de produção
   - Aumento dos timeouts de ping para evitar desconexões prematuras
   - Adição de suporte explícito para WebSocket e polling

3. **API de Socket** (`app/api/socket/route.ts`):
   - Adição de cabeçalhos CORS para permitir conexões de qualquer origem
   - Implementação de handler para requisições OPTIONS (preflight CORS)
   - Melhoria no tratamento de erros com mensagens mais detalhadas

4. **Middleware** (`middleware.ts`):
   - Adição de lógica específica para rotas de socket
   - Configuração de cabeçalhos CORS para facilitar a conexão
   - Logging adicional para depuração de problemas

5. **Script de Diagnóstico** (`scripts/diagnose-socket.js`):
   - Ferramenta para testar a conexão com o servidor de socket
   - Diagnósticos detalhados que ajudam a identificar problemas específicos

## Como Verificar se o Problema Foi Resolvido

1. Execute o script de diagnóstico para testar a conexão:
   ```bash
   node scripts/diagnose-socket.js
   ```

2. Verifique os logs do console do navegador ao recarregar a aplicação:
   - Não deve mostrar mais os erros de `server error`
   - Deve mostrar `Socket conectado` com sucesso

3. Caso persista algum problema, verifique:
   - Se o servidor está acessível na URL configurada
   - Se o servidor permite conexões CORS da origem cliente
   - Se não há bloqueios de firewall ou proxy impedindo a conexão WebSocket

## Configuração no Ambiente de Produção

Para ambiente de produção, idealmente você deve configurar as seguintes variáveis de ambiente:

```
NEXT_PUBLIC_APP_URL=https://dashboard.lojapersonalprime.com
NEXTAUTH_URL=https://dashboard.lojapersonalprime.com
```

Estas configurações garantem que tanto o cliente quanto o servidor usem a mesma origem para comunicação.

## Considerações Adicionais

1. **Segurança**:
   - Em produção, é importante restringir as origens CORS permitidas
   - O uso de `'*'` como origem CORS deve ser alterado para origens específicas após a resolução do problema

2. **Performance**:
   - O WebSocket é mais eficiente que polling, mas alguns proxies podem bloqueá-lo
   - A configuração atual tenta websocket primeiro e cai para polling como fallback

3. **Monitoramento**:
   - Adicione monitoramento para detectar problemas de conexão no futuro
   - Configure alertas para casos de taxa alta de desconexões

## Próximas Etapas

1. Monitorar os logs do servidor para verificar se a conexão está estável
2. Revisar a configuração CORS após confirmar que a conexão funciona
3. Implementar melhor tratamento de reconexão no cliente caso a conexão caia 