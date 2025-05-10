# Solução dos Problemas de Conexão WebSocket

## Problemas Identificados

1. **Erro no Backend**: 
   ```
   ⨯ TypeError: Cannot read properties of undefined (reading 'bind')
   at NextNodeServer.handleRequestImpl
   ```

2. **Erro no Frontend**:
   ```
   [Error] WebSocket connection to 'wss://dashboard.lojapersonalprime.com/api/socket?EIO=4&transport=websocket' failed: There was a bad response from the server.
   [Error] Erro de conexão do socket: – Error: websocket error
   ```

## Análise

O problema ocorre porque o modo `standalone` do Next.js não suporta adequadamente WebSockets em sua implementação padrão. Quando executamos no modo standalone, há incompatibilidades entre:

1. A maneira como a aplicação Next.js é empacotada e servida
2. A inicialização correta do servidor Socket.io que depende de um servidor HTTP compartilhado

## Solução Implementada

Abandonamos o modo `standalone` e criamos um servidor customizado para o Next.js com suporte adequado a WebSockets:

### 1. Servidor Customizado

Criamos um arquivo `server.js` na raiz do projeto que:
- Inicializa um servidor HTTP normal
- Configura o Next.js para usar este servidor
- Inicializa o Socket.IO usando o mesmo servidor HTTP
- Gerencia corretamente o ciclo de vida e roteamento

### 2. Configuração do Cliente WebSocket

Modificamos `use-socket-notifications.ts` para:
- Usar sempre a origem atual da janela (evitando misturas de domínios)
- Priorizar o transporte `polling` antes de tentar `websocket` (mais compatível com proxies)
- Aumentar timeouts e tentativas de reconexão

### 3. Configuração do Servidor Socket.IO

Atualizamos `socket-service.ts` para:
- Usar configurações mais robustas e compatíveis
- Permitir origens CORS em produção para debugging
- Definir transporte primário como polling

### 4. Ajustes de Configuração

- Removemos `output: 'standalone'` do `next.config.mjs`
- Atualizamos o script `start` no `package.json` para usar o servidor customizado
- Modificamos o Dockerfile para suportar o novo modelo de servidor

## Vantagens da Nova Abordagem

1. **Melhor Controle**: O servidor customizado permite maior controle sobre o ciclo de vida da aplicação.
2. **Compatibilidade WebSocket**: Garantimos que o WebSocket funcione corretamente.
3. **Fallback Automático**: Implementamos fallback para polling quando WebSocket não estiver disponível.
4. **Facilidade de Debugging**: Logs detalhados de conexão e tratamento de erros.

## Desvantagens do Modo Standalone

1. **Limitações com WebSockets**: Não funciona bem com WebSockets sem configurações adicionais.
2. **Erros de Bind**: O problema relatado do `Cannot read properties of undefined (reading 'bind')` é um sintoma de como o standalone gerencia (ou falha em gerenciar) conexões persistentes.
3. **Debugging Difícil**: Erros em modo standalone são mais difíceis de diagnosticar.

## Quando Usar o Modo Standalone?

O modo standalone do Next.js é mais adequado para:
- Aplicações sem WebSockets ou comunicação em tempo real
- Deployments serverless simples
- Casos onde não é necessário gerenciar o servidor manualmente

## Quando Usar Servidor Customizado?

Um servidor customizado como implementamos é preferível para:
- Aplicações com WebSockets ou SSE (Server-Sent Events)
- Aplicações que precisam gerenciar recursos de servidor específicos
- Casos onde é necessário mais controle sobre o servidor HTTP

## Como Verificar se a Solução Funciona

Após implementar as mudanças:
1. Execute a aplicação com `npm run start` (que agora usa o servidor customizado)
2. Verifique os logs do servidor para confirmar que o Socket.IO inicializou corretamente
3. No console do navegador, as mensagens de erro de conexão WebSocket devem desaparecer 