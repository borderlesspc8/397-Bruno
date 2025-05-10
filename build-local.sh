#!/bin/bash

# Script para facilitar o build local do ContaRapida
# Autor: Conta Rápida Team

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando build local do ContaRapida...${NC}"

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Arquivo .env não encontrado, criando com valores padrão...${NC}"
    cat > .env << EOF
# Variáveis de ambiente para build e execução

# Configurações gerais
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# URLs de conexão
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/contarapida
REDIS_URL=redis://redis:6379

# Configurações de domínio
DOMAIN=dashboard.lojapersonalprime.com
NEXTAUTH_URL=https://dashboard.lojapersonalprime.com
NEXTAUTH_SECRET=sua_chave_secreta_forte

# APIs externas (dummy para build)
RESEND_API_KEY=re_dummy_key
GROQ_API_KEY=gsk_dummy_key
OPENAI_API_KEY=sk_dummy_key
GESTAO_CLICK_ACCESS_TOKEN=dummy_token
GESTAO_CLICK_SECRET_ACCESS_TOKEN=dummy_secret
EOF
    echo -e "${GREEN}Arquivo .env criado com sucesso!${NC}"
fi

# Exportar variáveis do arquivo .env
echo -e "${YELLOW}Carregando variáveis de ambiente do arquivo .env...${NC}"
export $(grep -v '^#' .env | xargs)

# Exibir as principais variáveis configuradas
echo -e "${YELLOW}Principais variáveis configuradas:${NC}"
echo "DOMAIN=$DOMAIN"
echo "REDIS_URL=$REDIS_URL"
echo "DATABASE_URL=$DATABASE_URL"

# Construir a imagem Docker
echo -e "${YELLOW}Construindo imagem Docker...${NC}"
docker-compose build --no-cache

echo -e "${GREEN}Build concluído com sucesso!${NC}"
echo -e "${YELLOW}Para iniciar a aplicação, execute:${NC} ${GREEN}docker-compose up -d${NC}"
echo -e "${YELLOW}Para implantar no Swarm, execute:${NC} ${GREEN}./deploy-swarm.sh${NC}" 