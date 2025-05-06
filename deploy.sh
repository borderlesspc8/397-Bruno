#!/bin/bash
set -e

# Cores para melhor visualização
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
  echo -e "${RED}Arquivo .env não encontrado. Criando um modelo...${NC}"
  cp .env.example .env
  echo -e "${YELLOW}Por favor, edite o arquivo .env com suas configurações antes de continuar.${NC}"
  exit 1
fi

# Definir tag da imagem
IMAGE_NAME="mkadev/contarapida"
TAG=$(date +%Y%m%d%H%M)
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"
LATEST_IMAGE_NAME="${IMAGE_NAME}:latest"

echo -e "${GREEN}Iniciando processo de build e deploy do ContaRápida...${NC}"

# Build da imagem Docker
echo -e "${YELLOW}Construindo imagem Docker: ${FULL_IMAGE_NAME}${NC}"
docker build -t ${FULL_IMAGE_NAME} -t ${LATEST_IMAGE_NAME} .

# Enviar imagem para o Docker Hub
echo -e "${YELLOW}Enviando imagem para o Docker Hub...${NC}"
docker push ${FULL_IMAGE_NAME}
docker push ${LATEST_IMAGE_NAME}

# Verificar se estamos no servidor de produção
if [ -d "/var/lib/docker/volumes" ]; then
  echo -e "${GREEN}Detectado ambiente de produção. Atualizando stack no Portainer...${NC}"
  
  # Atualizar a stack no Portainer
  if [ -f "contarapida.yaml" ]; then
    echo -e "${YELLOW}Atualizando stack ContaRápida no Portainer...${NC}"
    
    # Se estiver usando Portainer API (necessita autenticação)
    # curl -X POST \
    #   -H "Authorization: Bearer ${PORTAINER_TOKEN}" \
    #   -H "Content-Type: application/json" \
    #   -d @contarapida.yaml \
    #   http://localhost:9000/api/stacks/[STACK_ID]/file
    
    # Caso contrário, informar para atualizar manualmente
    echo -e "${GREEN}Imagem atualizada com sucesso!${NC}"
    echo -e "${YELLOW}Por favor, atualize a stack 'contarapida' no Portainer com a nova imagem: ${FULL_IMAGE_NAME}${NC}"
  else
    echo -e "${RED}Arquivo contarapida.yaml não encontrado. Deploy manual necessário.${NC}"
  fi
else
  echo -e "${YELLOW}Este não é o servidor de produção. A imagem foi enviada para o Docker Hub.${NC}"
  echo -e "${GREEN}No servidor de produção, execute:${NC}"
  echo -e "docker stack deploy -c contarapida.yaml contarapida"
fi

echo -e "${GREEN}Processo de build e deploy concluído!${NC}" 