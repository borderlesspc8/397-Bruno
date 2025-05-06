/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Habilitar o uso simultâneo dos diretórios app e pages
  experimental: {
    // ServerActions são habilitados por padrão no Next.js 14+
    serverActions: {
      bodySizeLimit: '50mb',
    },
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'pdf-parse', 'groq-sdk'],
  },
  // Configuração do webpack para resolver módulos Node.js no navegador
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Resolve módulos Node.js no ambiente do navegador
      config.resolve.fallback = {
        ...config.resolve.fallback,
        https: false,
        http: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    return config;
  },
  // Configuração de imagens
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Desativar a geração estática e permitir renderização dinâmica
  staticPageGenerationTimeout: 1000,
  compress: process.env.NODE_ENV === 'production',
  // Ignorar erros durante o build para permitir iniciar a aplicação
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  // Desativar geração de ETags para melhorar desempenho
  generateEtags: false,
  // Adicionar configuração para rotas de API e favicons
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        // Configuração específica para endpoints de autenticação
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, max-age=0, must-revalidate',
          },
        ],
      },
      {
        // Configuração para arquivos estáticos de imagens
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Configuração para favicons
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Configurações para desabilitar pré-renderização
  distDir: '.next',
  env: {
    NEXT_DISABLE_STATIC_GENERATION: 'true',
    NEXT_DISABLE_ERROR_STATIC_EXPORT: 'true',
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Garantir que as rotas de autenticação não sejam otimizadas incorretamente
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      {
        // Redirecionar requisições do avatar PNG para SVG
        source: '/images/default-avatar.png',
        destination: '/images/default-avatar.svg',
      },
    ];
  },
}

export default nextConfig;
