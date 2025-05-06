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

# Variáveis de ambiente necessárias para build (valores temporários)
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/placeholder"
ENV REDIS_URL="redis://localhost:6379"
ENV NEXTAUTH_SECRET="placeholder_build_secret"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV DOMAIN="placeholder.example.com"
ENV RESEND_API_KEY="re_placeholder"
ENV GROQ_API_KEY="gsk_placeholder"
ENV OPENAI_API_KEY="sk_placeholder"
ENV GESTAO_CLICK_ACCESS_TOKEN="placeholder_token"
ENV GESTAO_CLICK_SECRET_ACCESS_TOKEN="placeholder_secret"

# Copiar dependências e esquema do Prisma
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma

# Gerar cliente Prisma explicitamente
RUN npx prisma generate

# Copiar o restante dos arquivos do projeto
COPY . .

# Executar build do Next.js com verificação rigorosa
RUN echo "Iniciando build do Next.js..." && \
    npx next build && \
    # Verificar se o build foi bem-sucedido
    if [ ! -f ".next/BUILD_ID" ]; then \
      echo "FALHA CRÍTICA: Build do Next.js falhou - BUILD_ID não encontrado"; \
      exit 1; \
    fi && \
    # Verificar presença de diretórios críticos
    if [ ! -d ".next/server" ] || [ ! -d ".next/static" ]; then \
      echo "FALHA CRÍTICA: Build do Next.js incompleta - diretórios server ou static ausentes"; \
      exit 1; \
    fi && \
    # Mostrar informações sobre o build
    echo "Build concluída com sucesso - ID: $(cat .next/BUILD_ID)" && \
    ls -la .next/

# Runner - ambiente de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Instalar pacotes essenciais para produção
RUN apk add --no-cache libc6-compat curl wget ca-certificates

# Criar estrutura de diretórios e usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/public /app/logs /app/.next /app/public/uploads /app/public/temp && \
    chown -R nextjs:nodejs /app && \
    chmod -R 755 /app/public /app/logs

# Copiar apenas os arquivos necessários para produção
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Verificar a build novamente antes de finalizar a imagem
RUN if [ ! -f ".next/BUILD_ID" ]; then \
      echo "ERRO CRÍTICO: Build corrompida durante a criação da imagem"; \
      exit 1; \
    else \
      echo "Verificação final: Build válida encontrada ($(cat .next/BUILD_ID))"; \
    fi

# Script simplificado de inicialização - apenas para verificações rápidas
RUN echo '#!/bin/sh\n\
echo "[$(date)] Iniciando aplicação ContaRapida em modo de produção"\n\
echo "Variáveis de ambiente: NODE_ENV=$NODE_ENV, DOMAIN=$DOMAIN"\n\
echo "Build ID: $(cat .next/BUILD_ID 2>/dev/null || echo "ERRO: BUILD_ID não encontrado!")"\n\
\n\
# Verificar conexão com banco antes de iniciar\n\
npx prisma db push --skip-generate --accept-data-loss || echo "AVISO: Não foi possível conectar ao banco de dados"\n\
\n\
# Iniciar a aplicação\n\
exec npm start\n\
' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME 0.0.0.0

# Mudar para usuário não-root
USER nextjs

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Usar script simplificado de entrada
CMD ["/app/start.sh"] 