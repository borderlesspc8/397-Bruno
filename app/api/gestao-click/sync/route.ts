import { NextRequest, NextResponse } from "next/server";
import { BetelTecnologiaService } from "@/app/_services/betelTecnologia";

export async function POST(request: NextRequest) {
  try {
    
    const { dataInicio, dataFim, userId } = await request.json();
    
    // Validar dados obrigatórios
    if (!userId || userId.trim() === '') {
      return NextResponse.json({ 
        error: "UserId é obrigatório e não pode estar vazio",
        details: "Verifique se o usuário está autenticado corretamente"
      }, { status: 400 });
    }
    
    
    // Nota: A validação de autenticação é feita no cliente
    // Esta API confia no userId enviado pelo cliente autenticado

    if (!dataInicio || !dataFim) {
      return NextResponse.json(
        { error: "Data de início e fim são obrigatórias" },
        { status: 400 }
      );
    }

    // Buscar vendas
    const vendasData = await BetelTecnologiaService.buscarVendas({
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim)
    });

    // Buscar vendedores
    const vendedoresData = await BetelTecnologiaService.buscarVendedores({
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim)
    });

    // Buscar produtos
    const produtosData = await BetelTecnologiaService.buscarProdutosVendidos({
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim)
    });

    return NextResponse.json({
      vendas: vendasData.vendas || [],
      totalVendas: vendasData.totalVendas || 0,
      totalValor: vendasData.totalValor || 0,
      vendedores: vendedoresData.vendedores || [],
      produtos: produtosData.produtos || [],
      erro: vendasData.erro || vendedoresData.erro || produtosData.erro
    });

  } catch (error) {
    console.error("Erro na sincronização:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
