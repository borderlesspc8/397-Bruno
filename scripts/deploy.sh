#!/bin/bash

# Script para deploy manual do ContaRápida na VPS
# Uso: ./deploy.sh [staging|production]

set -e

# Verificar argumentos
if [ "$1" != "staging" ] && [ "$1" != "production" ]; then
  echo "Uso: ./deploy.sh [staging|production]"
  exit 1
fi

# Configurações
ENVIRONMENT=$1
DOCKER_USERNAME="seu-usuario-docker"
APP_NAME="contarapida"
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Defina as variáveis com base no ambiente
if [ "$ENVIRONMENT" == "staging" ]; then
  VPS_HOST="seu-host-staging"
  VPS_USER="seu-usuario-staging"
  VPS_PORT="22"
  SSH_KEY="${HOME}/.ssh/id_rsa_staging"
  REMOTE_DIR="/home/contarapida/app"
  TAG="staging-${TIMESTAMP}"
  ENV_FILE=".env.staging"
else
  VPS_HOST="seu-host-production"
  VPS_USER="seu-usuario-production"
  VPS_PORT="22"
  SSH_KEY="${HOME}/.ssh/id_rsa_production"
  REMOTE_DIR="/home/contarapida/app"
  TAG="production-${TIMESTAMP}"
  ENV_FILE=".env.production"
fi

echo "🚀 Iniciando deploy para ambiente $ENVIRONMENT..."

# 1. Build da imagem Docker
echo "🔨 Construindo imagem Docker..."
docker build -t ${DOCKER_USERNAME}/${APP_NAME}:${TAG} .
docker tag ${DOCKER_USERNAME}/${APP_NAME}:${TAG} ${DOCKER_USERNAME}/${APP_NAME}:${ENVIRONMENT}-latest

# 2. Push da imagem para o Docker Hub
echo "📤 Enviando imagem para o Docker Hub..."
docker push ${DOCKER_USERNAME}/${APP_NAME}:${TAG}
docker push ${DOCKER_USERNAME}/${APP_NAME}:${ENVIRONMENT}-latest

# 3. Deploy na VPS
echo "📦 Realizando deploy na VPS..."
ssh -i ${SSH_KEY} -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} << EOF
  cd ${REMOTE_DIR}
  echo "TAG=${TAG}" > .env.deploy
  docker-compose pull
  docker-compose up -d --force-recreate app
  docker system prune -f
EOF

echo "✅ Deploy concluído com sucesso!"
echo "🌐 A aplicação está disponível em:"
if [ "$ENVIRONMENT" == "staging" ]; then
  echo "   https://staging.contarapida.com.br"
else
  echo "   https://contarapida.com.br"
fi 