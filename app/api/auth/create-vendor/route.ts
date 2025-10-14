import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/_lib/supabase-server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    console.log('🚀 Criando usuário vendedor...');
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash('Vendedor231719', 12);
    
    // Verificar se o usuário já existe
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'vendedorpersonalprime@gmail.com')
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('Erro ao buscar usuário:', findError);
      return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 });
    }

    if (existingUser) {
      console.log('⚠️ Usuário já existe. Atualizando role para vendor...');
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          role: 'vendor',
          password: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('email', 'vendedorpersonalprime@gmail.com')
        .select()
        .single();

      if (updateError) {
        console.error('Erro ao atualizar usuário:', updateError);
        return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
      }

      console.log('✅ Usuário atualizado com sucesso!');
      console.log('📧 Email:', updatedUser.email);
      console.log('🔑 Role:', updatedUser.role);
      console.log('🆔 ID:', updatedUser.id);

      // Verificar se já existe registro na tabela vendedores
      const { data: existingVendedor } = await supabase
        .from('vendedores')
        .select('id')
        .eq('user_id', updatedUser.id)
        .single();

      if (!existingVendedor) {
        // Criar registro na tabela vendedores
        const { data: vendedorData, error: vendedorError } = await supabase
          .from('vendedores')
          .insert({
            nome: 'Vendedor Personal Prime',
            email: 'vendedorpersonalprime@gmail.com',
            user_id: updatedUser.id,
          })
          .select()
          .single();

        if (vendedorError) {
          console.error('Erro ao criar vendedor:', vendedorError);
          return NextResponse.json({ error: 'Erro ao criar vendedor' }, { status: 500 });
        }

        console.log('✅ Registro de vendedor criado com sucesso!');
        console.log('🆔 Vendedor ID:', vendedorData.id);
      } else {
        console.log('ℹ️ Registro de vendedor já existe');
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Usuário vendedor atualizado com sucesso!',
        user: updatedUser
      });

    } else {
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
        console.error('Erro ao criar usuário:', userError);
        return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
      }

      console.log('✅ Usuário vendedor criado com sucesso!');
      console.log('📧 Email:', vendorUser.email);
      console.log('🔑 Role:', vendorUser.role);
      console.log('🆔 ID:', userData.id);

      // Criar registro na tabela vendedores
      const { data: vendedorData, error: vendedorError } = await supabase
        .from('vendedores')
        .insert({
          nome: 'Vendedor Personal Prime',
          email: 'vendedorpersonalprime@gmail.com',
          user_id: userData.id,
        })
        .select()
        .single();

      if (vendedorError) {
        console.error('Erro ao criar vendedor:', vendedorError);
        return NextResponse.json({ error: 'Erro ao criar vendedor' }, { status: 500 });
      }

      console.log('✅ Registro de vendedor criado com sucesso!');
      console.log('🆔 Vendedor ID:', vendedorData.id);

      return NextResponse.json({ 
        success: true, 
        message: 'Usuário vendedor criado com sucesso!',
        user: userData,
        vendedor: vendedorData
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
