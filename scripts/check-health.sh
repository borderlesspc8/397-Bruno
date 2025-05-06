#!/bin/bash
set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Verificando Saúde dos Serviços ContaRapida ===${NC}"
echo "Data e Hora: $(date)"
echo ""

# Verificar se o Docker está em execução
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Docker não está em execução. Por favor, inicie o serviço Docker.${NC}"
  exit 1
fi

# Verificar status dos containers
echo -e "${YELLOW}Status dos containers:${NC}"
docker compose ps
echo ""

# Verificar logs recentes para erros
echo -e "${YELLOW}Verificando logs recentes para erros:${NC}"
docker compose logs --tail=20 app | grep -i "error\|fail\|exception" || echo -e "${GREEN}Nenhum erro encontrado nos logs recentes.${NC}"
echo ""

# Verificar a API de saúde da aplicação
echo -e "${YELLOW}Verificando endpoint de saúde da aplicação:${NC}"
APP_CONTAINER=$(docker compose ps -q app)
if [ -z "$APP_CONTAINER" ]; then
  echo -e "${RED}Container da aplicação não está em execução.${NC}"
else
  # Verificar endpoint de saúde
  HEALTH_STATUS=$(docker exec $APP_CONTAINER wget -q -O - http://localhost:3000/api/health 2>/dev/null || echo '{"status":"error"}')
  
  if echo $HEALTH_STATUS | grep -q "\"status\":\"ok\""; then
    echo -e "${GREEN}API de saúde está respondendo corretamente.${NC}"
  else
    echo -e "${RED}API de saúde está com problemas. Resposta: $HEALTH_STATUS${NC}"
  fi
fi
echo ""

# Verificar banco de dados PostgreSQL
echo -e "${YELLOW}Verificando conexão com PostgreSQL:${NC}"
PG_CONTAINER=$(docker compose ps -q postgres)
if [ -z "$PG_CONTAINER" ]; then
  echo -e "${RED}Container PostgreSQL não está em execução.${NC}"
else
  # Obter status do PostgreSQL
  PG_STATUS=$(docker exec $PG_CONTAINER pg_isready -U postgres 2>&1)
  
  if echo $PG_STATUS | grep -q "accepting connections"; then
    echo -e "${GREEN}PostgreSQL está aceitando conexões normalmente.${NC}"
  else
    echo -e "${RED}PostgreSQL tem problemas: $PG_STATUS${NC}"
  fi
fi
echo ""

# Verificar Redis
echo -e "${YELLOW}Verificando conexão com Redis:${NC}"
REDIS_CONTAINER=$(docker compose ps -q redis)
if [ -z "$REDIS_CONTAINER" ]; then
  echo -e "${RED}Container Redis não está em execução.${NC}"
else
  # Obter status do Redis
  REDIS_STATUS=$(docker exec $REDIS_CONTAINER redis-cli ping 2>&1)
  
  if [ "$REDIS_STATUS" = "PONG" ]; then
    echo -e "${GREEN}Redis está respondendo normalmente.${NC}"
  else
    echo -e "${RED}Redis tem problemas: $REDIS_STATUS${NC}"
  fi
fi
echo ""

# Verificar Traefik
echo -e "${YELLOW}Verificando Traefik:${NC}"
TRAEFIK_CONTAINER=$(docker compose ps -q traefik)
if [ -z "$TRAEFIK_CONTAINER" ]; then
  echo -e "${RED}Container Traefik não está em execução.${NC}"
else
  # Verificar se o Traefik está em execução
  TRAEFIK_STATUS=$(docker exec $TRAEFIK_CONTAINER wget -q -O - http://localhost:8080/api/version 2>/dev/null || echo '{"error":"failed"}')
  
  if ! echo $TRAEFIK_STATUS | grep -q "error"; then
    echo -e "${GREEN}Traefik está funcionando corretamente.${NC}"
  else
    echo -e "${RED}Traefik tem problemas: $TRAEFIK_STATUS${NC}"
  fi
fi

# Verificar uso de recursos
echo -e "${YELLOW}Uso de recursos:${NC}"
docker stats --no-stream $(docker compose ps -q)

echo ""
echo -e "${YELLOW}=== Verificação de saúde concluída ===${NC}"
echo ""
echo -e "Para mais detalhes, verifique os logs completos com: ${GREEN}docker compose logs${NC}" 