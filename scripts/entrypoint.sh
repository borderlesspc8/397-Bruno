#!/bin/sh
set -e

# Função para exibir mensagens de log
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Verificar variáveis de ambiente essenciais
if [ -z "$DATABASE_URL" ]; then
  log "ERRO: Variável DATABASE_URL não está definida"
  exit 1
fi

if [ -z "$REDIS_URL" ]; then
  log "ERRO: Variável REDIS_URL não está definida"
  exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
  log "AVISO: NEXTAUTH_SECRET não está definida. Usando valor padrão (não seguro para produção)"
fi

# Verificar se o diretório .next existe
if [ ! -d ".next/server" ]; then
  log "Diretório .next/server não encontrado. Tentando reconstruir a aplicação..."
  npx next build
  
  # Verificar novamente após a tentativa de build
  if [ ! -d ".next/server" ]; then
    log "ERRO: Falha na reconstrução da aplicação"
    exit 1
  fi
fi

# Verificar conexão com o banco de dados
log "Verificando conexão com o banco de dados..."
npx prisma db push --skip-generate --accept-data-loss
if [ $? -ne 0 ]; then
  log "AVISO: Não foi possível conectar ao banco de dados. A aplicação pode não funcionar corretamente."
fi

# Criar diretórios necessários
mkdir -p /app/logs
mkdir -p /app/public/uploads

# Gerar cliente Prisma se necessário
log "Gerando cliente Prisma..."
npx prisma generate

# Iniciar a aplicação
log "Iniciando o servidor Next.js..."
exec npm start 