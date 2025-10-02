import { NextRequest, NextResponse } from 'next/server';
import { validateSessionForAPI from "@/app/_utils/auth"';
import { ';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação do usuário
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const vendedorId = params.id;
    
    // Este endpoint serve apenas para fornecer URLs para imagens de vendedores
    // Numa implementação real, aqui seria consultado um banco de dados para obter
    // a URL da imagem específica do vendedor.
    
    // Como implementação temporária, vamos retornar um avatar padrão
    // Em um ambiente de produção, poderia buscar de um serviço de armazenamento como S3, Firebase, etc.
    
    // Hash do ID para diversificar as imagens (não repetir exatamente a mesma para todos)
    const hash = Array.from(vendedorId).reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    // Variar cores com base no hash para dar alguma diversidade visual
    const cor = hash % 5; // 5 variantes de cores
    
    // Construir URL para avatares estáticos ou gerados
    let imageUrl = '/images/default-avatar.svg';
    
    // Opcionalmente, podemos usar serviços de geração de avatares como UI Avatars
    if (process.env.USE_GENERATED_AVATARS === 'true') {
      // Pegar duas primeiras letras do ID como iniciais
      const iniciais = vendedorId.substring(0, 2).toUpperCase();
      imageUrl = `https://ui-avatars.com/api/?name=${iniciais}&background=${getColor(cor)}&color=fff&size=200`;
    }
    
    return NextResponse.json({ 
      imageUrl,
      vendedorId 
    });
  } catch (error) {
    console.error('Erro ao buscar imagem do vendedor:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Erro ao processar a solicitação' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Função auxiliar para gerar cores hexadecimais
function getColor(index: number): string {
  const colors = [
    '5271FF', // Azul
    'FF914D', // Laranja
    '7A36B1', // Roxo
    '4CAF50', // Verde
    'E91E63'  // Rosa
  ];
  
  return colors[index % colors.length];
} 
