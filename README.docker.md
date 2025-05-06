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

- `docker-compose.yml` - Configuração dos serviços
- `.env` - Variáveis de ambiente
- `Dockerfile` - Configuração da imagem da aplicação
- `scripts/entrypoint.sh` - Script de inicialização
- `deploy-docker.sh` - Script de implantação automatizada

## Instalação Rápida

Para uma implantação rápida, execute:

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

### 2. Construa e inicie os containers

```bash
# Construir imagens
docker compose build

# Iniciar os serviços
docker compose up -d
```

### 3. Verificar o status

```bash
# Verificar status dos containers
docker compose ps

# Verificar logs da aplicação
docker compose logs -f app
```

## Serviços Incluídos

1. **app** - Aplicação Next.js (frontend e backend)
2. **postgres** - Banco de dados PostgreSQL
3. **redis** - Armazenamento em cache
4. **traefik** - Proxy reverso e gerenciador de SSL

## Gerenciamento

### Gerenciando os serviços

```bash
# Parar todos os serviços
docker compose down

# Reiniciar um serviço específico
docker compose restart app

# Visualizar logs
docker compose logs -f app
docker compose logs -f postgres
```

### Atualizando a aplicação

```bash
# Puxar as últimas alterações do repositório
git pull

# Reconstruir e reiniciar o container da aplicação
docker compose build app
docker compose up -d app
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
# Ver todos os logs
docker compose logs

# Ver logs de um serviço específico com acompanhamento
docker compose logs -f app
```

### Verificar status de saúde

```bash
# Ver status dos containers
docker compose ps

# Verificar saúde da aplicação
curl -k https://localhost/api/health
```

### Reiniciar completamente

Se encontrar problemas persistentes:

```bash
# Parar todos os serviços
docker compose down

# Remover volumes (CUIDADO: isso apaga dados persistentes)
docker compose down -v

# Iniciar novamente
docker compose up -d
```

## Personalização

### Configurando o Traefik

O Traefik está configurado para:
- Redirecionar HTTP para HTTPS
- Emitir certificados SSL automaticamente
- Proteger seu dashboard com autenticação básica

Para personalizar, edite as seções do Traefik no arquivo `docker-compose.yml`.

### Escalando a aplicação

Para implantar em um cluster Docker Swarm:

```bash
# Inicialize o swarm
docker swarm init

# Implante a pilha
docker stack deploy -c docker-compose.yml contarapida
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