# 🎓 Guia Prático de Uso - Sistema de Relatórios CEO

## 📚 Exemplos Práticos Passo a Passo

### 🚀 Exemplo 1: Exportar Relatório Executivo em PDF

```typescript
import { 
  ceoPDFGenerator, 
  ceoReportTemplates 
} from '@/app/(auth-routes)/dashboard-ceo/services';
import type { CEOReportData } from '@/app/(auth-routes)/dashboard-ceo/types/report-types';

async function exportarRelatorioExecutivoPDF() {
  // 1. Obter template executivo
  const template = ceoReportTemplates.getDefaultTemplateForType('executive');
  
  // 2. Preparar dados do relatório
  const reportData: CEOReportData = {
    config: {
      name: 'Relatório Executivo - Novembro 2024',
      description: 'Análise completa do desempenho do mês',
      type: 'executive',
      format: 'pdf',
      startDate: new Date('2024-11-01'),
      endDate: new Date('2024-11-30'),
      sections: template?.defaultSections || {
        summary: true,
        financialMetrics: true,
        operationalMetrics: true,
        commercialMetrics: true,
        charts: true,
        tables: true,
        analysis: true,
        recommendations: true,
      },
      template: template?.id,
      colors: template?.styles,
      createdBy: 'João Silva',
    },
    period: {
      start: new Date('2024-11-01'),
      end: new Date('2024-11-30'),
      label: 'Novembro 2024',
    },
    summary: {
      totalRevenue: 2500000,
      totalOrders: 1850,
      averageTicket: 1351.35,
      profitMargin: 32.5,
      topInsights: [
        'Receita cresceu 18% em relação ao mês anterior',
        'Ticket médio aumentou 12% devido a vendas de produtos premium',
        'Margem de lucro melhorou 3.2 pontos percentuais',
        'Taxa de conversão atingiu 8.5%, melhor resultado do ano',
        'Churn rate reduziu para 2.1%, abaixo da meta de 2.5%',
      ],
    },
    financialMetrics: {
      revenue: {
        total: 2500000,
        growth: 18.5,
        trend: [1800000, 1950000, 2100000, 2300000, 2500000],
        byPaymentMethod: [
          { method: 'Cartão de Crédito', value: 1500000 },
          { method: 'PIX', value: 750000 },
          { method: 'Boleto', value: 200000 },
          { method: 'Cartão de Débito', value: 50000 },
        ],
      },
      costs: {
        total: 1687500,
        byCostCenter: [
          { center: 'Produtos', value: 1000000 },
          { center: 'Marketing', value: 250000 },
          { center: 'Operações', value: 200000 },
          { center: 'Pessoal', value: 150000 },
          { center: 'Logística', value: 87500 },
        ],
      },
      profit: {
        gross: 1500000,
        net: 812500,
        margin: 32.5,
      },
      cashFlow: {
        inflow: 2600000,
        outflow: 1750000,
        balance: 850000,
        trend: [
          { date: '2024-11-01', value: 150000 },
          { date: '2024-11-08', value: 300000 },
          { date: '2024-11-15', value: 520000 },
          { date: '2024-11-22', value: 700000 },
          { date: '2024-11-30', value: 850000 },
        ],
      },
    },
    operationalMetrics: {
      orders: {
        total: 1850,
        completed: 1758,
        cancelled: 62,
        pending: 30,
      },
      products: {
        totalSold: 8500,
        topProducts: [
          { name: 'Whey Protein Isolado 1kg', quantity: 450, revenue: 45000 },
          { name: 'Creatina Monohidratada 300g', quantity: 380, revenue: 22800 },
          { name: 'BCAA 2:1:1 120 cápsulas', quantity: 350, revenue: 17500 },
          { name: 'Multivitamínico Premium', quantity: 320, revenue: 19200 },
          { name: 'Ômega 3 1000mg', quantity: 280, revenue: 14000 },
        ],
        byCategory: [
          { category: 'Proteínas', quantity: 2500 },
          { category: 'Suplementos', quantity: 2200 },
          { category: 'Vitaminas', quantity: 1800 },
          { category: 'Acessórios', quantity: 1200 },
          { category: 'Snacks Saudáveis', quantity: 800 },
        ],
      },
      efficiency: {
        orderProcessingTime: 2.3,
        fulfillmentRate: 0.95,
        returnRate: 0.033,
      },
    },
    commercialMetrics: {
      sales: {
        total: 2500000,
        bySeller: [
          { seller: 'Loja Online', value: 1500000, orders: 1200 },
          { seller: 'Carlos Souza', value: 450000, orders: 280 },
          { seller: 'Maria Santos', value: 350000, orders: 220 },
          { seller: 'Pedro Lima', value: 200000, orders: 150 },
        ],
        conversion: 0.085,
      },
      customers: {
        total: 5200,
        new: 850,
        returning: 4350,
        churn: 0.021,
        ltv: 3500,
      },
      marketing: {
        cac: 125,
        roi: 4.5,
        byChannel: [
          { channel: 'Google Ads', investment: 80000, return: 400000 },
          { channel: 'Facebook Ads', investment: 60000, return: 280000 },
          { channel: 'Instagram Ads', investment: 50000, return: 240000 },
          { channel: 'Email Marketing', investment: 10000, return: 120000 },
        ],
      },
    },
    analysis: {
      strengths: [
        'Forte crescimento de receita mês a mês',
        'Alta taxa de conversão comparada ao mercado',
        'Excelente margem de lucro líquido',
        'ROI de marketing muito positivo',
        'Baixa taxa de churn',
      ],
      weaknesses: [
        'Dependência alta da loja online (60% das vendas)',
        'Taxa de cancelamento ainda pode melhorar',
        'Tempo de processamento de pedidos acima da meta',
      ],
      opportunities: [
        'Expansão para marketplace (Amazon, Mercado Livre)',
        'Programa de fidelidade para aumentar LTV',
        'Parcerias com academias e personal trainers',
        'Linha de produtos próprios com maior margem',
      ],
      threats: [
        'Aumento da concorrência no e-commerce',
        'Possível aumento nos custos de logística',
        'Mudanças nas políticas de anúncios digitais',
        'Variação cambial afetando produtos importados',
      ],
    },
    recommendations: [
      {
        priority: 'high',
        title: 'Implementar Programa de Fidelidade',
        description:
          'Criar programa de pontos e recompensas para aumentar a retenção de clientes e o LTV. Estima-se que pode aumentar compras recorrentes em 25%.',
        expectedImpact: 'Aumento de 15-20% no LTV e redução de 30% no churn',
      },
      {
        priority: 'high',
        title: 'Otimizar Processo de Fulfillment',
        description:
          'Investir em automação do processo de separação e embalagem para reduzir tempo de processamento de 2.3h para 1.5h.',
        expectedImpact: 'Redução de 35% no tempo de processamento, melhora na satisfação',
      },
      {
        priority: 'medium',
        title: 'Expandir para Marketplaces',
        description:
          'Iniciar operação em Amazon e Mercado Livre para diversificar canais de venda e reduzir dependência do e-commerce próprio.',
        expectedImpact: 'Aumento projetado de 30% nas vendas em 6 meses',
      },
      {
        priority: 'medium',
        title: 'Desenvolver Linha Própria Premium',
        description:
          'Criar linha de produtos com marca própria focada em público premium, com margem 15 pontos percentuais maior.',
        expectedImpact: 'Aumento da margem bruta em 5-7 pontos percentuais',
      },
      {
        priority: 'low',
        title: 'Ampliar Canais de Marketing Orgânico',
        description:
          'Investir em SEO e marketing de conteúdo para reduzir dependência de mídia paga e diminuir CAC.',
        expectedImpact: 'Redução de 20-25% no CAC em 12 meses',
      },
    ],
  };

  // 3. Gerar PDF
  const pdfBlob = await ceoPDFGenerator.generateReport(reportData, {
    format: 'pdf',
    pdf: {
      pageSize: 'A4',
      orientation: 'portrait',
      includeCharts: true,
      includeTables: true,
      includeTableOfContents: true,
      compression: true,
    },
  });

  // 4. Download
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio-executivo-nov-2024.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('✅ Relatório PDF gerado com sucesso!');
}
```

