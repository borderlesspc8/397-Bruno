FROM node:20-alpine AS base

# Instalar dependências para o Prisma e outras bibliotecas necessárias
RUN apk add --no-cache libc6-compat openssl1.1-compat

# Definir diretório de trabalho
WORKDIR /app

# Camada de dependências
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Camada de build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação
RUN npm run build:skip-errors

# Camada de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Criar usuário não-root para rodar a aplicação
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Definir permissões para o diretório .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Variáveis de ambiente padrão
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Expor a porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "server.js"] 