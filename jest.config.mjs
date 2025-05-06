import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Fornecer o caminho para o app do Next.js para carregamento da configuração next.config.js e .env
  dir: './',
});

// Configuração customizada do Jest
/** @type {import('jest').Config} */
const config = {
  // Adiciona mais configurações ao setup antes de cada teste
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],

  // Usar jsdom por padrão para ter um ambiente DOM
  testEnvironment: 'jsdom',

  // Mapeamento de módulos
  moduleNameMapper: {
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/components/(.*)$': '<rootDir>/app/_components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/services/(.*)$': '<rootDir>/app/_services/$1',
    '^@/hooks/(.*)$': '<rootDir>/app/_hooks/$1',
    '^@/styles/(.*)$': '<rootDir>/app/_styles/$1',
    '^@/utils/(.*)$': '<rootDir>/app/_utils/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
    '^@/mock/(.*)$': '<rootDir>/tests/mock/$1',
    '^@/fixtures/(.*)$': '<rootDir>/tests/fixtures/$1',
  },

  // Caminhos a serem ignorados para testes
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/out/',
    '<rootDir>/coverage/',
    '<rootDir>/tests/fixtures/',
    '<rootDir>/tests/mocks/',
  ],

  // Padrões de arquivos de teste
  testMatch: [
    '<rootDir>/tests/**/*.spec.ts',
    '<rootDir>/tests/**/*.spec.tsx',
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx',
  ],

  // Coleta de cobertura
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/_*.{js,jsx,ts,tsx}',
    '!app/**/*.stories.{js,jsx,ts,tsx}',
    '!app/**/stories/**/*',
    '!app/layout.tsx',
    '!app/error.tsx',
    '!app/loading.tsx',
    '!app/not-found.tsx',
    '!app/globals.css',
    '!app/_app.tsx',
    '!app/_document.tsx',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  // Transformação de arquivos
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Mostrar saída detalhada dos testes
  verbose: true,

  // Configuração do limiar de cobertura
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    }
  },
};

// Criar e exportar a configuração do Next.js
export default createJestConfig(config); 