### 📊 Exemplo 2: Exportar Relatório Financeiro em Excel

```typescript
import { ceoExcelGenerator } from '@/app/(auth-routes)/dashboard-ceo/services';

async function exportarRelatorioFinanceiroExcel() {
  // Usar os mesmos dados do exemplo anterior
  const reportData = { /* ... */ };

  // Gerar Excel
  const excelBlob = await ceoExcelGenerator.generateReport(reportData, {
    format: 'excel',
    excel: {
      includeCharts: false, // Excel não suporta gráficos complexos via ExcelJS
      sheetNames: {
        summary: 'Resumo Executivo',
        financial: 'Análise Financeira',
        operational: 'Métricas Operacionais',
        commercial: 'Desempenho Comercial',
        raw: 'Dados Detalhados',
      },
      autoColumnWidth: true,
      freezeHeader: true,
    },
  });

  // Download
  const url = URL.createObjectURL(excelBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio-financeiro-nov-2024.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('✅ Relatório Excel gerado com sucesso!');
}
```

### 📅 Exemplo 3: Criar Agendamento Semanal com Email

```typescript
import { 
  ceoReportScheduler,
  ceoEmailService,
  DEFAULT_EMAIL_CONFIG 
} from '@/app/(auth-routes)/dashboard-ceo/services';

async function criarAgendamentoSemanal() {
  // 1. Inicializar serviço de email
  ceoEmailService.initialize({
    ...DEFAULT_EMAIL_CONFIG,
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    },
  });

  // 2. Verificar conexão com servidor de email
  const emailOk = await ceoEmailService.verifyConnection();
  if (!emailOk) {
    throw new Error('Erro ao conectar com servidor de email');
  }

  // 3. Criar configuração de relatório
  const reportConfigId = 'relatorio-semanal-vendas';

  // 4. Criar agendamento
  const schedule = ceoReportScheduler.createSchedule({
    name: 'Relatório Semanal de Vendas - Todas as Segundas',
    reportConfigId,
    frequency: 'weekly',
    dayOfWeek: 1, // Segunda-feira
    time: '08:00',
    recipients: [
      { email: 'ceo@empresa.com', name: 'CEO' },
      { email: 'cfo@empresa.com', name: 'CFO' },
      { email: 'vendas@empresa.com', name: 'Gerente de Vendas' },
    ],
    emailSubject: '📊 Relatório Semanal de Vendas - Dashboard CEO',
    emailBody: `
      Prezados,

      Segue em anexo o relatório semanal consolidado de vendas e performance.

      Principais destaques desta semana serão apresentados no arquivo anexo.

      Atenciosamente,
      Sistema Dashboard CEO
    `,
    attachFormat: 'both', // PDF e Excel
    active: true,
    createdBy: 'admin@empresa.com',
  });

  console.log('✅ Agendamento criado com sucesso!');
  console.log(`📅 Próxima execução: ${schedule.nextRun?.toLocaleString('pt-BR')}`);

  return schedule;
}
```

