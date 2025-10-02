import Redis from 'ioredis';

// Configuração do Redis
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Criação da instância do Redis com retry strategy
const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

// Tratamento de erros
redis.on('error', (error) => {
  console.error('[Redis] Erro de conexão:', error);
});

redis.on('connect', () => {
  console.log('[Redis] Conectado com sucesso');
});

export { redis }; 