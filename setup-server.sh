#!/bin/bash
set -e

# Cores para melhor visualização
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Iniciando configuração do servidor para ContaRápida...${NC}"

# Verificar se o script está sendo executado como root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Este script precisa ser executado como root ou com sudo${NC}"
  exit 1
fi

# Atualizar o sistema
echo -e "${YELLOW}Atualizando o sistema...${NC}"
apt-get update && apt-get upgrade -y

# Instalar dependências
echo -e "${YELLOW}Instalando dependências...${NC}"
apt-get install -y apt-transport-https ca-certificates curl software-properties-common gnupg

# Instalar Docker
echo -e "${YELLOW}Instalando Docker...${NC}"
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  usermod -aG docker $SUDO_USER
  systemctl enable docker
  systemctl start docker
  echo -e "${GREEN}Docker instalado com sucesso!${NC}"
else
  echo -e "${GREEN}Docker já está instalado. Pulando...${NC}"
fi

# Instalar Docker Compose
echo -e "${YELLOW}Instalando Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
  mkdir -p ~/.docker/cli-plugins/
  curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose
  chmod +x ~/.docker/cli-plugins/docker-compose
  echo -e "${GREEN}Docker Compose instalado com sucesso!${NC}"
else
  echo -e "${GREEN}Docker Compose já está instalado. Pulando...${NC}"
fi

# Criar rede Docker para a aplicação
echo -e "${YELLOW}Criando rede Docker...${NC}"
if ! docker network ls | grep -q AcceleraNet; then
  docker network create --driver=overlay --attachable AcceleraNet
  echo -e "${GREEN}Rede AcceleraNet criada com sucesso!${NC}"
else
  echo -e "${GREEN}Rede AcceleraNet já existe. Pulando...${NC}"
fi

# Instalar Portainer
echo -e "${YELLOW}Instalando Portainer...${NC}"
if ! docker ps -a | grep -q portainer; then
  docker volume create portainer_data
  docker run -d -p 8000:8000 -p 9000:9000 --name=portainer --restart=always \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v portainer_data:/data \
    portainer/portainer-ce:latest
  echo -e "${GREEN}Portainer instalado com sucesso! Acesse http://seu-ip:9000${NC}"
else
  echo -e "${GREEN}Portainer já está instalado. Pulando...${NC}"
fi

# Configurar Traefik
echo -e "${YELLOW}Configurando Traefik...${NC}"
mkdir -p /opt/traefik
touch /opt/traefik/acme.json
chmod 600 /opt/traefik/acme.json

cat > /opt/traefik/traefik.yaml << EOF
api:
  dashboard: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencryptresolver:
    acme:
      email: contato@acceleracrm.com.br
      storage: /etc/traefik/acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    swarmMode: true
    network: AcceleraNet
  file:
    filename: /etc/traefik/dynamic_conf.yaml
EOF

cat > /opt/traefik/dynamic_conf.yaml << EOF
http:
  middlewares:
    securityHeaders:
      headers:
        browserXssFilter: true
        contentTypeNosniff: true
        frameDeny: true
        sslRedirect: true
        stsIncludeSubdomains: true
        stsPreload: true
        stsSeconds: 31536000
        customFrameOptionsValue: "SAMEORIGIN"
EOF

# Criar serviço Traefik
cat > /opt/traefik/docker-compose.yaml << EOF
version: '3.7'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.docker.swarmMode=true"
      - "--providers.docker.network=AcceleraNet"
      - "--providers.file.filename=/etc/traefik/dynamic_conf.yaml"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencryptresolver.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencryptresolver.acme.email=contato@acceleracrm.com.br"
      - "--certificatesresolvers.letsencryptresolver.acme.storage=/etc/traefik/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "/opt/traefik/acme.json:/etc/traefik/acme.json"
      - "/opt/traefik/dynamic_conf.yaml:/etc/traefik/dynamic_conf.yaml"
    networks:
      - AcceleraNet
    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.traefik.rule=Host(\`traefik.acceleracrm.com.br\`)"
        - "traefik.http.routers.traefik.service=api@internal"
        - "traefik.http.routers.traefik.entrypoints=websecure"
        - "traefik.http.routers.traefik.tls.certresolver=letsencryptresolver"
        - "traefik.http.routers.traefik.middlewares=traefik-auth"
        - "traefik.http.middlewares.traefik-auth.basicauth.users=admin:$$apr1$$1tgHFV0U$$Nz85SoyIv0q8S.Ds/v1mi1"

networks:
  AcceleraNet:
    external: true
EOF

# Iniciar Traefik como stack
echo -e "${YELLOW}Iniciando Traefik...${NC}"
cd /opt/traefik
docker stack deploy -c docker-compose.yaml traefik

echo -e "${GREEN}Configuração do servidor concluída com sucesso!${NC}"
echo -e "${YELLOW}Informações importantes:${NC}"
echo -e "1. Portainer: http://$(hostname -I | awk '{print $1}'):9000"
echo -e "2. Traefik Dashboard: https://traefik.acceleracrm.com.br (usuário: admin, senha: padrão)"
echo -e "3. Para implantar o ContaRápida, use o Portainer ou execute:"
echo -e "   cd /caminho/para/contarapida && ./deploy.sh"
echo -e "${RED}Lembre-se de configurar seu DNS para apontar contarapida.acceleracrm.com.br para o IP deste servidor!${NC}" 