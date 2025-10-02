#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lista de arquivos que ainda usam NextAuth e precisam ser corrigidos
const filesToFix = [
  'app/api/admin/users/[userId]/status/route.ts',
  'app/api/admin/users/[userId]/subscription/route.ts',
  'app/api/auth/reset-password/route.ts'
];

// Função para corrigir um arquivo
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Substituir imports do NextAuth por Supabase
    content = content.replace(
      /import { getToken } from "next-auth\/jwt";/g,
      'import { createClient } from "@/app/_lib/supabase-server";'
    );
    
    content = content.replace(
      /import { getServerSession } from "next-auth";/g,
      'import { createClient } from "@/app/_lib/supabase-server";'
    );
    
    content = content.replace(
      /import { authOptions } from "@/app\/_lib\/auth-options";/g,
      ''
    );
    
    // Substituir lógica de autenticação
    content = content.replace(
      /const token = await getToken\(\{[\s\S]*?\}\);/g,
      `const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();`
    );
    
    content = content.replace(
      /if \(!token\) \{/g,
      'if (error || !user) {'
    );
    
    content = content.replace(
      /token\?\.email/g,
      'user.email'
    );
    
    content = content.replace(
      /token\?\.id/g,
      'user.id'
    );
    
    // Substituir getServerSession por Supabase
    content = content.replace(
      /const session = await getServerSession\(authOptions\);/g,
      `const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();`
    );
    
    content = content.replace(
      /if \(!session\?\.user\?\.id\) \{/g,
      'if (error || !user) {'
    );
    
    content = content.replace(
      /session\.user\.id/g,
      'user.id'
    );
    
    content = content.replace(
      /session\.user\.email/g,
      'user.email'
    );
    
    // Remover imports do bcryptjs se existirem
    content = content.replace(
      /import bcrypt from "bcryptjs";/g,
      '// bcrypt removido - Supabase Auth cuida da criptografia'
    );
    
    // Escrever o arquivo corrigido
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corrigido: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Erro ao corrigir ${filePath}:`, error.message);
  }
}

// Executar correções
console.log('🔧 Corrigindo arquivos que usam NextAuth...\n');

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    fixFile(fullPath);
  } else {
    console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
  }
});

console.log('\n✅ Correções concluídas!');
