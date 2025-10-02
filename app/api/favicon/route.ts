import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const faviconPath = join(process.cwd(), 'public', 'favicon.ico');
    const faviconBuffer = await readFile(faviconPath);
    
    return new NextResponse(faviconBuffer, {
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Erro ao servir favicon:', error);
    return new NextResponse('Favicon não encontrado', { status: 404 });
  }
}
