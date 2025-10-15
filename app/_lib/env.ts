const env = {
  AUTO_IMPORT_ENABLED: process.env.AUTO_IMPORT_ENABLED || 'false',
  GESTAO_CLICK_ACCESS_TOKEN: process.env.GESTAO_CLICK_ACCESS_TOKEN,
  GESTAO_CLICK_SECRET_ACCESS_TOKEN: process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN,
  GESTAO_CLICK_API_URL: process.env.GESTAO_CLICK_API_URL,
  NODE_ENV: process.env.NODE_ENV,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
};

export { env }; 
