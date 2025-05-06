#!/bin/bash
set -e

# Cores para melhor visualização
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Exibir cabeçalho
echo -e "${GREEN}"
echo "==============================================="
echo "       INSTALAÇÃO DO CONTARAPIDA"
echo "==============================================="
echo -e "${NC}"

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker não encontrado. Por favor, instale o Docker antes de continuar.${NC}"
    echo "Visite: https://docs.docker.com/engine/install/"
    exit 1
fi

# Verificar se o Docker Compose está instalado
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}Docker Compose não encontrado. Por favor, instale o Docker Compose antes de continuar.${NC}"
    echo "Visite: https://docs.docker.com/compose/install/"
    exit 1
fi

# Criar pasta de logs se não existir
if [ ! -d "./logs" ]; then
    echo -e "${YELLOW}Criando diretório de logs...${NC}"
    mkdir -p ./logs
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

# Perguntar sobre o ambiente de produção
echo -e "${YELLOW}Este é um ambiente de produção? (s/n)${NC}"
read -p "" is_production

if [[ "$is_production" == "s" || "$is_production" == "S" ]]; then
    echo -e "${YELLOW}Verificando domínio...${NC}"
    domain=$(grep "DOMAIN=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [[ "$domain" == "contarapida.exemplo.com" ]]; then
        echo -e "${RED}ALERTA: O domínio ainda está com o valor padrão (contarapida.exemplo.com).${NC}"
        echo -e "${YELLOW}Por favor, edite o arquivo .env e defina um domínio válido antes de continuar.${NC}"
        read -p "Pressione Enter para abrir o arquivo .env para edição..." 
        ${EDITOR:-vi} .env
    fi
    
    # Verificar senha do banco de dados
    db_password=$(grep "POSTGRES_PASSWORD=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    if [[ "$db_password" == "postgres_seguro_123" ]]; then
        echo -e "${RED}ALERTA: A senha do PostgreSQL ainda está com o valor padrão.${NC}"
        echo -e "${YELLOW}Deseja gerar uma senha aleatória? (s/n)${NC}"
        read -p "" generate_password
        
        if [[ "$generate_password" == "s" || "$generate_password" == "S" ]]; then
            new_password=$(openssl rand -base64 12)
            sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${new_password}/" .env
            echo -e "${GREEN}Nova senha gerada e atualizada no arquivo .env.${NC}"
        else
            echo -e "${YELLOW}Por favor, edite manualmente a senha do banco de dados no arquivo .env.${NC}"
            read -p "Pressione Enter para continuar..." 
        fi
    fi
    
    # Verificar chave secreta do NextAuth
    nextauth_secret=$(grep "NEXTAUTH_SECRET=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    if [[ "$nextauth_secret" == "chave_super_secreta_para_nextauth_tokens" ]]; then
        echo -e "${RED}ALERTA: A chave secreta do NextAuth ainda está com o valor padrão.${NC}"
        echo -e "${YELLOW}Gerando nova chave secreta...${NC}"
        new_secret=$(openssl rand -base64 32)
        sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=${new_secret}/" .env
        echo -e "${GREEN}Nova chave secreta gerada e atualizada no arquivo .env.${NC}"
    fi
fi

# Construir as imagens Docker
echo -e "${YELLOW}Construindo as imagens Docker...${NC}"
docker compose build

# Iniciar os serviços
echo -e "${YELLOW}Iniciando os serviços...${NC}"
docker compose up -d

# Verificar status
echo -e "${YELLOW}Verificando status dos containers...${NC}"
sleep 5
docker compose ps

# Exibir logs do container da aplicação
echo -e "${YELLOW}Exibindo logs do container da aplicação...${NC}"
docker compose logs -f app

echo -e "${GREEN}"
echo "==============================================="
echo "       INSTALAÇÃO CONCLUÍDA"
echo "==============================================="
echo -e "${NC}"
echo "A aplicação ContaRapida foi implantada com sucesso!"
echo "Acesse: https://${domain:-contarapida.exemplo.com}"
echo ""
echo "Para visualizar os logs: docker compose logs -f app"
echo "Para parar os serviços: docker compose down"
echo "Para reiniciar os serviços: docker compose restart"
echo "" 