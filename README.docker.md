# Implantação do ContaRapida com Docker

Este guia explica como implantar o ContaRapida em um servidor VPS usando Docker, incluindo o backend, frontend, PostgreSQL, Redis e Traefik para gerenciamento de certificados SSL.

## Pré-requisitos

- Servidor VPS com Ubuntu 20.04 ou superior
- Docker instalado (versão 20.10.0 ou superior)
- Docker Compose V2 instalado
- Um domínio apontando para o IP do servidor
- Portas 80 e 443 liberadas no firewall

## Estrutura de Arquivos

A configuração Docker inclui os seguintes arquivos:

- `docker-compose.yml` - Configuração dos serviços para desenvolvimento/implantação simples
- `docker-stack.yml` - Configuração para implantação em Docker Swarm (produção)
- `.env` - Variáveis de ambiente
- `Dockerfile` - Configuração da imagem da aplicação
- `scripts/entrypoint.sh` - Script de inicialização
- `deploy-docker.sh` - Script de implantação com Docker Compose
- `deploy-swarm.sh` - Script de implantação com Docker Swarm

## Modos de Implantação

Existem dois modos de implantação disponíveis:

### 1. Docker Compose (Desenvolvimento/Servidor Único)

Ideal para ambiente de desenvolvimento ou servidor único. Usa o arquivo `docker-compose.yml`.

```bash
# Execução rápida
chmod +x deploy-docker.sh
./deploy-docker.sh
```

### 2. Docker Swarm (Produção)

Recomendado para ambiente de produção com alta disponibilidade. Usa o arquivo `docker-stack.yml`.

```bash
# Execução rápida
chmod +x deploy-swarm.sh
./deploy-swarm.sh
```

#### Principais diferenças:

| Característica | Docker Compose | Docker Swarm |
|----------------|---------------|-------------|
| Escalabilidade | Servidor único | Múltiplos nós |
| Formato da configuração | `container_name`, `build`, `restart` | `deploy`, `replicas`, `placement` |
| Tipo de rede | bridge | overlay |
| Implantação | `docker-compose up` | `docker stack deploy` |
| Arquivos | docker-compose.yml | docker-stack.yml |

## Instalação Rápida (Compose)

Para uma implantação rápida com Docker Compose:

```bash
# Dê permissão de execução ao script de implantação
chmod +x deploy-docker.sh

# Execute o script
./deploy-docker.sh
```

O script vai:
1. Verificar a presença do Docker e Docker Compose
2. Configurar o arquivo `.env` se necessário
3. Construir e iniciar os containers
4. Exibir os logs da aplicação

## Instalação Rápida (Swarm)

Para uma implantação em produção com Docker Swarm:

```bash
# Dê permissão de execução ao script de implantação
chmod +x deploy-swarm.sh

# Execute o script
./deploy-swarm.sh
```

O script vai:
1. Verificar a presença do Docker e configurar o Swarm se necessário
2. Construir a imagem Docker localmente
3. Criar a rede overlay e volumes
4. Implantar a stack no Swarm

## Configuração Manual

### 1. Configure o arquivo .env

Copie o arquivo de exemplo e edite as configurações:

```bash
cp .env.example .env
nano .env
```

Importante editar:
- `DOMAIN` - O domínio da sua aplicação
- `ACME_EMAIL` - Email para certificados Let's Encrypt
- `POSTGRES_PASSWORD` - Senha segura para o PostgreSQL
- `NEXTAUTH_SECRET` - Chave secreta para autenticação

### 2. Escolha o modo de implantação

#### Para Docker Compose:
```bash
# Construir imagens
docker compose build

# Iniciar os serviços
docker compose up -d
```

#### Para Docker Swarm:
```bash
# Iniciar o modo Swarm se ainda não estiver ativo
docker swarm init

# Construir a imagem localmente
docker build -t contarapida:latest .

# Criar rede overlay
docker network create --driver overlay --attachable contarapida-network

# Implantar a stack
docker stack deploy -c docker-stack.yml contarapida
```

