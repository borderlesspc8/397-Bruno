const { cacheService } = require('./app/_lib/cache.ts');

async function clearCache() {
  try {
    console.log('Limpando cache...');
    cacheService.clear();
    console.log('Cache limpo com sucesso!');
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
  }
}

clearCache();
