import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Você precisará adicionar esta chave no .env

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createVendorUser() {
  try {
    console.log('🚀 Criando usuário vendedor...');
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash('Vendedor231719', 12);
    
    // Dados do usuário vendedor
    const vendorUser = {
      email: 'vendedorpersonalprime@gmail.com',
      password: hashedPassword,
      name: 'Vendedor Personal Prime',
      role: 'vendor', // Role específico para vendedores
      auth_provider: 'EMAIL',
      is_onboarded: true,
      is_terms_accepted: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    };

    // Inserir usuário na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([vendorUser])
      .select()
      .single();

    if (userError) {
      console.error('❌ Erro ao criar usuário:', userError);
      return;
    }

    console.log('✅ Usuário vendedor criado com sucesso!');
    console.log('📧 Email:', vendorUser.email);
    console.log('🔑 Role:', vendorUser.role);
    console.log('🆔 ID:', userData.id);

    // Criar registro na tabela vendedores
    const vendedorData = {
      nome: 'Vendedor Personal Prime',
      email: 'vendedorpersonalprime@gmail.com',
      user_id: userData.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: vendedorResult, error: vendedorError } = await supabase
      .from('vendedores')
      .insert([vendedorData])
      .select()
      .single();

    if (vendedorError) {
      console.error('❌ Erro ao criar registro de vendedor:', vendedorError);
      return;
    }

    console.log('✅ Registro de vendedor criado com sucesso!');
    console.log('🆔 Vendedor ID:', vendedorResult.id);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
createVendorUser();
