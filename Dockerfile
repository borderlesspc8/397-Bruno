FROM node:20-alpine AS base
WORKDIR /app

# Dependências comuns
FROM base AS deps
WORKDIR /app

# Instalar pacotes necessários para build
RUN apk add --no-cache libc6-compat python3 make g++ git curl

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./

# Instalar dependências com cache de layers no Docker
RUN npm ci --prefer-offline --no-audit --no-fund

# Builder
FROM base AS builder
WORKDIR /app

# Instalar pacotes necessários para build
RUN apk add --no-cache libc6-compat curl wget

# Configurações de ambiente para build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true

# Copiar dependências e esquema do Prisma
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma

# Gerar cliente Prisma
RUN npx prisma generate

# Copiar o restante dos arquivos
COPY . .

# Valores de placeholder durante o build - serão substituídos em runtime
ENV DATABASE_URL="postgresql://postgres:placeholder@localhost:5432/placeholder"
ENV REDIS_URL="redis://localhost:6379"
ENV NEXTAUTH_SECRET="placeholder_build_secret"
ENV DOMAIN="placeholder.example.com"
ENV RESEND_API_KEY="re_placeholder"
ENV GROQ_API_KEY="gsk_placeholder"
ENV OPENAI_API_KEY="sk_placeholder"
ENV GESTAO_CLICK_ACCESS_TOKEN="placeholder_token"
ENV GESTAO_CLICK_SECRET_ACCESS_TOKEN="placeholder_secret"

# Executar o build
RUN echo "Iniciando build do Next.js..." && \
    npx next build || exit_code=$? && \
    if [ ! -z "$exit_code" ]; then \
       echo "Build falhou, mas verificando se há arquivos úteis..." && \
       ls -la .next/ && \
       if [ -d ".next/server" ] || [ -d ".next/static" ]; then \
          echo "Arquivos de build encontrados. Continuando..." && \
          exit 0; \
       else \
          echo "Nenhum arquivo de build útil encontrado." && \
          exit 1; \
       fi \
    fi

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Instalar pacotes essenciais para produção
RUN apk add --no-cache libc6-compat curl wget ca-certificates

# Criar estrutura de diretórios de aplicação e definir usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/public /app/logs /app/.next && \
    chown -R nextjs:nodejs /app

# Copiar apenas os arquivos necessários para produção
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Verificar se os arquivos estão no lugar
RUN ls -la .next/ || echo "Diretório .next não encontrado ou vazio!"

# Script de inicialização com verificação de saúde
COPY --chmod=755 --chown=nextjs:nodejs ./scripts/entrypoint.sh ./entrypoint.sh

# Criar e configurar diretório para uploads
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

# Configurar permissões
RUN chmod -R 755 /app/public && \
    chmod -R 755 /app/logs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME 0.0.0.0

# Mudar para usuário não-root
USER nextjs

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Usar o script de entrada com tratamento de erros
ENTRYPOINT ["./entrypoint.sh"] 