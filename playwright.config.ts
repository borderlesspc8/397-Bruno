import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E
 */
export default defineConfig({
  // Diretório onde os testes estão localizados
  testDir: './tests/e2e',
  
  // Padrão de arquivos de teste
  testMatch: '**/*.e2e.ts',
  
  // Tempo máximo de execução de um teste (em milissegundos)
  timeout: 30000,
  
  // Esperar até que a página esteja totalmente carregada
  expect: {
    timeout: 5000
  },
  
  // Executar testes em modo headless por padrão
  use: {
    // Navegador base para todos os projetos
    baseURL: 'http://localhost:3000',
    
    // Capturar screenshot apenas em falhas
    screenshot: 'only-on-failure',
    
    // Gravar video apenas em falhas
    video: 'on-first-retry',
    
    // Coletar informações de rastreamento em falhas
    trace: 'on-first-retry',
  },
  
  // Executar todos os testes em paralelo
  fullyParallel: true,
  
  // Falhar na primeira ocorrência
  forbidOnly: !!process.env.CI,
  
  // Número de tentativas para testes que falham
  retries: process.env.CI ? 2 : 0,
  
  // Número de workers paralelos
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter a ser usado
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/test-results.json' }]
  ],
  
  // Configurações específicas para diferentes navegadores
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Testes mobile
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // Servidor de desenvolvimento local
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
}); 