#!/bin/bash
set -e

# Script para implantar a aplicação ContaRapida no Docker Swarm
# Autor: Conta Rápida Team

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Exibir cabeçalho
echo -e "${GREEN}"
echo "==============================================="
echo "       IMPLANTAÇÃO SWARM DO CONTARAPIDA"
echo "==============================================="
echo -e "${NC}"

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker não encontrado. Por favor, instale o Docker antes de continuar.${NC}"
    echo "Visite: https://docs.docker.com/engine/install/"
    exit 1
fi

# Verificar se está em modo Swarm
if ! docker info | grep -q "Swarm: active"; then
    echo -e "${YELLOW}Docker Swarm não está ativo. Iniciando modo Swarm...${NC}"
    docker swarm init --advertise-addr $(hostname -i) || true
    echo -e "${GREEN}Docker Swarm iniciado.${NC}"
fi

# Verificar arquivo .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Arquivo .env não encontrado. Criando a partir do exemplo...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}Arquivo .env criado. Por favor, edite-o com suas configurações antes de continuar.${NC}"
    else
        echo -e "${RED}Arquivo .env.example não encontrado. Criando .env básico...${NC}"
        cat > .env << EOL
# Configurações do Contêiner
DOMAIN=contarapida.exemplo.com
ACME_EMAIL=admin@exemplo.com
TRAEFIK_BASIC_AUTH=admin:\$apr1\$talBPKvT\$zT3sAYOwMXXPx2jAlfMTQ1 # admin:admin (altere para produção!)

# Configurações do Banco de Dados PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(openssl rand -base64 12)
POSTGRES_DB=contarapida
DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}

# Redis
REDIS_URL=redis://redis:6379

# NextAuth
NEXTAUTH_URL=https://\${DOMAIN}
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Modo de ambiente
NODE_ENV=production
EOL
        echo -e "${YELLOW}Arquivo .env básico criado. IMPORTANTE: Edite-o antes de continuar!${NC}"
    fi
    
    echo -e "${YELLOW}Por favor, edite o arquivo .env e pressione Enter para continuar...${NC}"
    read -p ""
fi

# Perguntar se deve construir a imagem
echo -e "${YELLOW}Deseja construir a imagem localmente antes de implantar? (s/n)${NC}"
read -p "" build_image

if [[ "$build_image" == "s" || "$build_image" == "S" ]]; then
    echo -e "${YELLOW}Construindo imagem Docker...${NC}"
    docker build -t contarapida:latest .
    
    echo -e "${GREEN}Imagem construída com sucesso.${NC}"
else
    echo -e "${YELLOW}Pulando etapa de construção da imagem.${NC}"
    echo -e "${YELLOW}Certifique-se de que a imagem 'contarapida:latest' já existe.${NC}"
fi

# Verificar se a rede já existe
NETWORK_EXISTS=$(docker network ls --filter name=contarapida-network --format "{{.Name}}" | grep -c "contarapida-network" || true)
if [ "$NETWORK_EXISTS" -eq 0 ]; then
    echo -e "${YELLOW}Criando rede overlay 'contarapida-network'...${NC}"
    docker network create --driver overlay --attachable contarapida-network
    echo -e "${GREEN}Rede criada com sucesso.${NC}"
else
    echo -e "${GREEN}Rede 'contarapida-network' já existe.${NC}"
fi

# Carregar variáveis de ambiente
export $(grep -v '^#' .env | xargs)

# Criar volumes se não existirem
for VOLUME in traefik-certificates postgres-data redis-data app-logs app-uploads; do
    VOLUME_EXISTS=$(docker volume ls --filter name=$VOLUME --format "{{.Name}}" | grep -c "$VOLUME" || true)
    if [ "$VOLUME_EXISTS" -eq 0 ]; then
        echo -e "${YELLOW}Criando volume '$VOLUME'...${NC}"
        docker volume create $VOLUME
    fi
done

# Implantar a stack
echo -e "${YELLOW}Implantando stack ContaRapida no Swarm...${NC}"
docker stack deploy -c docker-stack.yml contarapida

# Verificar status
echo -e "${YELLOW}Verificando status dos serviços...${NC}"
sleep 5
docker stack services contarapida

echo -e "${GREEN}"
echo "==============================================="
echo "       IMPLANTAÇÃO CONCLUÍDA"
echo "==============================================="
echo -e "${NC}"
echo "A aplicação ContaRapida foi implantada com sucesso no Docker Swarm!"
echo "Acesse: https://${DOMAIN:-contarapida.exemplo.com}"
echo ""
echo "Para visualizar os serviços: docker stack services contarapida"
echo "Para visualizar os containers: docker stack ps contarapida"
echo "Para visualizar os logs: docker service logs contarapida_app"
echo "Para remover a stack: docker stack rm contarapida"
echo ""
echo -e "${YELLOW}IMPORTANTE: Se esta é sua primeira implantação, pode levar alguns minutos para que o Traefik"
echo -e "obtenha os certificados SSL e configure os serviços corretamente.${NC}" 