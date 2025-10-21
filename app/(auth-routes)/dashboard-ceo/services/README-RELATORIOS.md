# 📊 Sistema de Relatórios CEO - Documentação Completa

## 🎯 Visão Geral

Sistema completo e isolado para geração, agendamento e envio automático de relatórios da Dashboard CEO. Este sistema não afeta outras dashboards ou funcionalidades existentes.

## 🏗️ Arquitetura

### Serviços Implementados

```
dashboard-ceo/services/
├── pdf-generator.ts          # Geração de PDFs com gráficos
├── excel-generator.ts        # Geração de Excel com dados formatados
├── report-templates.ts       # Templates personalizáveis
├── report-scheduler.ts       # Agendamento de relatórios
├── email-service.ts          # Envio por email
└── README-RELATORIOS.md      # Esta documentação
```

### Tipos e Interfaces

```
dashboard-ceo/types/
└── report-types.ts           # Todas as interfaces TypeScript
```

## 📦 Funcionalidades Implementadas

### ✅ 1. Geração de PDF (pdf-generator.ts)

**Características:**
- ✅ Geração de PDFs profissionais com jsPDF
- ✅ Suporte a gráficos via html2canvas
- ✅ Templates personalizáveis
- ✅ Múltiplas seções (financeiro, operacional, comercial)
- ✅ Análise SWOT
- ✅ Recomendações priorizadas
- ✅ Índice automático
- ✅ Rodapés com paginação
- ✅ Compressão de PDF

**Uso Básico:**
```typescript
import { ceoPDFGenerator } from './services/pdf-generator';

const blob = await ceoPDFGenerator.generateReport(reportData, {
  format: 'pdf',
  pdf: {
    pageSize: 'A4',
    orientation: 'portrait',
    includeCharts: true,
    includeTables: true,
    includeTableOfContents: true,
    compression: true
  }
});
```

### ✅ 2. Geração de Excel (excel-generator.ts)

**Características:**
- ✅ Geração de Excel com ExcelJS
- ✅ Múltiplas planilhas (Sumário, Financeiro, Operacional, Comercial, Dados Brutos)
- ✅ Formatação profissional com cores e bordas
- ✅ Auto-ajuste de colunas
- ✅ Congelamento de painéis
- ✅ Tabelas estilizadas
- ✅ Gráficos (quando suportado)

**Uso Básico:**
```typescript
import { ceoExcelGenerator } from './services/excel-generator';

const blob = await ceoExcelGenerator.generateReport(reportData, {
  format: 'excel',
  excel: {
    includeCharts: true,
    sheetNames: {
      summary: 'Sumário',
      financial: 'Financeiro',
      operational: 'Operacional',
      commercial: 'Comercial',
      raw: 'Dados Brutos'
    },
    autoColumnWidth: true,
    freezeHeader: true
  }
});
```

### ✅ 3. Templates Personalizáveis (report-templates.ts)

**Templates Padrão:**
- ✅ **Executivo**: Resumo executivo com principais métricas
- ✅ **Financeiro**: Análise financeira detalhada
- ✅ **Operacional**: Métricas operacionais e eficiência
- ✅ **Comercial**: Análise de vendas e clientes
- ✅ **Personalizado**: Template totalmente customizável

**Funcionalidades:**
- ✅ Criar templates customizados
- ✅ Editar templates existentes
- ✅ Duplicar templates
- ✅ Exportar/Importar templates (JSON)
- ✅ Validação de templates
- ✅ Estatísticas de templates