### 📧 Exemplo 4: Enviar Relatório por Email Imediatamente

```typescript
import { ceoEmailService } from '@/app/(auth-routes)/dashboard-ceo/services';
import type { CEOReportResult, CEOReportConfig } from '@/app/(auth-routes)/dashboard-ceo/types/report-types';

async function enviarRelatorioPorEmail() {
  // 1. Dados do relatório gerado
  const reportResult: CEOReportResult = {
    id: 'report-result-123',
    status: 'completed',
    format: 'both',
    files: {
      pdf: {
        path: '/tmp/relatorio-nov-2024.pdf',
        size: 2500000, // 2.5 MB
        url: 'https://storage.empresa.com/reports/nov-2024.pdf',
      },
      excel: {
        path: '/tmp/relatorio-nov-2024.xlsx',
        size: 850000, // 850 KB
        url: 'https://storage.empresa.com/reports/nov-2024.xlsx',
      },
    },
    stats: {
      generationTime: 3500, // 3.5 segundos
      dataPoints: 2500,
      pages: 28,
      charts: 15,
      tables: 8,
    },
    generatedBy: 'João Silva',
    generatedAt: new Date(),
  };

  const reportConfig: CEOReportConfig = {
    name: 'Relatório Executivo - Novembro 2024',
    type: 'executive',
    format: 'both',
    startDate: new Date('2024-11-01'),
    endDate: new Date('2024-11-30'),
    sections: {
      summary: true,
      financialMetrics: true,
      operationalMetrics: true,
      commercialMetrics: true,
      charts: true,
      tables: true,
      analysis: true,
      recommendations: true,
    },
    createdBy: 'João Silva',
  };

  // 2. Enviar email
  await ceoEmailService.sendReport(
    ['destinatario@empresa.com'], // TO
    reportResult,
    reportConfig,
    {
      subject: '📊 Relatório Executivo - Novembro 2024',
      message: `
        Prezado(a),

        Segue em anexo o relatório executivo completo do mês de novembro de 2024.

        Destaques:
        - Receita: R$ 2.500.000 (+18.5%)
        - Margem: 32.5% (+3.2 pp)
        - Pedidos: 1.850 unidades
        - Conversão: 8.5%

        Qualquer dúvida, estou à disposição.

        Atenciosamente,
        João Silva
      `,
      cc: ['gerente@empresa.com'],
      bcc: ['backup@empresa.com'],
    }
  );

  console.log('✅ Email enviado com sucesso!');
}
```

