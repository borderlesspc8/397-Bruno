import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import sharp from 'sharp';

// Interface para dados de posicionamento da imagem
interface ImagePosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

// Diretório onde as imagens serão armazenadas
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'vendedores');

// Garantir que o diretório de uploads existe
function garantirDiretorio(dirPath: string): boolean {
  try {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      console.log(`Diretório criado: ${dirPath}`);
    }
    return true;
  } catch (error) {
    console.error(`Erro ao criar diretório ${dirPath}:`, error);
    return false;
  }
}

// Inicialização do diretório
garantirDiretorio(UPLOAD_DIR);

/**
 * Validar ID do vendedor para evitar injeção de caminho
 * @param id ID a ser validado
 * @returns ID sanitizado ou null se inválido
 */
function validarId(id: string): string | null {
  // Remover caracteres que podem ser usados para navegação em diretórios
  const idSanitizado = id.replace(/[^a-zA-Z0-9_-]/g, '');
  
  // Se o ID mudou após sanitização ou está vazio, é inválido
  if (idSanitizado !== id || !idSanitizado) {
    return null;
  }
  
  return idSanitizado;
}

/**
 * GET /api/dashboard/vendedores/[id]/imagem
 * Busca a imagem de perfil de um vendedor específico
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Garantir que o diretório existe a cada requisição GET
  garantirDiretorio(UPLOAD_DIR);
  
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Validar ID do vendedor
    const vendedorId = validarId(params.id);
    if (!vendedorId) {
      return NextResponse.json(
        { erro: 'ID de vendedor inválido' },
        { status: 400 }
      );
    }
    
    // Verificar se o vendedor existe
    // Nota: Em um ambiente real, isso seria verificado no banco de dados
    
    // Caminho para o arquivo de imagem do vendedor (PNG)
    const filename = `vendedor_${vendedorId}.png`;
    const imagePath = path.join(UPLOAD_DIR, filename);
    
    try {
      // Verificar se o arquivo existe
      await fs.access(imagePath);
      
      // Retornar a URL relativa para a imagem, com timestamp para evitar cache
      const timestamp = Date.now();
      const imageUrl = `/uploads/vendedores/${filename}?t=${timestamp}`;
      
      console.log(`GET: Imagem encontrada em formato PNG: ${imageUrl}`);
      return NextResponse.json({ url: imageUrl });
    } catch (error) {
      console.log(`GET: Imagem PNG não encontrada: ${imagePath}, tentando formatos alternativos...`);
      
      // Se o arquivo PNG não existe, tentar buscar o formato JPG legado
      const jpgPath = path.join(UPLOAD_DIR, `${vendedorId}.jpg`);
      
      try {
        await fs.access(jpgPath);
        
        // Retornar a URL relativa para a imagem JPG, com timestamp para evitar cache
        const timestamp = Date.now();
        const imageUrl = `/uploads/vendedores/${vendedorId}.jpg?t=${timestamp}`;
        
        console.log(`GET: Imagem encontrada em formato JPG: ${imageUrl}`);
        return NextResponse.json({ url: imageUrl });
      } catch {
        // Se não encontrou nem PNG nem JPG, retornar imagem padrão
        console.log(`GET: Nenhuma imagem encontrada para o vendedor ${vendedorId}`);
        return NextResponse.json({ 
          url: '/images/default-avatar.svg',
          erro: 'Imagem não encontrada para este vendedor' 
        });
      }
    }
  } catch (error) {
    console.error('Erro ao buscar imagem do vendedor:', error);
    return NextResponse.json(
      { erro: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/vendedores/[id]/imagem
 * Atualiza a imagem de perfil de um vendedor
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const posicionamentoRaw = formData.get('posicionamento') as string;

    if (!file) {
      console.error('Arquivo não fornecido');
      return NextResponse.json({ 
        error: 'Arquivo não fornecido' 
      }, { status: 400 });
    }

    // Garantir que o posicionamento é um objeto válido
    let posicionamento: any = {};
    if (posicionamentoRaw) {
      try {
        posicionamento = JSON.parse(posicionamentoRaw);
        console.log("Posicionamento recebido:", posicionamento);
      } catch (error) {
        console.error("Erro ao fazer parse do posicionamento:", error);
      }
    }

    // Informações adicionais para diagnóstico (enviadas pelo frontend)
    const imageFileInfo = posicionamento.imageFile || { name: "desconhecido", type: "desconhecido", size: 0 };
    
    console.log(`Processando imagem: ${imageFileInfo.name} (${imageFileInfo.type}, ${Math.round(imageFileInfo.size / 1024)}KB)`);

    // Processamento de imagem
    const buffer = Buffer.from(await file.arrayBuffer());
    
    try {
      // Validar o ID do vendedor
      const vendedorId = validarId(params.id);
      if (!vendedorId) {
        throw new Error('ID de vendedor inválido');
      }
      
      // Obter metadados da imagem original
      const metadata = await sharp(buffer).metadata();
      console.log(`Dimensões originais: ${metadata.width}x${metadata.height}, formato: ${metadata.format}`);

      // Definir um tamanho máximo para evitar arquivos muito grandes
      // Mantendo a proporção da imagem original
      const MAX_DIMENSION = 1200; // Tamanho máximo para qualquer dimensão
      
      // Calcular as novas dimensões preservando a proporção
      let novaLargura = metadata.width || 0;
      let novaAltura = metadata.height || 0;
      
      // Se a imagem for maior que o tamanho máximo em qualquer dimensão,
      // redimensionar mantendo a proporção
      if (novaLargura > MAX_DIMENSION || novaAltura > MAX_DIMENSION) {
        const aspectRatio = novaLargura / novaAltura;
        
        if (novaLargura > novaAltura) {
          novaLargura = MAX_DIMENSION;
          novaAltura = Math.round(MAX_DIMENSION / aspectRatio);
        } else {
          novaAltura = MAX_DIMENSION;
          novaLargura = Math.round(MAX_DIMENSION * aspectRatio);
        }
        
        console.log(`Imagem redimensionada para: ${novaLargura}x${novaAltura} (max: ${MAX_DIMENSION})`);
      } else {
        console.log(`Mantendo o tamanho original: ${novaLargura}x${novaAltura}`);
      }

      // Processar a imagem: redimensionar se necessário e otimizar
      let processedImage = sharp(buffer);
      
      // Redimensionar apenas se exceder o tamanho máximo
      if (novaLargura !== metadata.width || novaAltura !== metadata.height) {
        processedImage = processedImage.resize(novaLargura, novaAltura, {
          fit: 'inside', // Preserva a relação de aspecto
          withoutEnlargement: true // Não amplia imagens pequenas
        });
      }
      
      // Converter para PNG com boa qualidade e otimizar
      processedImage = processedImage.png({ 
        quality: 90,
        compressionLevel: 8, // Valor entre 0 (sem compressão) e 9 (máxima compressão)
        adaptiveFiltering: true, // Melhora a compressão
        palette: false // Desativa a redução de cores
      });
      
      // Gerar a imagem processada
      const processedBuffer = await processedImage.toBuffer();
      
      // Salvar no sistema de arquivos
      const filename = `vendedor_${vendedorId}.png`;
      const imagePath = path.join(process.cwd(), 'public', 'uploads', 'vendedores', filename);
      
      // Garantir que o diretório exista
      await fs.mkdir(path.dirname(imagePath), { recursive: true });
      
      // Salvar a imagem
      await fs.writeFile(imagePath, processedBuffer);
      
      return NextResponse.json(
        { 
          success: true, 
          filename: `/uploads/vendedores/${filename}`,
          timestamp: Date.now(), // Para forçar atualização de cache
          url: `/uploads/vendedores/${filename}?t=${Date.now()}`, // URL completa para facilitar uso
          message: 'Imagem processada e salva com sucesso em alta resolução'
        }, 
        { status: 200 }
      );
    } catch (error) {
      console.error('Erro no processamento da imagem:', error);
      // Tentar uma abordagem mais simples, sem transformações complexas
      try {
        console.log('Tentando processamento alternativo simplificado...');
        
        // Validar o ID do vendedor
        const vendedorId = validarId(params.id);
        if (!vendedorId) {
          throw new Error('ID de vendedor inválido');
        }
        
        // Simplesmente otimizar a imagem mantendo suas dimensões originais
        const imagemSimples = sharp(buffer)
          .png({ quality: 90 });
        
        const processedBuffer = await imagemSimples.toBuffer();
        
        // Salvar no sistema de arquivos
        const filename = `vendedor_${vendedorId}.png`;
        const imagePath = path.join(process.cwd(), 'public', 'uploads', 'vendedores', filename);
        
        await fs.mkdir(path.dirname(imagePath), { recursive: true });
        await fs.writeFile(imagePath, processedBuffer);
        
        return NextResponse.json(
          { 
            success: true, 
            filename: `/uploads/vendedores/${filename}`,
            url: `/uploads/vendedores/${filename}?t=${Date.now()}`,
            timestamp: Date.now(),
            nota: 'Usada versão simplificada do processamento',
            message: 'Imagem processada com método alternativo em alta resolução'
          }, 
          { status: 200 }
        );
      } catch (fallbackError) {
        console.error('Erro até mesmo no processamento simplificado:', fallbackError);
        return NextResponse.json(
          { 
            error: `Erro ao processar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            suggestion: 'Tente uma imagem diferente ou um posicionamento alternativo',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    return NextResponse.json(
      { error: `Erro ao processar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 500 }
    );
  }
} 