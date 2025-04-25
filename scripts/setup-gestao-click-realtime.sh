#!/bin/bash
# Script para configurar a integração em tempo real com o Gestão Click
# Este script centraliza todo o processo em um único comando

# Verificar argumentos de linha de comando
AUTO_MODE=false
if [[ "$1" == "--auto" || "$1" == "-a" || "$1" == "--force" || "$1" == "-f" ]]; then
    AUTO_MODE=true
fi

echo "🚀 Iniciando configuração da integração em tempo real com o Gestão Click"
echo ""
echo "⚠️  AVISO: Este processo irá limpar o banco de dados e configurar a integração em tempo real."
echo "⚠️  É altamente recomendado fazer um backup do banco de dados antes de continuar."
echo ""

# Perguntar se deseja continuar se não estiver em modo automático
if [ "$AUTO_MODE" = false ]; then
    read -p "Deseja continuar com a configuração? (S/N): " resposta
    if [[ ! "$resposta" =~ ^[Ss]$ ]]; then
        echo "❌ Operação cancelada pelo usuário."
        exit 0
    fi
else
    echo "🔄 Executando em modo automático..."
fi

# Verificar ambiente Node.js
echo ""
echo "🔍 Verificando ambiente Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js antes de continuar."
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo "❌ NPX não encontrado. Por favor, instale o Node.js com NPM antes de continuar."
    exit 1
fi

# Verificar se os scripts necessários existem
echo "🔍 Verificando scripts necessários..."
# Verificar primeiramente a versão JavaScript
if [ -f "scripts/clean-database.js" ]; then
    USE_JS_VERSION=true
    echo "✅ Versão JavaScript do script de limpeza encontrada."
# Se não encontrar, verificar a versão TypeScript
elif [ -f "scripts/clean-database.ts" ]; then
    USE_JS_VERSION=false
    echo "✅ Versão TypeScript do script de limpeza encontrada."
    
    # Verificar se o ts-node está instalado globalmente ou localmente
    echo "🔍 Verificando se o ts-node está instalado..."
    if ! command -v ts-node &> /dev/null && ! [ -f "node_modules/.bin/ts-node" ]; then
        echo "⚠️  ts-node não encontrado, instalando..."
        npm install -g ts-node typescript
        if [ $? -ne 0 ]; then
            echo "⚠️  Não foi possível instalar o ts-node globalmente, tentando instalar localmente..."
            npm install --save-dev ts-node typescript
            if [ $? -ne 0 ]; then
                echo "❌ Erro ao instalar ts-node. Por favor, instale manualmente com 'npm install -g ts-node typescript'."
                exit 1
            fi
        fi
    fi
else
    echo "❌ Script de limpeza de banco de dados não encontrado."
    exit 1
fi

if [ ! -f "scripts/setup-realtime-integration.js" ]; then
    echo "❌ Script de configuração de integração em tempo real não encontrado."
    exit 1
fi

echo "✅ Ambiente verificado com sucesso."
echo ""

# Executar backup do banco de dados (se o usuário desejar)
if [ "$AUTO_MODE" = false ]; then
    echo "📦 Deseja fazer um backup do banco de dados antes de continuar?"
    read -p "Criar backup? (S/N): " resposta_backup
    if [[ "$resposta_backup" =~ ^[Ss]$ ]]; then
        DO_BACKUP=true
    else
        DO_BACKUP=false
    fi
else
    # Em modo automático, sempre faz backup
    DO_BACKUP=true
fi

