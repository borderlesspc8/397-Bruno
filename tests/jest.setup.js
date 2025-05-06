// Importar extensões do Jest para testing-library
import '@testing-library/jest-dom';

// Mock para Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    reload: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Mock para next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock para next-auth
jest.mock('next-auth/react', () => {
  const originalModule = jest.requireActual('next-auth/react');
  return {
    __esModule: true,
    ...originalModule,
    signIn: jest.fn(),
    signOut: jest.fn(),
    useSession: jest.fn(() => ({
      data: {
        user: { 
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          image: null 
        },
        expires: '2025-01-01T00:00:00.000Z'
      },
      status: 'authenticated',
    })),
  };
});

// Mock para localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

// Configurar o ambiente global corretamente
if (typeof window === 'undefined') {
  global.window = Object.create(window);
  global.window.document = {
    createElement: jest.fn(),
    getElementById: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
    body: {
      appendChild: jest.fn(),
    },
    documentElement: {
      clientWidth: 1024,
      clientHeight: 768,
    }
  };
  global.document = global.window.document;
  global.localStorage = localStorageMock;
  global.sessionStorage = localStorageMock;
  global.navigator = {
    userAgent: 'node.js',
  };
} else {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock,
  });
}

// Mock para window.matchMedia
global.window.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(), // Deprecated
  removeListener: jest.fn(), // Deprecated
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Suprimir logs durante testes
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
//   log: jest.fn(),
// };

// Aumentar timeout para testes assíncronos
jest.setTimeout(15000);

// Limpar todos os mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
}); 