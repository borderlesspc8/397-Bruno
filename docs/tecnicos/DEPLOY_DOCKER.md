# Guia de Implantação do ContaRápida com Docker

Este documento descreve o processo de implantação do ContaRápida em um servidor VPS utilizando Docker, Portainer e Traefik.

## Visão Geral

A arquitetura de implantação consiste em:

1. **Docker Swarm**: Para orquestração de contêineres
2. **Traefik**: Como proxy reverso e gerenciador de SSL
3. **Portainer**: Para gestão visual dos contêineres
4. **PostgreSQL**: Para persistência de dados
5. **Redis**: Para cache e gerenciamento de sessões
6. **Backup automatizado**: Para garantir a segurança dos dados

## Pré-requisitos

- Um servidor VPS com Ubuntu 20.04 ou superior
- Domínio configurado para apontar para o IP da VPS
- Acesso SSH ao servidor com privilégios de root

## Processo de Implantação

### 1. Configuração Inicial do Servidor

Utilizamos um script automatizado para configurar o servidor. Basta executar:

```bash
# Fazer upload do script para o servidor
scp setup-server.sh usuario@seu-servidor:/tmp/

# Conectar ao servidor
ssh usuario@seu-servidor

# Executar o script
cd /tmp
chmod +x setup-server.sh
sudo ./setup-server.sh
```

Este script configura:
- Docker Engine
- Docker Compose
- Rede Docker "AcceleraNet"
- Portainer
- Traefik com SSL automático via Let's Encrypt

### 2. Configuração de DNS

Configure seu DNS para apontar os seguintes domínios para o IP do servidor:
- `contarapida.acceleracrm.com.br`
- `traefik.acceleracrm.com.br` (opcional, para acessar o dashboard do Traefik)

### 3. Implantação da Aplicação

#### Opção 1: Usando Portainer (Recomendado)

1. Acesse o Portainer em `http://seu-ip:9000`
2. Crie uma nova stack chamada "contarapida"
3. Cole o conteúdo do arquivo `contarapida.yaml`
4. Configure as variáveis de ambiente ou utilize um arquivo `.env`
5. Clique em "Deploy the stack"

#### Opção 2: Usando linha de comando

1. Faça upload dos arquivos para o servidor:
```bash
scp Dockerfile contarapida.yaml .env.example deploy.sh usuario@seu-servidor:/opt/contarapida/
```

2. Conecte ao servidor e configure:
```bash
ssh usuario@seu-servidor
cd /opt/contarapida
cp .env.example .env
# Edite o arquivo .env com suas configurações
nano .env
```

3. Execute o script de deploy:
```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. Verificação da Implantação

Após a implantação, verifique se todos os serviços estão rodando:

```bash
docker service ls
```

Você deverá ver os seguintes serviços:
- contarapida_contarapida
- contarapida_postgres
- contarapida_redis
- contarapida_backup
- traefik_traefik

## Arquivos de Configuração

### contarapida.yaml

Este arquivo define a stack Docker com todos os serviços necessários:

```yaml
version: "3.7"
services:
  contarapida:
    image: mkadev/contarapida:latest
    # Configurações do serviço da aplicação...
    
  postgres:
    image: postgres:15
    # Configurações do banco de dados...
    
  redis:
    image: redis:7
    # Configurações do cache...
    
  backup:
    image: prodrigestivill/postgres-backup-local
    # Configurações de backup automático...
    
volumes:
  postgres_data:
  redis_data:
  postgres_backup:

networks:
  AcceleraNet:
    external: true
```

### Dockerfile

Este arquivo define como a imagem Docker da aplicação é construída:

```dockerfile
FROM node:20-alpine AS deps
# Configurações para construção da imagem...
```

### deploy.sh

Script para automatizar o processo de build e deploy:

```bash
#!/bin/bash
# Script para automação do processo de deploy...
```

## Manutenção e Operações

### Atualização da Aplicação

Para atualizar a aplicação com novas versões:

1. Faça o pull das alterações do repositório
2. Execute o script de deploy:
```bash
./deploy.sh
```

### Backup e Restauração

Os backups são realizados automaticamente pelo serviço `backup` e armazenados no volume `postgres_backup`.

Para restaurar um backup:

```bash
# Listar backups disponíveis
docker exec -it $(docker ps -q -f name=contarapida_backup) ls -la /backups

# Restaurar um backup específico
docker exec -it $(docker ps -q -f name=contarapida_postgres) bash -c \
  "pg_restore -U postgres -d contarapida -c /backups/nome-do-arquivo.sql"
```

### Monitoramento

Utilize o Portainer para monitorar o status dos contêineres, visualizar logs e gerenciar recursos.

Para visualizar logs via linha de comando:

```bash
docker service logs contarapida_contarapida
```

## Resolução de Problemas

### A aplicação não está acessível

1. Verifique se os serviços estão rodando:
```bash
docker service ls
```

2. Verifique os logs da aplicação:
```bash
docker service logs contarapida_contarapida
```

3. Verifique se o Traefik está configurado corretamente:
```bash
docker service logs traefik_traefik
```

### Problemas com o banco de dados

1. Verifique os logs do PostgreSQL:
```bash
docker service logs contarapida_postgres
```

2. Conecte ao banco de dados para diagnóstico:
```bash
docker exec -it $(docker ps -q -f name=contarapida_postgres) psql -U postgres -d contarapida
```

## Segurança

Algumas recomendações de segurança:

1. Mantenha todas as senhas em variáveis de ambiente, nunca hardcoded
2. Utilize senhas fortes para todos os serviços
3. Restrinja o acesso SSH ao servidor apenas a IPs confiáveis
4. Configure um firewall (UFW) permitindo apenas as portas necessárias (22, 80, 443)
5. Atualize regularmente o sistema e os contêineres

## Recursos Adicionais

- [Documentação do Docker](https://docs.docker.com/)
- [Documentação do Traefik](https://doc.traefik.io/traefik/)
- [Documentação do Portainer](https://docs.portainer.io/)
- [Documentação do PostgreSQL](https://www.postgresql.org/docs/) 