**Uso Básico:**
```typescript
import { ceoReportTemplates } from './services/report-templates';

// Listar templates
const templates = ceoReportTemplates.getAllTemplates();

// Obter template por tipo
const financialTemplate = ceoReportTemplates.getDefaultTemplateForType('financial');

// Criar template customizado
const newTemplate = ceoReportTemplates.createCustomTemplate({
  name: 'Meu Template',
  description: 'Template customizado para relatórios mensais',
  type: 'custom',
  defaultSections: {
    summary: true,
    financialMetrics: true,
    operationalMetrics: true,
    commercialMetrics: false,
    charts: true,
    tables: true,
    analysis: true,
    recommendations: true
  },
  layout: {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 20, right: 20, bottom: 20, left: 20 }
  },
  styles: {
    primaryColor: '#1E40AF',
    secondaryColor: '#3B82F6',
    accentColor: '#10B981',
    fontFamily: 'Helvetica',
    fontSize: { title: 24, heading: 16, body: 11, small: 9 }
  },
  createdBy: 'usuarioId'
});
```

### ✅ 4. Agendamento de Relatórios (report-scheduler.ts)

**Características:**
- ✅ Agendamentos recorrentes (diário, semanal, mensal, trimestral, anual)
- ✅ Configuração de dia e hora específicos
- ✅ Múltiplos destinatários por agendamento
- ✅ Ativação/Desativação de agendamentos
- ✅ Cálculo automático de próxima execução
- ✅ Histórico de execuções
- ✅ Validação de configurações

**Frequências Suportadas:**
- `daily`: Diariamente
- `weekly`: Semanalmente (escolher dia da semana)
- `monthly`: Mensalmente (escolher dia do mês)
- `quarterly`: Trimestralmente
- `yearly`: Anualmente (escolher mês e dia)
- `custom`: Customizado

**Uso Básico:**
```typescript
import { ceoReportScheduler } from './services/report-scheduler';

// Criar agendamento semanal
const schedule = ceoReportScheduler.createSchedule({
  name: 'Relatório Semanal de Vendas',
  reportConfigId: 'config-123',
  frequency: 'weekly',
  dayOfWeek: 1, // Segunda-feira (0 = Domingo, 6 = Sábado)
  time: '09:00', // 09:00 AM
  recipients: [
    { email: 'ceo@empresa.com', name: 'CEO' },
    { email: 'cfo@empresa.com', name: 'CFO' }
  ],
  emailSubject: 'Relatório Semanal - Dashboard CEO',
  emailBody: 'Segue relatório semanal em anexo.',
  active: true,
  createdBy: 'usuarioId'
});

// Listar agendamentos ativos
const activeSchedules = ceoReportScheduler.getActiveSchedules();

// Desativar agendamento
ceoReportScheduler.deactivateSchedule(schedule.id);

// Executar agendamento imediatamente (teste)
await ceoReportScheduler.executeScheduleNow(schedule.id);
```

### ✅ 5. Envio por Email (email-service.ts)

**Características:**
- ✅ Envio via SMTP (Nodemailer)
- ✅ Templates HTML profissionais
- ✅ Anexos (PDF e Excel)
- ✅ Múltiplos destinatários (to, cc, bcc)
- ✅ Assunto e mensagem personalizáveis
- ✅ Notificações de erro
- ✅ Email de teste
- ✅ Verificação de conexão

**Configuração:**

Adicione as seguintes variáveis de ambiente no `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
EMAIL_FROM_NAME=Dashboard CEO
EMAIL_FROM_EMAIL=noreply@dashboardceo.com
```

**Uso Básico:**
```typescript
import { ceoEmailService, DEFAULT_EMAIL_CONFIG } from './services/email-service';

// Inicializar serviço
ceoEmailService.initialize(DEFAULT_EMAIL_CONFIG);

// Verificar conexão
const isConnected = await ceoEmailService.verifyConnection();

// Enviar relatório
await ceoEmailService.sendReport(
  ['destinatario@empresa.com'],
  reportResult,
  reportConfig,
  {
    subject: 'Relatório Mensal - Dashboard CEO',
    message: 'Segue relatório mensal conforme solicitado.',
    cc: ['gerente@empresa.com'],
  }
);

// Enviar teste
await ceoEmailService.sendTestEmail('seu-email@teste.com');

// Enviar notificação de erro
await ceoEmailService.sendErrorNotification(
  ['admin@empresa.com'],
  error,
  {
    reportName: 'Relatório Mensal',
    timestamp: new Date()
  }
);
```

