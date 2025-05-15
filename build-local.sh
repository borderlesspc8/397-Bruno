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

      # Configurações essenciais da aplicação
      NODE_ENV=production
      NEXT_TELEMETRY_DISABLED=1
      NEXT_SHARP_PATH=/app/node_modules/sharp
      NEXT_PUBLIC_ASSET_PREFIX=https://dashboard.lojapersonalprime.com
      NEXT_ASSET_PREFIX=https://dashboard.lojapersonalprime.com
      # Conexões de banco de dados e cache
      DATABASE_URL=postgresql://postgres:aff05699b9de3a6ea2596c4971059bd8@10.0.1.12:5432/dashboard_personalprime?schema=public&connection_limit=5&pool_timeout=10
      REDIS_URL=redis://redis:6379

      # Configuração de Email
      RESEND_API_KEY=re_CuMtc78g_2ckFBFpwMonohLh3Su4XXCnt 
      EMAIL_SERVER_HOST=smtp.resend.com
      EMAIL_SERVER_PORT=587
      EMAIL_SERVER_USER=apikey
      EMAIL_SERVER_PASSWORD=re_CuMtc78g_2ckFBFpwMonohLh3Su4XXCnt
      EMAIL_FROM=noreply@acceleracrm.com.br
      # Autenticação e domínio
      NEXTAUTH_URL=https://dashboard.lojapersonalprime.com
      NEXTAUTH_SECRET=af088b5bec7db27c5cefe494d4d7bf63183d8d333f21a66e960712336e80d4ca
      DOMAIN=localhost
      NEXTAUTH_DEBUG=true

      # Configuração do ERP Gestão Click
      GESTAO_CLICK_API_URL=https://api.beteltecnologia.com
      GESTAO_CLICK_ACCESS_TOKEN=35f6a8f4b1f80e1a0c2bb0c85fb6f071ba92e82b
      GESTAO_CLICK_SECRET_ACCESS_TOKEN=823e5135fab01a057328fbd0a8a99f17aa38933d

      # Configuração do ERP Gestão Click (desativada para teste)
      AUTO_IMPORT_ENABLED=true
      DEMO_MODE=false
      
      # Configuração de Email (simplificada para teste)
      EMAIL_FROM=noreply@example.com
      NEXT_PUBLIC_APP_URL=https://dashboard.lojapersonalprime.com
      
      # Configuração de Metadata para Next.js
      NEXT_PUBLIC_METADATA_BASE_URL=https://dashboard.lojapersonalprime.com
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