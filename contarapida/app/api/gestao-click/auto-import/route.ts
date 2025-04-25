  // Verificar se as vendas já existem no banco de dados
  // Construindo uma query IN com valores únicos separados por vírgula
  const saleIdsArray = sales.map((sale: any) => sale.id.toString());
  
  // Primeiro, vamos usar uma abordagem diferente para evitar o erro de tipo
  let existingSales: any[] = [];
  
  if (saleIdsArray.length > 0) {
    // Converter array para string formatada para consulta SQL com IN
    const placeholders = saleIdsArray.map((_: string, index: number) => `$${index + 2}`).join(', ');

    if (saleIds.length > 0) {
      // Converter array para string formatada para consulta SQL com IN
      const placeholders = saleIds.map((_: string, index: number) => `$${index + 2}`).join(', ');
    }
  } 