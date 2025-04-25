import axios from 'axios';

// Cache para o token de acesso
let tokenCache = {
  accessToken: null as string | null,
  expiresAt: null as number | null
};

/**
 * Obtém um token de acesso para a API do banco
 */
async function getAccessToken(): Promise<string> {
  try {
    // Verificar cache
    const now = Date.now();
    if (tokenCache.accessToken && tokenCache.expiresAt && now < tokenCache.expiresAt) {
      return tokenCache.accessToken;
    }

    // Validar credenciais
    if (!process.env.BB_CLIENT_ID || !process.env.BB_CLIENT_SECRET) {
      throw new Error('Credenciais do banco não configuradas');
    }

    // Gerar Basic Auth
    const basicAuth = Buffer.from(
      `${process.env.BB_CLIENT_ID}:${process.env.BB_CLIENT_SECRET}`
    ).toString('base64');

    // Obter novo token
    const response = await axios.post(
      'https://oauth.bb.com.br/oauth/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'extrato-info'
      }),
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Atualizar cache
    const accessToken = response.data.access_token;
    const expiresIn = response.data.expires_in || 3600;

    tokenCache = {
      accessToken,
      expiresAt: now + (expiresIn * 1000) - 60000 // Expira 1 minuto antes
    };

    return accessToken;
  } catch (error: any) {
    console.error('Erro ao obter token de acesso:', error.response?.data || error.message);
    throw new Error('Falha ao obter token de acesso do banco');
  }
}

/**
 * Formata uma data para o padrão do banco (ddMMyyyy)
 */
function formatDateForBank(dateStr: string): string {
  // Se já estiver no formato ddMMyyyy
  if (/^\d{8}$/.test(dateStr)) {
    return dateStr;
  }

  // Se estiver no formato YYYY-MM-DD
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-');
    // Remove zero à esquerda do dia se for entre 01 e 09
    const normalizedDay = day.startsWith('0') ? day.substring(1) : day;
    return `${normalizedDay}${month}${year}`;
  }

  return dateStr;
}

/**
 * Obtém extrato bancário
 */
export async function getBankStatement(startDate: string, endDate: string): Promise<any> {
  try {
    const accessToken = await getAccessToken();

    // Configurações da conta
    const AGENCY = process.env.BB_AGENCY || '5750';
    const ACCOUNT = process.env.BB_ACCOUNT || '2383';

    // Formatar datas
    const formattedStartDate = formatDateForBank(startDate);
    const formattedEndDate = formatDateForBank(endDate);

    // Fazer requisição
    const response = await axios.get(
      `https://api.bb.com.br/conta-corrente/v3/contas/${AGENCY}/${ACCOUNT}/extrato`,
      {
        params: {
          dataInicio: formattedStartDate,
          dataFim: formattedEndDate
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Developer-Application-Key': process.env.BB_DEVELOPER_APPLICATION_KEY
        }
      }
    );

    // Validar resposta
    if (!response.data) {
      throw new Error('Resposta vazia da API do banco');
    }

    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar extrato:', error.response?.data || error.message);
    throw new Error('Falha ao obter extrato bancário');
  }
} 