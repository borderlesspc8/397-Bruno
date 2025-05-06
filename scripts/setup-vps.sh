#!/bin/bash

# Script para configuração inicial da VPS para o ContaRápida
# Uso: ./setup-vps.sh

set -e

echo "🚀 Iniciando configuração da VPS para o ContaRápida..."

# Atualizar sistema
echo "📦 Atualizando sistema..."
apt-get update
apt-get upgrade -y

# Instalar pacotes essenciais
echo "📦 Instalando pacotes essenciais..."
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    htop \
    vim \
    ufw \
    fail2ban

# Configurar firewall
echo "🔒 Configurando firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# Configurar fail2ban
echo "🔒 Configurando fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# Instalar Docker
echo "🐳 Instalando Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
echo "🐳 Instalando Docker Compose..."
curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Criar usuário para a aplicação
echo "👤 Criando usuário para a aplicação..."
useradd -m -s /bin/bash contarapida
usermod -aG docker contarapida

# Criar diretórios para a aplicação
echo "📁 Criando diretórios para a aplicação..."
mkdir -p /home/contarapida/app
mkdir -p /home/contarapida/app/nginx/conf.d
mkdir -p /home/contarapida/app/nginx/ssl
mkdir -p /home/contarapida/app/nginx/www
mkdir -p /home/contarapida/app/uploads
chown -R contarapida:contarapida /home/contarapida/app

# Clonar repositório
echo "📥 Clonando repositório..."
cd /home/contarapida/app
git clone https://github.com/seu-usuario/contarapida.git .
chown -R contarapida:contarapida /home/contarapida/app

# Criar arquivo .env
echo "🔑 Criando arquivo .env..."
cat > /home/contarapida/app/.env << EOL
# Configurações do ContaRápida
NODE_ENV=production
PORT=3000

# Banco de dados
POSTGRES_PASSWORD=senha_segura_aqui
DATABASE_URL=postgresql://postgres:senha_segura_aqui@postgres:5432/contarapida

# Redis
REDIS_URL=redis://redis:6379

# NextAuth
NEXTAUTH_URL=https://contarapida.com.br
NEXTAUTH_SECRET=seu_secret_seguro_aqui

# Docker
DOCKER_USERNAME=seu_usuario_docker
TAG=latest
EOL

chown contarapida:contarapida /home/contarapida/app/.env

echo "✅ Configuração inicial da VPS concluída!"
echo "🔥 Próximos passos:"
echo "  1. Configure os certificados SSL em /home/contarapida/app/nginx/ssl"
echo "  2. Ajuste as configurações no arquivo .env"
echo "  3. Execute 'cd /home/contarapida/app && docker-compose up -d'"
echo "  4. Acesse sua aplicação em https://seu-dominio.com.br" 