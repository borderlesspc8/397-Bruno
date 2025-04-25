#!/bin/bash

# Script para configurar as branches para o primeiro lançamento
# Foco: Indicadores da rota de dashboard

echo "=== Configurando branches para o primeiro lançamento do Conta Rápida ==="
echo "Foco: Indicadores da rota de dashboard"
echo ""

# Verificar se git está instalado
if ! command -v git &> /dev/null; then
    echo "Erro: Git não está instalado."
    exit 1
fi

# Verificar se estamos em um repositório git
if [ ! -d .git ]; then
    echo "Erro: Este diretório não é um repositório git."
    exit 1
fi

# Verificar se há mudanças não commitadas
if ! git diff-index --quiet HEAD --; then
    echo "Erro: Existem mudanças não commitadas. Faça commit ou stash antes de executar este script."
    exit 1
fi

# Criar branch develop se não existir
if ! git show-ref --verify --quiet refs/heads/develop; then
    echo "Criando branch develop a partir da branch atual..."
    git branch develop
    echo "Branch develop criada."
else
    echo "Branch develop já existe."
fi

# Mudar para a branch develop
echo "Mudando para a branch develop..."
git checkout develop

# Criar as branches de feature
echo "Criando branches de feature para o primeiro lançamento..."

FEATURES=(
    "dashboard-indicadores-base"
    "dashboard-vendedores"
    "dashboard-produtos"
    "dashboard-ui-melhorias"
)

for feature in "${FEATURES[@]}"; do
    if ! git show-ref --verify --quiet refs/heads/feature/$feature; then
        echo "Criando branch feature/$feature..."
        git checkout -b feature/$feature develop
        git checkout develop
        echo "Branch feature/$feature criada."
    else
        echo "Branch feature/$feature já existe."
    fi
done

# Criar branch de release
if ! git show-ref --verify --quiet refs/heads/release/0.1.0; then
    echo "Criando branch release/0.1.0..."
    git checkout -b release/0.1.0 develop
    git checkout develop
    echo "Branch release/0.1.0 criada."
else
    echo "Branch release/0.1.0 já existe."
fi

echo ""
echo "=== Configuração de branches concluída ==="
echo ""
echo "Branches disponíveis:"
echo "- main (produção)"
echo "- develop (desenvolvimento)"
for feature in "${FEATURES[@]}"; do
    echo "- feature/$feature"
done
echo "- release/0.1.0"
echo ""
echo "Para iniciar o desenvolvimento, faça checkout para a branch de feature desejada:"
echo "  git checkout feature/dashboard-indicadores-base"
echo ""
echo "Após concluir o desenvolvimento, crie um Pull Request para a branch develop." 