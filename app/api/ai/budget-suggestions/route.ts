import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { getGroqClient } from "@/app/_lib/groq";
import { startOfMonth, endOfMonth } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Obter os dados do corpo da requisição
    const body = await request.json();
    const { transactions, month } = body;

    // Verificar se foram fornecidas transações
    if (
      !transactions ||
      !Array.isArray(transactions) ||
      transactions.length === 0
    ) {
      // Se não houver transações fornecidas, tentamos buscar direto do banco de dados
      try {
        const userId = session.user.id;

        // Calcular o intervalo de datas para o mês
        const [year, monthNum] = month.split("-").map(Number);
        const startDate = startOfMonth(new Date(year, monthNum - 1));
        const endDate = endOfMonth(new Date(year, monthNum - 1));

        // Buscar transações do usuário
        const userTransactions = await prisma.transaction.findMany({
          where: {
            userId,
            date: {
              gte: startDate,
              lte: endDate,
            },
            type: "EXPENSE", // Focar apenas em despesas para orçamento
          },
          select: {
            amount: true,
            category: true,
            date: true,
            description: true,
          },
          orderBy: {
            date: "desc",
          },
        });

        if (userTransactions.length === 0) {
          return NextResponse.json(
            {
              error:
                "Sem transações suficientes para gerar sugestões de orçamento",
            },
            { status: 400 },
          );
        }

        // Substituir as transações da requisição pelas do banco
        body.transactions = userTransactions;
      } catch (error) {
        console.error("Erro ao buscar transações do usuário:", error);
        return NextResponse.json(
          { error: "Erro ao buscar transações para análise" },
          { status: 500 },
        );
      }
    }

    // Analisar os gastos por categoria
    const categorySums = new Map<string, number>();
    const categoryCounts = new Map<string, number>();

    for (const transaction of body.transactions) {
      if (transaction.type === "EXPENSE" || !transaction.type) {
        const category = transaction.category || "Outros";
        const amount = Math.abs(parseFloat(transaction.amount.toString()));

        categorySums.set(category, (categorySums.get(category) || 0) + amount);

        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      }
    }

    // Preparar os dados para a IA
    const expensesByCategory = Array.from(categorySums.entries()).map(
      ([category, total]) => ({
        category,
        total,
        count: categoryCounts.get(category) || 0,
        average: total / (categoryCounts.get(category) || 1),
      }),
    );

    // Ordenar por total gasto (maior para o menor)
    expensesByCategory.sort((a, b) => b.total - a.total);

    // Calcular total geral de gastos
    const totalExpenses = expensesByCategory.reduce(
      (sum, item) => sum + item.total,
      0,
    );

    // Preparar contexto para a IA
    const transactionData = {
      totalExpenses,
      totalTransactions: body.transactions.length,
      expensesByCategory,
      month,
    };

    // Usar a IA para gerar sugestões de orçamentos
    const prompt = `
Você é um analista financeiro especializado em orçamentos pessoais. 
Analise os seguintes dados de transações e gastos do usuário:

${JSON.stringify(transactionData, null, 2)}

Com base nesses dados, sugira categorias de orçamento com valores mensais realistas.
Para cada categoria, leve em consideração:
1. O padrão atual de gastos
2. Boas práticas financeiras (como a regra 50-30-20)
3. Possibilidades de economia

Responda somente com um JSON no seguinte formato:
{
  "suggestions": [
    {
      "category": "Nome da Categoria",
      "currentSpent": valor_atual_gasto,
      "suggestedAmount": valor_sugerido_para_orçamento,
      "reasoning": "Breve explicação da sugestão"
    },
    ...
  ]
}

Inclua pelo menos 5 categorias e no máximo 8 categorias. Não inclua nenhum texto explicativo fora do JSON.
`;

    try {
      const client = getGroqClient();
      const completion = await client.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content:
              "Você é um assistente de finanças pessoais especializado em análise de gastos e orçamentos.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      // Processar a resposta da IA
      let suggestionsData = { suggestions: [] };
      const content = completion.choices[0]?.message?.content || "";

      if (content) {
        suggestionsData = JSON.parse(content);
      } else {
        throw new Error("Formato de resposta inválido");
      }

      // Retornar as sugestões
      return NextResponse.json(suggestionsData);
    } catch (error) {
      console.error("Erro ao processar resposta da IA:", error);
      return NextResponse.json(
        { error: "Não foi possível processar as sugestões de orçamento" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Erro ao gerar sugestões de orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao processar a requisição de sugestões de orçamento" },
      { status: 500 },
    );
  }
}
