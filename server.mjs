// Servidor customizado para Next.js com suporte a WebSockets
import http from 'http';
import { parse } from 'url';
import next from 'next';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Obter o diretório atual para caminhos relativos corretos
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do ambiente
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Inicializar o aplicativo Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Função para verificar se um arquivo existe
const fileExists = (path) => {
  try {
    fs.accessSync(path, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
};

// Preparar o aplicativo Next.js e então iniciar o servidor
app.prepare().then(async () => {
  // Criar o servidor HTTP
  const server = http.createServer((req, res) => {
    try {
      // Parse da URL da requisição
      const parsedUrl = parse(req.url, true);
      
      // Repassar a requisição para o handler do Next.js
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Erro ao processar requisição:', err);
      res.statusCode = 500;
      res.end('Erro interno do servidor');
    }
  });

  // Inicializar Socket.IO após criar o servidor HTTP
  try {
    // Importar Socket.IO diretamente
    const { Server } = await import('socket.io');
    
    // Configuração do servidor Socket.IO com opções melhoradas
    const io = new Server(server, {
      path: '/api/socket',
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true
      },
      transports: ['polling', 'websocket'],
      allowEIO3: true,
      connectTimeout: 45000,
      pingInterval: 25000,
      pingTimeout: 60000
    });
    
    // Configuração aprimorada do Socket.IO
    io.on('connection', (socket) => {
      console.log(`Socket conectado: ${socket.id}`);
      
      // Autenticar automaticamente usuários no ambiente de desenvolvimento
      if (dev) {
        const devUserId = 'dev-user-' + Math.random().toString(36).substring(2, 9);
        console.log(`Ambiente de desenvolvimento: Autenticando usuário automático ${devUserId}`);
        socket.join(`user:${devUserId}`);
      }
      
      // Tratamento normal para produção
      socket.on('authenticate', (userId) => {
        if (!userId) {
          console.log('Tentativa de autenticação sem ID de usuário');
          // Em desenvolvimento, criamos um ID temporário mesmo sem usuário
          if (dev) {
            const tempUserId = 'temp-user-' + Math.random().toString(36).substring(2, 9);
            console.log(`Criando ID temporário: ${tempUserId}`);
            socket.join(`user:${tempUserId}`);
          }
          return;
        }
        
        console.log(`Usuário autenticado: ${userId}`);
        socket.join(`user:${userId}`);
        
        // Notificar cliente de autenticação bem-sucedida
        socket.emit('auth_success', { userId });
      });
      
      // Ping/pong para manter a conexão ativa
      socket.on('ping', () => {
        socket.emit('pong', { time: new Date().toISOString() });
      });
      
      socket.on('disconnect', () => {
        console.log(`Socket desconectado: ${socket.id}`);
      });
    });
    
    // Criar namespace específico para HMR para evitar conflitos
    const hmrNamespace = io.of('/_next/webpack-hmr');
    hmrNamespace.on('connection', (socket) => {
      console.log('Conexão HMR estabelecida');
      
      socket.on('disconnect', () => {
        console.log('Conexão HMR encerrada');
      });
    });
    
    // Salvar a instância do IO para uso global
    global.io = io;
    console.log('Servidor Socket.IO inicializado com sucesso');
    
  } catch (err) {
    console.error('Falha ao inicializar Socket.IO:', err);
    console.error('Detalhes do erro:', err.message);
    if (err.stack) console.error(err.stack);
  }

  // Iniciar o servidor HTTP
  server.listen(port, (err) => {
    if (err) throw err;
    
    console.log(`> Servidor pronto em http://${hostname}:${port}`);
    console.log(`> Modo: ${dev ? 'desenvolvimento' : 'produção'}`);
    console.log(`> Websockets ativos: sim`);
    console.log(`> HMR configurado: sim`);
  });
}).catch((err) => {
  console.error('Erro durante a inicialização do servidor:', err);
  process.exit(1);
}); 