import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/_lib/auth';
import { fetchBankData, importBankTransactions } from '@/app/_services/bank-import-service';
import { format, parse } from 'date-fns';

/**
 * Formata a data para o padrão YYYY-MM-DD
 */
function formatDateForStorage(dateStr: string): string {
  try {
    // Se já estiver no formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Se estiver no formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const date = parse(dateStr, 'dd/MM/yyyy', new Date());
      return format(date, 'yyyy-MM-dd');
    }

    // Se estiver no formato DDMMYYYY
    if (/^\d{8}$/.test(dateStr)) {
      const day = dateStr.substring(0, 2);
      const month = dateStr.substring(2, 4);
      const year = dateStr.substring(4, 8);
      return `${year}-${month}-${day}`;
    }

    throw new Error(`Formato de data inválido: ${dateStr}`);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    throw new Error(`Formato de data inválido: ${dateStr}`);
  }
}

/**
 * POST /api/bank-import
 * Endpoint para importar transações bancárias
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter dados da requisição
    const data = await request.json();
    const { startDate, endDate, walletId } = data;

    // Validar dados de entrada
    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          error: 'Dados incompletos',
          message: 'Datas de início e fim são obrigatórias'
        },
        { status: 400 }
      );
    }

    // Formatar datas para armazenamento
    const formattedStartDate = formatDateForStorage(startDate);
    const formattedEndDate = formatDateForStorage(endDate);


    const bankData = await fetchBankData(startDate, endDate);
    console.log('Dados bancários recebidos:', {
      hasData: !!bankData,
      isArray: Array.isArray(bankData),
      dataType: typeof bankData
    });

    // Importar transações
    const result = await importBankTransactions(bankData, {
      userId: session.user.id,
      walletId,
      startDate: formattedStartDate,
      endDate: formattedEndDate
    });


    return NextResponse.json({
      success: true,
      message: `${result.totalProcessed} transações importadas com sucesso`,
      details: {
        processadas: result.totalProcessed,
        ignoradas: result.skipped,
        erros: result.errors,
        periodo: {
          inicio: formattedStartDate,
          fim: formattedEndDate
        }
      }
    });
  } catch (error: any) {
    console.error('Erro na importação de transações:', error);
    
    return NextResponse.json(
      {
        error: 'Falha na importação',
        message: error.message,
        details: error.stack
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bank-import
 * Endpoint para verificar status do serviço de importação
 */
export async function GET() {
  try {
    return NextResponse.json({
      status: 'online',
      message: 'Serviço de importação disponível'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Serviço indisponível' },
      { status: 503 }
    );
  }
} 