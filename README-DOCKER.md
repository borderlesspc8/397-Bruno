# Ambiente Docker para ContaRapida

Este documento descreve como configurar e utilizar o ambiente Docker para executar a aplicação ContaRapida utilizando serviços PostgreSQL e Redis existentes, com Traefik como proxy reverso.

## Requisitos

- Docker 20.10.x ou superior
- Docker Compose 2.x ou superior
- Git
- PostgreSQL existente acessível via rede Docker
- Redis existente acessível via rede Docker
- Traefik configurado como proxy reverso (para ambiente de produção)
- Permissões de administrador (para sistemas Linux/Mac)

## Estrutura do Ambiente

O ambiente Docker da ContaRapida é composto pelos seguintes serviços:

1. **contarapida**: Aplicação principal Next.js
2. **pgadmin**: Interface de administração para o PostgreSQL (opcional)

A aplicação se conecta aos seguintes serviços existentes:
- **PostgreSQL**: O banco de dados existente no seu ambiente Docker
- **Redis**: O serviço de cache existente no seu ambiente Docker
- **Traefik**: Proxy reverso para roteamento de requisições HTTP e HTTPS

## Configuração

1. Clone o repositório:
   ```bash
   git clone <repository-url>
   cd contarapida
   ```

2. Configure as variáveis de ambiente no `.env.docker`:
   - Edite o arquivo `.env.docker` para apontar para seus serviços existentes:
     - `DATABASE_URL`: URL de conexão com seu PostgreSQL existente
     - `REDIS_URL`: URL de conexão com seu Redis existente
     - `NEXTAUTH_SECRET`: Chave secreta para o NextAuth (importante em produção)
     - `NEXTAUTH_URL`: URL de acesso à aplicação (domínio completo com https)
     - `DOMAIN`: Domínio principal da aplicação (sem https://)

## Redes Docker

A aplicação utiliza redes Docker externas para se conectar aos serviços existentes:
- **postgres-network**: Rede para conectar ao PostgreSQL
- **redis-network**: Rede para conectar ao Redis
- **AcceleraNet**: Rede externa para comunicação com o Traefik

O script de deploy verificará a existência dessas redes e as criará caso não existam.

## Comandos Disponíveis

Utilize o script `deploy-docker.sh` para gerenciar o ambiente:

```bash
# Tornar o script executável
chmod +x deploy-docker.sh

# Exibir ajuda
./deploy-docker.sh help

# Iniciar a aplicação
./deploy-docker.sh start

# Parar a aplicação
./deploy-docker.sh stop

# Reiniciar a aplicação
./deploy-docker.sh restart

# Reconstruir imagem e iniciar a aplicação
./deploy-docker.sh rebuild

# Testar conexão com PostgreSQL e Redis
./deploy-docker.sh test-conn

# Verificar a configuração do Traefik
./deploy-docker.sh check-traefik

# Executar migrações do banco de dados
./deploy-docker.sh migrate

# Popular banco de dados com dados iniciais
./deploy-docker.sh seed

# Configuração completa (iniciar + migrar + seed)
./deploy-docker.sh setup

# Visualizar logs
./deploy-docker.sh logs
```

## Acessando os Serviços

Após iniciar os serviços, você pode acessar:

- **Aplicação ContaRapida**: 
  - Em produção: https://[seu-dominio]
  - Em desenvolvimento: http://localhost:3000

- **PgAdmin**: 
  - Em produção: https://pgadmin.[seu-dominio]
  - Em desenvolvimento: http://localhost:5050
  
  Credenciais padrão:
  - Email: admin@contarapida.com 
  - Senha: admin

## Configuração do Traefik

O Traefik é utilizado como proxy reverso e gerenciador de certificados SSL. A aplicação foi configurada para utilizar os seguintes recursos do Traefik:

1. **Roteamento**: Roteamento baseado em Host para direcionamento de requisições
2. **SSL/TLS**: Certificados gerenciados automaticamente (Let's Encrypt)
3. **Entrypoints**: Configurados para receber requisições HTTPS

Para verificar se o Traefik está configurado corretamente:

```bash
./deploy-docker.sh check-traefik
```

### Labels do Traefik

No arquivo `docker-compose.yml`, os serviços são configurados com labels que o Traefik utiliza para roteamento:

```yaml
labels:
  - traefik.enable=true
  - traefik.http.routers.contarapida.rule=Host(`${DOMAIN}`)
  - traefik.http.routers.contarapida.entrypoints=websecure
  - traefik.http.routers.contarapida.tls.certresolver=letsencryptresolver
  - traefik.http.services.contarapida.loadbalancer.server.port=3000
  - traefik.http.services.contarapida.loadbalancer.passHostHeader=true
  - traefik.http.routers.contarapida.service=contarapida
```

## Configuração do PgAdmin

Ao acessar o PgAdmin pela primeira vez, você precisará adicionar o servidor PostgreSQL:

1. Acesse https://pgadmin.[seu-dominio] (ou http://localhost:5050 em desenvolvimento) e faça login
2. Clique em "Add New Server"
3. Na aba "General", dê um nome como "ContaRapida"
4. Na aba "Connection", configure:
   - Host: postgres (ou o host do seu PostgreSQL existente)
   - Port: 5432 (ou a porta do seu PostgreSQL existente)
   - Maintenance database: contarapida
   - Username: postgres (ou o usuário do seu PostgreSQL existente)
   - Password: 123456 (ou a senha do seu PostgreSQL existente)

## Solução de Problemas

### Problemas de conexão com PostgreSQL ou Redis

Se a aplicação não conseguir se conectar aos serviços:

1. Verifique se os serviços PostgreSQL e Redis estão em execução
2. Execute o teste de conexão:
   ```bash
   ./deploy-docker.sh test-conn
   ```
3. Verifique as URLs de conexão no arquivo `.env.docker`
4. Certifique-se de que os contêineres estejam na mesma rede Docker

### Problemas com o Traefik

Se a aplicação não estiver acessível através do domínio configurado:

1. Verifique se o Traefik está em execução:
   ```bash
   docker ps | grep traefik
   ```

2. Execute o verificador de configuração do Traefik:
   ```bash
   ./deploy-docker.sh check-traefik
   ```

3. Verifique a configuração do Traefik para garantir que os entrypoints e resolvers estão configurados corretamente

4. Verifique os logs do Traefik:
   ```bash
   docker logs [nome-do-container-traefik]
   ```

### Redes Docker

A aplicação precisa se conectar às redes do PostgreSQL, Redis e Traefik:

```bash
# Verificar redes disponíveis
docker network ls

# Criar redes se necessário
docker network create postgres-network
docker network create redis-network
docker network create AcceleraNet

# Conectar contêineres existentes às redes (se necessário)
docker network connect postgres-network seu-container-postgres
docker network connect redis-network seu-container-redis
docker network connect AcceleraNet seu-container-traefik
```

### Logs para diagnósticos

Use o comando de logs para diagnosticar problemas:

```bash
./deploy-docker.sh logs
```

## Ambiente de Produção

Para ambientes de produção, recomenda-se:

1. Configurar chaves fortes para `NEXTAUTH_SECRET`
2. Garantir que o Traefik esteja corretamente configurado com SSL
3. Configurar limites de recursos apropriados para os contêineres
4. Verificar se o modo de replicação está corretamente configurado
5. Implementar monitoramento de saúde dos serviços

## Atualizações

Quando houver atualizações no código:

```bash
git pull
./deploy-docker.sh rebuild
```

---

Para mais informações, consulte a documentação completa ou entre em contato com a equipe de suporte. 