### 3. Verificar o status

#### Para Docker Compose:
```bash
# Verificar status dos containers
docker compose ps

# Verificar logs da aplicação
docker compose logs -f app
```

#### Para Docker Swarm:
```bash
# Verificar status dos serviços
docker stack services contarapida

# Verificar logs da aplicação
docker service logs contarapida_app
```

## Serviços Incluídos

1. **app** - Aplicação Next.js (frontend e backend)
2. **postgres** - Banco de dados PostgreSQL
3. **redis** - Armazenamento em cache
4. **traefik** - Proxy reverso e gerenciador de SSL

## Gerenciamento

### Gerenciando os serviços (Docker Compose)

```bash
# Parar todos os serviços
docker compose down

# Reiniciar um serviço específico
docker compose restart app

# Visualizar logs
docker compose logs -f app
docker compose logs -f postgres
```

### Gerenciando os serviços (Docker Swarm)

```bash
# Atualizar um serviço
docker service update --image contarapida:latest contarapida_app

# Escalar um serviço
docker service scale contarapida_app=2

# Visualizar logs
docker service logs contarapida_app

# Remover stack
docker stack rm contarapida
```

### Atualizando a aplicação

#### Para Docker Compose:
```bash
# Puxar as últimas alterações do repositório
git pull

# Reconstruir e reiniciar o container da aplicação
docker compose build app
docker compose up -d app
```

#### Para Docker Swarm:
```bash
# Puxar as últimas alterações do repositório
git pull

# Reconstruir a imagem
docker build -t contarapida:latest .

# Atualizar o serviço (mantém o mesmo número de réplicas)
docker service update --image contarapida:latest contarapida_app
```

### Backup do banco de dados

```bash
# Backup
docker compose exec postgres pg_dump -U postgres contarapida > backup_$(date +%Y%m%d_%H%M%S).sql

# Restauração
cat backup_file.sql | docker compose exec -T postgres psql -U postgres contarapida
```

## Acesso à Aplicação

- **Aplicação Web**: https://seu-dominio.com
- **Traefik Dashboard**: https://traefik.seu-dominio.com (protegido por autenticação básica)

## Solução de Problemas

### Verificando logs

```bash
# Docker Compose
docker compose logs

# Docker Swarm
docker service logs contarapida_app
```

### Verificar status de saúde

```bash
# Docker Compose
./scripts/check-health.sh

# Docker Swarm
docker stack ps contarapida
```

### Reiniciar completamente

#### Para Docker Compose:
```bash
# Parar todos os serviços
docker compose down

# Remover volumes (CUIDADO: isso apaga dados persistentes)
docker compose down -v

# Iniciar novamente
docker compose up -d
```

#### Para Docker Swarm:
```bash
# Remover stack
docker stack rm contarapida

# Esperar um pouco
sleep 10

# Implantar novamente
docker stack deploy -c docker-stack.yml contarapida
```

## Personalização

### Configurando o Traefik

O Traefik está configurado para:
- Redirecionar HTTP para HTTPS
- Emitir certificados SSL automaticamente
- Proteger seu dashboard com autenticação básica

Para personalizar, edite as seções do Traefik no arquivo correspondente ao seu modo de implantação.

### Escalando a aplicação

Para escalar a aplicação no Swarm:

```bash
# Aumentar para 3 réplicas
docker service scale contarapida_app=3

# Verificar status
docker service ls
```

## Segurança

Recomendações importantes:
1. Altere todas as senhas padrão nos arquivos `.env`
2. Restrinja acesso SSH apenas para chaves e IPs confiáveis
3. Mantenha o sistema e Docker atualizados
4. Configure backups automáticos do banco de dados
5. Use senhas fortes para o banco de dados

## Suporte

Se encontrar problemas com esta configuração Docker, verifique:
1. Logs dos containers para mensagens de erro
2. Configurações no arquivo `.env`
3. Conectividade de rede e DNS
4. Permissões dos volumes Docker 