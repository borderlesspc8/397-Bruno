#!/bin/bash

# Lista de arquivos com erros de import
files=(
  "app/api/gestao-click/test-connection/route.ts"
  "app/api/gestao-click/run-scheduled-sync/route.ts"
  "app/api/goals/route.ts"
  "app/api/goals/[id]/contribute/route.ts"
  "app/api/notifications/route.ts"
  "app/api/notifications/[id]/route.ts"
)

echo "🔧 Corrigindo erros de import..."

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Corrigindo: $file"
    
    # Remover linha com 'import { ";'
    sed -i '' '/^import { ";$/d' "$file"
    
    # Corrigir imports malformados
    sed -i '' 's/import { validateSessionForAPI from "@\/app\/_utils\/auth"'\'';/import { createClient } from "@\/app\/_lib\/supabase-server";/' "$file"
    
    echo "✅ Corrigido: $file"
  else
    echo "⚠️ Arquivo não encontrado: $file"
  fi
done

echo "✅ Correções concluídas!"
