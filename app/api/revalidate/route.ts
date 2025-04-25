import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/app/_lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Extrair o caminho a ser revalidado da URL de consulta
    const path = request.nextUrl.searchParams.get("path");
    
    if (!path) {
      return NextResponse.json(
        { error: "Caminho não fornecido" },
        { status: 400 }
      );
    }

    // Revalidar o caminho especificado
    revalidatePath(path);

    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erro ao revalidar caminho:", error);
    
    return NextResponse.json(
      { error: "Erro ao processar a requisição" },
      { status: 500 }
    );
  }
} 