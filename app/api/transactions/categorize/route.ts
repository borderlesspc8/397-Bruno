import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { getAuthSession } from "@/app/_lib/auth";
import { transactionAdapter } from "@/app/_lib/types";

export async function PUT(request: NextRequest) {
  try {
    const { user } = await getAuthSession();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    
    const body = await request.json();
    const { transactionId, categoryId, category } = body;
    
    if (!transactionId) {
      return NextResponse.json({ error: "ID da transação é obrigatório" }, { status: 400 });
    }
    
    // Verificar se a transação existe e pertence ao usuário
    const transaction = await db.transaction.findUnique({
      where: {
        id: transactionId,
        userId: user.id,
      },
    });
    
    if (!transaction) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }
    
    // Atualizar a categoria da transação
    const updateData: any = {};
    
    if (categoryId) {
      // Verificar se a categoria existe
      const categoryExists = await db.category.findUnique({
        where: {
          id: categoryId,
        },
      });
      
      if (!categoryExists) {
        return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
      }
      
      // Usar a sintaxe de relacionamento do Prisma
      updateData.categoryObj = {
        connect: {
          id: categoryId
        }
      };
    }
    
    if (category) {
      updateData.category = category;
    }
    
    // Atualizar também os metadados se a transação for importada do banco
    if (transaction.metadata && typeof transaction.metadata === 'object') {
      let metadata = { ...(transaction.metadata as Record<string, any>) };
      
      if ('source' in metadata && metadata.source === "bank_import") {
        if (categoryId) {
          metadata.mappedCategoryId = categoryId;
        }
        
        if (category) {
          metadata.mappedCategory = category;
        }
        
        updateData.metadata = metadata;
      }
    }
    
    // Atualizar a transação
    const updatedTransaction = await db.transaction.update({
      where: {
        id: transactionId,
      },
      data: updateData,
      include: {
        wallet: true,
        categoryObj: true,
      },
    });
    
    return NextResponse.json({
      transaction: transactionAdapter.fromPrisma(updatedTransaction),
      message: "Categoria atualizada com sucesso",
    });
    
  } catch (error) {
    console.error('[API_ERROR]', error);
    return NextResponse.json({ error: "Erro ao categorizar transação" }, { status: 500 });
  }
} 