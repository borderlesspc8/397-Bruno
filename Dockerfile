# Estágio de build
FROM node:18-alpine AS builder
WORKDIR /app

# Instalar dependências necessárias para pacotes nativos
RUN apk add --no-cache libc6-compat python3 make g++

# Copiar arquivos de configuração e prisma primeiro
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Instalar dependências primeiro
RUN npm ci

# Gerar Prisma client depois de instalar as dependências
RUN npx prisma generate

# Copiar o restante dos arquivos do projeto
COPY . .

# Construir o aplicativo
RUN npm run build

# Estágio de produção
FROM node:18-alpine AS runner
WORKDIR /app

# Configurar ambiente para ESM
ENV NODE_ENV=production
ENV NODE_OPTIONS="--experimental-specifier-resolution=node"
RUN apk add --no-cache libc6-compat

# Criar usuário não-root para rodar a aplicação
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copiar o resultado do build e arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/server.mjs ./server.mjs
COPY --from=builder /app/app ./app
COPY --from=builder /app/prisma ./prisma

# Gerar Prisma client no ambiente de produção
RUN npm install @prisma/client && npx prisma generate

# Definir permissões
RUN chown -R nextjs:nodejs /app

# Criar diretório uploads e configurar permissões
RUN mkdir -p /app/public/uploads/vendedores && \
    chown -R nextjs:nodejs /app/public/uploads && \
    chmod -R 755 /app/public/uploads

# Mudar para o usuário não-root
USER nextjs

# Expor a porta que o aplicativo usa
EXPOSE 3000

# Iniciar a aplicação com o servidor customizado
CMD ["node", "server.mjs"] 