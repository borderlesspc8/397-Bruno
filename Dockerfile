FROM node:20-alpine AS deps
WORKDIR /app

# Instalando dependências com base no package-lock.json
COPY package.json package-lock.json ./
RUN npm ci

# Builder: compila a aplicação
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gerando Prisma Client
RUN npx prisma generate

# Realizando build da aplicação
RUN npm run build:skip-errors

# Imagem final
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Instalando apenas pacotes de produção para reduzir o tamanho da imagem
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev

# Copiando arquivos necessários
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/next.config.js ./

# Expondo a porta da aplicação
EXPOSE 3000

# Definindo o comando de inicialização
CMD ["npm", "start"] 