if [ "$DO_BACKUP" = true ]; then
    echo "📦 Criando backup do banco de dados..."
    
    # Criar diretório de backups se não existir
    mkdir -p backups
    
    # Nome do arquivo de backup com timestamp
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="backups/database_backup_${timestamp}.sql"
    
    # Obter credenciais do banco do arquivo .env
    if [ -f ".env" ]; then
        # Extrair informações do banco de dados do .env
        db_url=$(grep DATABASE_URL .env | cut -d '=' -f2)
        
        if [[ $db_url == postgresql://* ]]; then
            # Extrair informações da URL
            db_user=$(echo $db_url | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
            db_pass=$(echo $db_url | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
            db_host=$(echo $db_url | sed -n 's/.*@\([^:]*\):.*/\1/p')
            db_port=$(echo $db_url | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
            db_name=$(echo $db_url | sed -n 's/.*\/\([^?]*\).*/\1/p')
            
            # Executar backup usando pg_dump
            PGPASSWORD="$db_pass" pg_dump -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -F p > "$backup_file"
            
            if [ $? -eq 0 ]; then
                echo "✅ Backup criado com sucesso: $backup_file"
            else
                echo "❌ Falha ao criar backup. Continuando mesmo assim..."
            fi
        else
            echo "❌ Formato da URL do banco de dados não reconhecido. Pulando backup."
        fi
    else
        echo "❌ Arquivo .env não encontrado. Impossível criar backup automaticamente."
        echo "⚠️  Recomendamos criar um backup manualmente antes de continuar."
        
        if [ "$AUTO_MODE" = false ]; then
            read -p "Deseja continuar mesmo sem backup? (S/N): " continuar_sem_backup
            if [[ ! "$continuar_sem_backup" =~ ^[Ss]$ ]]; then
                echo "❌ Operação cancelada pelo usuário."
                exit 0
            fi
        else
            echo "⚠️  Continuando em modo automático sem backup."
        fi
    fi
fi

echo ""
echo "🧹 Iniciando limpeza do banco de dados..."

# Executar o script de limpeza, preferindo a versão JavaScript se disponível
if [ "$USE_JS_VERSION" = true ]; then
    # Usar a versão JavaScript, passando o argumento de modo automático se necessário
    if [ "$AUTO_MODE" = true ]; then
        node scripts/clean-database.js --auto
    else
        node scripts/clean-database.js
    fi
    
    # Verificar se a limpeza foi bem-sucedida
    if [ $? -ne 0 ]; then
        echo "❌ Falha na limpeza do banco de dados usando a versão JavaScript."
        exit 1
    fi
else
    # Usar a versão TypeScript
    if [ "$AUTO_MODE" = true ]; then
        # No modo automático, é melhor tentar gerar um JS e executar com --auto
        echo "⚙️  Compilando TypeScript para JavaScript temporário..."
        if command -v tsc &> /dev/null; then
            tsc scripts/clean-database.ts --outDir ./temp_js
        elif [ -f "node_modules/.bin/tsc" ]; then
            ./node_modules/.bin/tsc scripts/clean-database.ts --outDir ./temp_js
        else
            npx --no-install tsc scripts/clean-database.ts --outDir ./temp_js
        fi
        
        if [ -f "temp_js/scripts/clean-database.js" ]; then
            echo "🔄 Executando versão JavaScript compilada em modo automático..."
            node temp_js/scripts/clean-database.js --auto
            clean_result=$?
            rm -rf temp_js
            
            if [ $clean_result -ne 0 ]; then
                echo "❌ Falha na limpeza do banco de dados."
                exit 1
            fi
        else
            # Se não conseguir compilar, tenta o ts-node diretamente
            echo "⚠️  Não foi possível compilar. Tentando execução direta com ts-node..."
            
            if command -v ts-node &> /dev/null; then
                ts-node scripts/clean-database.ts
            elif [ -f "node_modules/.bin/ts-node" ]; then
                ./node_modules/.bin/ts-node scripts/clean-database.ts
            else
                npx --no-install ts-node scripts/clean-database.ts
            fi
            
            if [ $? -ne 0 ]; then
                echo "❌ Falha na limpeza do banco de dados."
                exit 1
            fi
        fi
    else
        # Modo interativo normal
        if command -v ts-node &> /dev/null; then
            ts-node scripts/clean-database.ts
        elif [ -f "node_modules/.bin/ts-node" ]; then
            ./node_modules/.bin/ts-node scripts/clean-database.ts
        else
            npx --no-install ts-node scripts/clean-database.ts
        fi
        
        # Verificar se a limpeza foi bem-sucedida
        if [ $? -ne 0 ]; then
            echo "❌ Falha na limpeza do banco de dados."
            exit 1
        fi
    fi
fi

echo ""
echo "⚙️  Configurando integração em tempo real..."
node scripts/setup-realtime-integration.js

# Verificar se a configuração foi bem-sucedida
if [ $? -ne 0 ]; then
    echo "❌ Falha na configuração da integração em tempo real."
    exit 1
fi

echo ""
echo "🎉 Configuração concluída com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure o webhook no painel administrativo do Gestão Click"
echo "2. Reinicie o servidor da aplicação para aplicar as alterações"
echo "3. Verifique os logs do servidor para confirmar que tudo está funcionando corretamente"
echo ""
echo "📚 Para mais informações, consulte a documentação em README-REALTIME.md"

exit 0 