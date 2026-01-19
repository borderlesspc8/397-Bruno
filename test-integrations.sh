#!/bin/bash

# Script para Testar Integrações KOMMO + Gestão Click
# Uso: bash test-integrations.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL base da aplicação
BASE_URL="${BASE_URL:-http://localhost:3000}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Teste de Integrações - KOMMO + GC   ${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Função para printar resultado
print_result() {
  local test_name=$1
  local success=$2
  local message=$3
  
  if [ "$success" = "true" ]; then
    echo -e "${GREEN}✅ $test_name${NC}"
    if [ -n "$message" ]; then
      echo -e "   $message"
    fi
  else
    echo -e "${RED}❌ $test_name${NC}"
    if [ -n "$message" ]; then
      echo -e "   Erro: $message"
    fi
  fi
}

# ===================================
# TESTE 1: Gestão Click
# ===================================
echo -e "${YELLOW}1. Testando Gestão Click...${NC}\n"

GESTAO_RESPONSE=$(curl -s -X POST "$BASE_URL/api/gestao-click/test-connection" \
  -H "Content-Type: application/json" \
  -d '{
    "useEnvCredentials": true
  }')

if echo "$GESTAO_RESPONSE" | grep -q '"success":true'; then
  print_result "Conexão Gestão Click" "true" "API respondendo corretamente"
  echo "$GESTAO_RESPONSE" | jq '.' 2>/dev/null || echo "$GESTAO_RESPONSE"
else
  print_result "Conexão Gestão Click" "false" "API não respondeu com sucesso"
  echo "$GESTAO_RESPONSE" | jq '.' 2>/dev/null || echo "$GESTAO_RESPONSE"
fi

echo ""

# ===================================
# TESTE 2: KOMMO - Test Connection
# ===================================
echo -e "${YELLOW}2. Testando KOMMO CRM...${NC}\n"

KOMMO_RESPONSE=$(curl -s -X POST "$BASE_URL/api/kommo/test-connection" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user"
  }')

if echo "$KOMMO_RESPONSE" | grep -q '"success":true'; then
  print_result "Conexão KOMMO" "true" "JWT validado com sucesso"
  
  # Extrair informações da conta
  ACCOUNT_ID=$(echo "$KOMMO_RESPONSE" | jq -r '.account.accountId // "N/A"')
  BASE_DOMAIN=$(echo "$KOMMO_RESPONSE" | jq -r '.account.baseDomain // "N/A"')
  EXPIRES=$(echo "$KOMMO_RESPONSE" | jq -r '.account.expiresAt // "N/A"')
  
  echo -e "   Account ID: ${BLUE}$ACCOUNT_ID${NC}"
  echo -e "   Domínio: ${BLUE}$BASE_DOMAIN${NC}"
  echo -e "   Expira em: ${BLUE}$EXPIRES${NC}"
else
  print_result "Conexão KOMMO" "false" "JWT não foi fornecido ou é inválido"
  echo "$KOMMO_RESPONSE" | jq '.' 2>/dev/null || echo "$KOMMO_RESPONSE"
fi

echo ""

# ===================================
# TESTE 3: KOMMO - Get Contacts
# ===================================
echo -e "${YELLOW}3. Buscando Contatos KOMMO...${NC}\n"

CONTACTS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/kommo/contacts?page=1&limit=5" \
  -H "Content-Type: application/json")

if echo "$CONTACTS_RESPONSE" | grep -q '"success":true'; then
  COUNT=$(echo "$CONTACTS_RESPONSE" | jq '.data | length')
  print_result "Listagem de Contatos" "true" "$COUNT contatos obtidos"
  echo "$CONTACTS_RESPONSE" | jq '.data[0:2]' 2>/dev/null || true
else
  print_result "Listagem de Contatos" "false" "Erro ao obter contatos"
fi

echo ""

# ===================================
# TESTE 4: KOMMO - Get Deals
# ===================================
echo -e "${YELLOW}4. Buscando Negociações KOMMO...${NC}\n"

DEALS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/kommo/deals?page=1&limit=5" \
  -H "Content-Type: application/json")

if echo "$DEALS_RESPONSE" | grep -q '"success":true'; then
  COUNT=$(echo "$DEALS_RESPONSE" | jq '.data | length')
  print_result "Listagem de Negociações" "true" "$COUNT negociações obtidas"
  echo "$DEALS_RESPONSE" | jq '.data[0:2]' 2>/dev/null || true
else
  print_result "Listagem de Negociações" "false" "Erro ao obter negociações"
fi

echo ""

# ===================================
# TESTE 5: KOMMO - Sync Status
# ===================================
echo -e "${YELLOW}5. Verificando Status de Sincronização...${NC}\n"

SYNC_STATUS=$(curl -s -X GET "$BASE_URL/api/kommo/sync?userId=test-user" \
  -H "Content-Type: application/json")

if echo "$SYNC_STATUS" | grep -q '"success":true'; then
  if echo "$SYNC_STATUS" | grep -q '"data":null'; then
    print_result "Status Sincronização" "true" "Nenhuma sincronização anterior"
  else
    LAST_SYNC=$(echo "$SYNC_STATUS" | jq -r '.data.lastSync // "N/A"')
    CONTACTS=$(echo "$SYNC_STATUS" | jq -r '.data.contactsCount // 0')
    DEALS=$(echo "$SYNC_STATUS" | jq -r '.data.dealsCount // 0')
    print_result "Status Sincronização" "true" "Última sincronização: $LAST_SYNC"
    echo -e "   Contatos: ${BLUE}$CONTACTS${NC}"
    echo -e "   Negociações: ${BLUE}$DEALS${NC}"
  fi
else
  print_result "Status Sincronização" "false" "Erro ao obter status"
fi

echo ""

# ===================================
# RESUMO FINAL
# ===================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Testes Concluídos                    ${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Verifique o arquivo .env.local para credenciais"
echo "2. Configure KOMMO_JWT_TOKEN com seu token"
echo "3. Configure GESTAO_CLICK_* com suas credenciais"
echo "4. Execute este script novamente para validar"
echo ""

echo -e "${YELLOW}Documentação:${NC}"
echo "- SETUP-INTEGRACTIONS.md (guia de configuração)"
echo "- docs/integracao/kommo-crm-integration.md (detalhes KOMMO)"
echo "- docs/integracao/gestao-click-integration.md (detalhes GC)"
echo "- IMPLEMENTATION-SUMMARY.md (resumo)"
echo ""