### 🎨 Exemplo 5: Criar Template Personalizado

```typescript
import { ceoReportTemplates } from '@/app/(auth-routes)/dashboard-ceo/services';

function criarTemplatePersonalizado() {
  const meuTemplate = ceoReportTemplates.createCustomTemplate({
    name: 'Relatório Premium Trimestral',
    description: 'Template exclusivo para apresentações trimestrais à diretoria',
    type: 'executive',
    defaultSections: {
      summary: true,
      financialMetrics: true,
      operationalMetrics: true,
      commercialMetrics: true,
      charts: true,
      tables: false, // Sem tabelas detalhadas
      analysis: true,
      recommendations: true,
    },
    layout: {
      pageSize: 'A4',
      orientation: 'landscape', // Paisagem para apresentação
      margins: {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15,
      },
    },
    styles: {
      primaryColor: '#1E3A8A', // Azul corporativo
      secondaryColor: '#3B82F6',
      accentColor: '#F59E0B', // Dourado
      fontFamily: 'Helvetica',
      fontSize: {
        title: 28,
        heading: 18,
        body: 12,
        small: 10,
      },
    },
    customSections: [
      {
        id: 'sec-1',
        title: 'Mensagem da Diretoria',
        content: 'Seção customizada para mensagem inicial',
        order: 1,
      },
      {
        id: 'sec-2',
        title: 'Comparativo com Trimestre Anterior',
        content: 'Análise comparativa detalhada',
        order: 10,
      },
    ],
    createdBy: 'admin@empresa.com',
  });

  console.log('✅ Template customizado criado:', meuTemplate.name);
  console.log('📋 ID do template:', meuTemplate.id);

  return meuTemplate;
}
```

### 🔄 Exemplo 6: Workflow Completo - Da Geração ao Envio

