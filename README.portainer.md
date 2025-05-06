# Implantação do ContaRapida com Portainer

Este guia explica como implantar o ContaRapida usando Portainer, uma interface web para administração de ambientes Docker.

## O que é Portainer?

Portainer é uma ferramenta de gestão de contêineres com interface visual que facilita o gerenciamento de ambientes Docker. Ele oferece uma alternativa a scripts e comandos de linha de comando, tornando a administração mais acessível para equipes sem experiência técnica profunda.

## Pré-requisitos

- Servidor VPS com Docker instalado
- Portainer instalado e configurado
- Domínio apontando para o IP do servidor
- Portas 80 e 443 liberadas no firewall

## Instalando o Portainer (se ainda não estiver instalado)

```bash
# Criar volume para persistência
docker volume create portainer_data

# Instalar Portainer CE (Community Edition)
docker run -d -p 8000:8000 -p 9443:9443 --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Acesse o Portainer em `https://seu-servidor:9443` e crie sua senha de administrador.

## Implantando o ContaRapida via Portainer

### 1. Preparação Inicial

1. Faça login na interface do Portainer
2. Selecione o ambiente Docker onde deseja implantar o ContaRapida

### 2. Implantação com Docker Compose

#### 2.1. Criando uma Stack

1. No menu lateral, clique em "Stacks"
2. Clique no botão "Add stack"
3. Dê um nome à stack (ex: "contarapida")
4. Em "Build method", selecione "Web editor"

#### 2.2. Preparando as Variáveis de Ambiente

1. Na seção "Environment variables", adicione as variáveis necessárias:
   - `DOMAIN`: Seu domínio (ex: contarapida.exemplo.com)
   - `DATABASE_URL`: URL de conexão com o Postgres
   - `REDIS_URL`: URL de conexão com o Redis
   - `NEXTAUTH_SECRET`: Chave secreta para autenticação
   - `ACME_EMAIL`: Email para certificados Let's Encrypt

#### 2.3. Colando o Docker Compose

1. No editor de texto, cole o conteúdo do arquivo `docker-compose.yml`
2. Revise as configurações conforme necessário
3. Clique em "Deploy the stack"

### 3. Implantação com Docker Swarm

Se você estiver usando o modo Swarm:

#### 3.1. Inicializando o Swarm (se ainda não inicializado)

1. No menu "Cluster", clique em "Setup"
2. Clique em "Initialize Swarm"
3. Adicione o endereço IP advertise do nó manager
4. Clique em "Create"

#### 3.2. Criando uma Stack Swarm

1. No menu lateral, clique em "Stacks"
2. Clique no botão "Add stack"
3. Dê um nome à stack (ex: "contarapida")
4. Em "Build method", selecione "Web editor"
5. Em "Deployment type", selecione "Swarm"

#### 3.3. Adicionando Variáveis e Configuração

1. Adicione as mesmas variáveis de ambiente mencionadas no passo 2.2
2. Cole o conteúdo do arquivo `docker-stack.yml` no editor
3. Clique em "Deploy the stack"

### 4. Configurando a Rede Externa (apenas para Swarm)

Se você estiver usando o arquivo `docker-stack.yml`, precisará criar a rede "AcceleraNet" antes:

1. No menu "Networks", clique em "Add network"
2. Nome: "AcceleraNet"
3. Driver: "overlay"
4. Marque "Enable manual container attachment"
5. Clique em "Create the network"

## Monitoramento e Gerenciamento

### Visualizando Logs

1. No menu "Containers" (ou no menu "Services" para Swarm)
2. Clique no contêiner "contarapida-app"
3. Clique na aba "Logs"
4. Marque "Auto-refresh" para ver logs em tempo real

### Verificando Status de Saúde

1. Acesse o contêiner "contarapida-app"
2. Na visão geral, verifique a seção "Status"
3. O campo "Health" mostrará o status atual

### Gerenciando o Container

Do painel de gerenciamento de contêiner, você pode:
- Reiniciar o contêiner
- Parar/iniciar o contêiner
- Visualizar logs em tempo real
- Acessar o console para depuração
- Visualizar estatísticas de uso de recursos

## Solução de Problemas

### Verificando Logs dos Containers

Se ocorrerem problemas, os logs são a primeira fonte de informação:

1. Acesse o menu "Containers"
2. Clique no contêiner com problema
3. Clique na aba "Logs"

### Acessando a Linha de Comando do Container

Para depuração mais avançada:

1. Acesse o contêiner
2. Clique na aba "Console"
3. Selecione "/bin/sh" como Console
4. Clique em "Connect"

### Problemas com Volumes

Se existirem problemas com persistência de dados:

1. Acesse o menu "Volumes"
2. Verifique se os volumes estão criados corretamente
3. Em caso de problemas, você pode remover e recriar os volumes vazios

## Atualizando a Aplicação

Para atualizar para uma nova versão da imagem:

1. Acesse o menu "Stacks"
2. Encontre a stack "contarapida"
3. Clique em "Editor"
4. Atualize a tag da imagem se necessário
5. Clique em "Update the stack"

## Backup e Restauração

### Backup do Banco de Dados

Usando o Portainer:

1. Acesse o contêiner "contarapida-postgres"
2. Vá para a aba "Console"
3. Execute: `pg_dump -U postgres contarapida > /var/lib/postgresql/data/backup.sql`
4. O arquivo de backup estará no volume de dados do PostgreSQL

### Restauração

1. Acesse o contêiner "contarapida-postgres"
2. Vá para a aba "Console"
3. Execute: `cat /var/lib/postgresql/data/backup.sql | psql -U postgres contarapida`

## Considerações de Segurança

- Altere todas as senhas padrão no arquivo docker-compose.yml
- Use secrets do Docker Swarm para credenciais sensíveis
- Mantenha o Portainer e o Docker atualizados
- Configure backups automáticos do banco de dados
- Limite o acesso à interface do Portainer apenas a IPs confiáveis 