## 🔄 Fluxo Completo de Uso

### 1. Exportação Manual

```typescript
// 1. Preparar dados do relatório
const reportData: CEOReportData = {
  config: {
    name: 'Relatório Executivo - Outubro 2024',
    description: 'Resumo executivo mensal',
    type: 'executive',
    format: 'pdf',
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-10-31'),
    filters: {},
    sections: {
      summary: true,
      financialMetrics: true,
      operationalMetrics: true,
      commercialMetrics: true,
      charts: true,
      tables: true,
      analysis: true,
      recommendations: true
    },
    createdBy: 'usuarioId'
  },
  period: {
    start: new Date('2024-10-01'),
    end: new Date('2024-10-31'),
    label: 'Outubro 2024'
  },
  summary: {
    totalRevenue: 1500000,
    totalOrders: 1250,
    averageTicket: 1200,
    profitMargin: 28.5,
    topInsights: [
      'Crescimento de 15% em relação ao mês anterior',
      'Ticket médio aumentou 8%',
      'Margem de lucro estável'
    ]
  },
  // ... demais métricas
};

// 2. Gerar PDF
const pdfBlob = await ceoPDFGenerator.generateReport(reportData, {
  format: 'pdf',
  pdf: {
    pageSize: 'A4',
    orientation: 'portrait',
    includeCharts: true,
    includeTables: true,
    includeTableOfContents: true
  }
});

// 3. Download
const url = URL.createObjectURL(pdfBlob);
const link = document.createElement('a');
link.href = url;
link.download = 'relatorio-executivo-out-2024.pdf';
link.click();
```

### 2. Agendamento Automático

```typescript
// 1. Criar configuração de relatório
const reportConfig = {
  id: 'report-config-1',
  name: 'Relatório Mensal Automático',
  type: 'executive',
  // ... demais configurações
};

// 2. Criar agendamento mensal
const schedule = ceoReportScheduler.createSchedule({
  name: 'Relatório Mensal - Dia 1',
  reportConfigId: reportConfig.id,
  frequency: 'monthly',
  dayOfMonth: 1, // Dia 1 de cada mês
  time: '08:00', // 08:00 AM
  recipients: [
    { email: 'ceo@empresa.com', name: 'CEO' },
    { email: 'diretoria@empresa.com', name: 'Diretoria' }
  ],
  emailSubject: 'Relatório Mensal - Dashboard CEO',
  emailBody: 'Segue o relatório mensal automático.',
  attachFormat: 'both', // PDF e Excel
  active: true,
  createdBy: 'system'
});

// O agendamento será executado automaticamente!
```

### 3. Envio por Email

```typescript
// 1. Gerar relatório
const reportResult = {
  id: 'result-1',
  status: 'completed',
  format: 'pdf',
  files: {
    pdf: {
      path: '/path/to/report.pdf',
      size: 2500000,
      url: 'https://...'
    }
  },
  stats: {
    generationTime: 3500,
    dataPoints: 1500,
    pages: 25,
    charts: 12
  },
  generatedBy: 'usuarioId',
  generatedAt: new Date()
};

// 2. Enviar por email
await ceoEmailService.sendReport(
  ['destinatario@empresa.com'],
  reportResult,
  reportConfig,
  {
    subject: 'Relatório CEO - Outubro 2024',
    message: 'Prezado(a), segue relatório executivo do período.',
    cc: ['gerente@empresa.com']
  }
);
```

## 🔒 Isolamento e Segurança

### Princípios de Isolamento

1. **Namespace Isolado**: Todos os serviços usam prefixo `CEO`
2. **Pasta Dedicada**: `/dashboard-ceo/services/`
3. **Tipos Próprios**: `/dashboard-ceo/types/report-types.ts`
4. **Sem Dependências Externas**: Não usa serviços de outras dashboards
5. **Validação Rigorosa**: Todas as entradas são validadas