```typescript
async function workflowCompletoRelatorio() {
  try {
    console.log('🚀 Iniciando workflow completo de relatório...');

    // 1. Buscar dados do dashboard
    console.log('📊 Buscando dados do dashboard...');
    const dashboardData = await buscarDadosDashboard(); // Sua função

    // 2. Transformar em formato de relatório
    console.log('🔄 Transformando dados...');
    const reportData = transformarParaFormatoRelatorio(dashboardData);

    // 3. Selecionar template
    console.log('🎨 Selecionando template...');
    const template = ceoReportTemplates.getDefaultTemplateForType('executive');

    // 4. Gerar PDF
    console.log('📄 Gerando PDF...');
    const pdfBlob = await ceoPDFGenerator.generateReport(reportData, {
      format: 'pdf',
      pdf: {
        pageSize: 'A4',
        orientation: 'portrait',
        includeCharts: true,
        includeTables: true,
        includeTableOfContents: true,
      },
    });

    // 5. Gerar Excel
    console.log('📊 Gerando Excel...');
    const excelBlob = await ceoExcelGenerator.generateReport(reportData, {
      format: 'excel',
      excel: {
        autoColumnWidth: true,
        freezeHeader: true,
      },
    });

    // 6. Salvar arquivos (exemplo simplificado)
    console.log('💾 Salvando arquivos...');
    const pdfPath = await salvarArquivo(pdfBlob, 'relatorio.pdf');
    const excelPath = await salvarArquivo(excelBlob, 'relatorio.xlsx');

    // 7. Preparar resultado
    const reportResult: CEOReportResult = {
      id: `report-${Date.now()}`,
      status: 'completed',
      format: 'both',
      files: {
        pdf: {
          path: pdfPath,
          size: pdfBlob.size,
        },
        excel: {
          path: excelPath,
          size: excelBlob.size,
        },
      },
      stats: {
        generationTime: 5000,
        dataPoints: 2500,
        pages: 28,
        charts: 15,
      },
      generatedBy: 'Sistema Automático',
      generatedAt: new Date(),
    };

    // 8. Enviar por email
    console.log('📧 Enviando email...');
    await ceoEmailService.sendReport(
      ['destinatario@empresa.com'],
      reportResult,
      reportData.config,
      {
        subject: '📊 Relatório Automático - Dashboard CEO',
      }
    );

    console.log('✅ Workflow concluído com sucesso!');
    return reportResult;
  } catch (error) {
    console.error('❌ Erro no workflow:', error);
    
    // Notificar erro
    await ceoEmailService.sendErrorNotification(
      ['admin@empresa.com'],
      error as Error,
      {
        reportName: 'Workflow Automático',
        timestamp: new Date(),
      }
    );

    throw error;
  }
}

// Funções auxiliares (você deve implementar conforme sua necessidade)
async function buscarDadosDashboard() {
  // Sua lógica para buscar dados
  return {};
}

function transformarParaFormatoRelatorio(data: any): CEOReportData {
  // Sua lógica de transformação
  return {} as CEOReportData;
}

async function salvarArquivo(blob: Blob, filename: string): Promise<string> {
  // Sua lógica para salvar (filesystem, S3, etc.)
  return `/tmp/${filename}`;
}
```

## 🎯 Dicas e Melhores Práticas

### ✅ DO (Faça)

1. **Validar dados antes de gerar relatórios**
2. **Usar try-catch para capturar erros**
3. **Enviar notificações de erro para administradores**
4. **Testar agendamentos em modo inativo primeiro**
5. **Usar templates para consistência visual**
6. **Comprimir PDFs para arquivos grandes**
7. **Limitar tamanho de anexos em emails (< 10MB)**

### ❌ DON'T (Não Faça)

1. **Não gerar relatórios sem validar dados**
2. **Não ativar agendamentos sem testar**
3. **Não enviar emails sem verificar credenciais**
4. **Não incluir dados sensíveis sem criptografia**
5. **Não criar agendamentos muito frequentes**
6. **Não ignorar erros de geração**

## 🐛 Troubleshooting

### Problema: PDF não está sendo gerado

```typescript
// Verificar se os dados estão completos
console.log('Dados do relatório:', JSON.stringify(reportData, null, 2));

// Verificar se há erros no console
try {
  const pdf = await ceoPDFGenerator.generateReport(reportData);
  console.log('PDF gerado:', pdf.size, 'bytes');
} catch (error) {
  console.error('Erro ao gerar PDF:', error);
}
```

### Problema: Email não está sendo enviado

```typescript
// 1. Verificar conexão
const connected = await ceoEmailService.verifyConnection();
console.log('Conectado:', connected);

// 2. Enviar teste
await ceoEmailService.sendTestEmail('seu-email@test.com');

// 3. Verificar credenciais
console.log('Email host:', process.env.EMAIL_HOST);
console.log('Email user:', process.env.EMAIL_USER);
// NÃO IMPRIMIR A SENHA!
```

### Problema: Agendamento não está executando

```typescript
// Verificar próxima execução
const schedule = ceoReportScheduler.getScheduleById('schedule-id');
console.log('Próxima execução:', schedule?.nextRun);
console.log('Status:', schedule?.active ? 'Ativo' : 'Inativo');

// Executar manualmente para testar
await ceoReportScheduler.executeScheduleNow('schedule-id');
```

---

**Versão:** 1.0.0  
**Última Atualização:** Outubro 2024

