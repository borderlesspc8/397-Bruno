#!/bin/sh
set -e

# Função para exibir mensagens de log
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Iniciando contêiner da aplicação ContaRapida..."

# Verificar variáveis de ambiente essenciais
log "Verificando variáveis de ambiente críticas..."
MISSING_VARS=""

if [ -z "$DATABASE_URL" ]; then
  MISSING_VARS="${MISSING_VARS} DATABASE_URL"
fi

if [ -z "$REDIS_URL" ]; then
  MISSING_VARS="${MISSING_VARS} REDIS_URL"
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
  log "AVISO: NEXTAUTH_SECRET não está definida. Usando valor padrão (não seguro para produção)"
fi

if [ ! -z "$MISSING_VARS" ]; then
  log "ERRO: As seguintes variáveis de ambiente obrigatórias não estão definidas:${MISSING_VARS}"
  log "A aplicação não pode ser iniciada sem estas variáveis."
  exit 1
fi

# Criar diretórios necessários e configurar permissões
log "Verificando e criando diretórios necessários..."
for DIR in /app/logs /app/public/uploads /app/public/temp; do
  if [ ! -d "$DIR" ]; then
    log "Criando diretório: $DIR"
    mkdir -p "$DIR"
  fi
  log "Configurando permissões para: $DIR"
  chmod -R 755 "$DIR"
done

# Função para testar conexão com o banco de dados
test_database_connection() {
  log "Testando conexão com o banco de dados..."
  npx prisma db push --skip-generate --accept-data-loss > /dev/null 2>&1
  return $?
}

# Função para testar conexão com o Redis
test_redis_connection() {
  log "Testando conexão com o Redis..."
  if command -v nc >/dev/null 2>&1; then
    # Extrair host e porta do REDIS_URL
    REDIS_HOST=$(echo $REDIS_URL | sed -E 's/redis:\/\/(([^:]+)(:([0-9]+))?).*/\2/')
    REDIS_PORT=$(echo $REDIS_URL | sed -E 's/redis:\/\/(([^:]+):([0-9]+)).*/\3/')
    REDIS_PORT=${REDIS_PORT:-6379}
    
    nc -z -w5 $REDIS_HOST $REDIS_PORT
    return $?
  else
    # Fallback se nc não estiver disponível
    log "AVISO: Utilitário 'nc' não disponível. Pulando verificação de conexão com Redis."
    return 0
  fi
}

# Verificar se existe uma build válida
log "Verificando build do Next.js..."
BUILD_STATUS=0

if [ ! -f ".next/BUILD_ID" ] || [ ! -d ".next/server" ] || [ ! -d ".next/static" ]; then
  log "Build do Next.js não encontrada ou incompleta."
  BUILD_STATUS=1
else
  log "Build do Next.js encontrada. Build ID: $(cat .next/BUILD_ID)"
fi

# Testar conexões antes de reconstruir
if [ $BUILD_STATUS -eq 1 ]; then
  # Tentar conexão com o banco de dados
  if ! test_database_connection; then
    log "AVISO: Não foi possível conectar ao banco de dados. Verifique a URL e confirme se o banco está acessível."
    log "Tentando continuar mesmo assim..."
  fi
  
  # Tentar conexão com Redis
  if ! test_redis_connection; then
    log "AVISO: Não foi possível conectar ao Redis. Verifique a URL e confirme se o Redis está acessível."
    log "Tentando continuar mesmo assim..."
  fi
  
  # Limpar diretório .next existente se estiver corrompido
  if [ -d ".next" ]; then
    log "Removendo diretório .next existente..."
    rm -rf .next
  fi
  
  # Gerar cliente Prisma antes do build
  log "Gerando cliente Prisma..."
  npx prisma generate
  
  # Executar build do Next.js
  log "Executando next build..."
  if npx next build; then
    log "Build do Next.js concluída com sucesso!"
  else
    log "ERRO: Falha ao criar build do Next.js"
    
    # Mostrar estrutura do diretório .next para diagnóstico
    log "Conteúdo do diretório .next (se existir):"
    ls -la .next 2>/dev/null || echo "Diretório .next não encontrado"
    
    log "Verificando espaço em disco:"
    df -h /app
    
    log "Memória disponível:"
    free -m || echo "Comando 'free' não disponível"
    
    exit 1
  fi
fi

# Verificar conexão com o banco de dados
log "Aplicando migrações ao banco de dados..."
if npx prisma db push --skip-generate --accept-data-loss; then
  log "Verificação de banco de dados concluída com sucesso."
else
  log "AVISO: Não foi possível aplicar migrações ao banco de dados."
  log "A aplicação pode não funcionar corretamente se o esquema do banco não estiver atualizado."
fi

# Mostrar status final antes de iniciar
log "Iniciando o servidor Next.js..."
log "NODE_ENV: $NODE_ENV"
log "DOMAIN: $DOMAIN"
log "Build ID: $(cat .next/BUILD_ID 2>/dev/null || echo 'Não disponível')"
log "Diretórios chave na build do Next.js:"
ls -la .next/server 2>/dev/null || echo "Diretório .next/server não encontrado!"
ls -la .next/static 2>/dev/null || echo "Diretório .next/static não encontrado!"

# Iniciar a aplicação
log "Iniciando Next.js em modo de produção..."
exec npm start 