### Checklist de Segurança

- ✅ Validação de dados de entrada
- ✅ Sanitização de campos de texto
- ✅ Proteção contra injeção de código
- ✅ Limitação de tamanho de arquivos
- ✅ Validação de emails
- ✅ Autenticação SMTP segura
- ✅ Logs de auditoria

## 📋 Dependências Necessárias

Adicione ao `package.json`:

```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "html2canvas": "^1.4.1",
    "exceljs": "^4.4.0",
    "nodemailer": "^6.9.7",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.14"
  }
}
```

Instalar:
```bash
npm install jspdf jspdf-autotable html2canvas exceljs nodemailer date-fns
npm install --save-dev @types/nodemailer
```

## 🧪 Testes

### Teste de Geração de PDF

```typescript
import { ceoPDFGenerator } from './services/pdf-generator';

const testData = {
  // ... dados de teste
};

const blob = await ceoPDFGenerator.generateReport(testData);
console.log('PDF gerado:', blob.size, 'bytes');
```

### Teste de Agendamento

```typescript
import { ceoReportScheduler } from './services/report-scheduler';

const testSchedule = ceoReportScheduler.createSchedule({
  name: 'Teste',
  reportConfigId: 'test',
  frequency: 'daily',
  time: '10:00',
  recipients: [{ email: 'test@test.com' }],
  active: false, // Não ativar em teste
  createdBy: 'test'
});

console.log('Próxima execução:', testSchedule.nextRun);
```

### Teste de Email

```typescript
import { ceoEmailService } from './services/email-service';

// Inicializar
ceoEmailService.initialize(/* config */);

// Verificar conexão
const connected = await ceoEmailService.verifyConnection();
console.log('Email conectado:', connected);

// Enviar teste
await ceoEmailService.sendTestEmail('seu-email@test.com');
```

## 📊 Estrutura de Dados

### CEOReportData

```typescript
interface CEOReportData {
  config: CEOReportConfig;
  period: { start: Date; end: Date; label: string };
  summary?: { /* métricas principais */ };
  financialMetrics?: { /* métricas financeiras */ };
  operationalMetrics?: { /* métricas operacionais */ };
  commercialMetrics?: { /* métricas comerciais */ };
  charts?: { /* gráficos */ };
  tables?: { /* tabelas */ };
  analysis?: { /* SWOT */ };
  recommendations?: { /* recomendações */ };
}
```

## 🎨 Personalização

### Cores do Template

```typescript
const template = ceoReportTemplates.createCustomTemplate({
  // ...
  styles: {
    primaryColor: '#1E40AF',    // Azul escuro
    secondaryColor: '#3B82F6',  // Azul médio
    accentColor: '#10B981',     // Verde
    fontFamily: 'Helvetica',
    fontSize: {
      title: 24,
      heading: 16,
      body: 11,
      small: 9
    }
  }
});
```

### Layout do PDF

```typescript
pdf: {
  pageSize: 'A4',           // ou 'Letter'
  orientation: 'portrait',  // ou 'landscape'
  includeCharts: true,
  includeTables: true,
  includeTableOfContents: true,
  compression: true
}
```

## 🚀 Próximos Passos

### Melhorias Futuras

1. **Integração com Cloud Storage**
   - Salvar relatórios no S3/Cloud Storage
   - Links de download com expiração

2. **Dashboard de Relatórios**
   - Visualizar histórico completo
   - Análise de tendências

3. **Notificações Push**
   - Notificações quando relatório for gerado
   - Alertas de falhas

4. **Mais Formatos**
   - Exportar para PowerPoint
   - Exportar para Google Sheets

5. **Machine Learning**
   - Insights automáticos com IA
   - Previsões e tendências

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique a documentação completa
2. Confira os logs de erro
3. Valide as configurações de ambiente
4. Entre em contato com a equipe de desenvolvimento

---

**Versão:** 1.0.0  
**Data:** Outubro 2024  
**Autor:** Sistema Dashboard CEO

