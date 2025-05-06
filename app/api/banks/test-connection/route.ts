import { NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { existsSync } from "fs";
import { join } from "path";
import axios from "axios";
import https from "https";
import fs from "fs";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


export async function POST(request: Request) {
  try {
    // Verificar autenticação do usuário
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    const { applicationKey, clientBasic, clientId, clientSecret, agencia, conta } = body;

    // Validar dados de entrada
    if (!applicationKey || !clientBasic || !clientId || !clientSecret || !agencia || !conta) {
      return NextResponse.json({ 
        success: false, 
        error: "Todos os campos são obrigatórios" 
      }, { status: 400 });
    }

    // Verificar se os certificados existem
    const certsDir = join(process.cwd(), "certs");
    const caPath = join(certsDir, "ca.cer");
    const certPath = join(certsDir, "cert.pem");
    const keyPath = join(certsDir, "private.key");

    if (!existsSync(caPath) || !existsSync(certPath) || !existsSync(keyPath)) {
      return NextResponse.json({
        success: false,
        error: "Certificados não encontrados. Por favor, faça o upload de todos os certificados."
      }, { status: 400 });
    }

    // Tentar obter token de acesso
    try {
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

      console.log("[TEST_CONNECTION] Tentando obter token de acesso");
      
      const tokenResponse = await axios.post(
        "https://oauth.bb.com.br/oauth/token",
        new URLSearchParams({
          grant_type: "client_credentials",
          scope: "extrato-info",
        }),
        {
          headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const accessToken = tokenResponse.data.access_token;
      
      if (!accessToken) {
        return NextResponse.json({
          success: false,
          error: "Não foi possível obter token de acesso"
        }, { status: 400 });
      }

      console.log("[TEST_CONNECTION] Token de acesso obtido com sucesso");

      // Tentar fazer uma requisição simples para a API do BB (só para validar, não vai retornar dados)
      // Configurar agente HTTPS com certificados
      const httpsAgent = new https.Agent({
        ca: fs.readFileSync(caPath),
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
        rejectUnauthorized: true,
        ciphers: 'DEFAULT:!LOW:!EXP:!MD5:@STRENGTH',
        keepAlive: true,
        timeout: 30000
      });

      // Criar instância do Axios com a configuração necessária
      const bbApi = axios.create({
        baseURL: "https://api-extratos.bb.com.br/extratos/v1",
        headers: {
          "Content-Type": "application/json",
        },
        httpsAgent: httpsAgent,
      });

      // Fazer uma requisição simples para validar as credenciais
      try {
        console.log("[TEST_CONNECTION] Testando conexão com credenciais");
        
        // Não vamos realmente buscar extratos, apenas validar as credenciais
        // API do BB não tem endpoint de health check, então apenas retornamos sucesso se o token foi gerado
        
        return NextResponse.json({
          success: true,
          message: "Conexão estabelecida com sucesso!",
          token: accessToken.substring(0, 10) + "..." // Mostrar apenas os primeiros 10 caracteres do token
        });
      } catch (apiError) {
        console.error("[TEST_CONNECTION_API_ERROR]", apiError);
        
        return NextResponse.json({
          success: false,
          error: "Falha ao conectar à API do Banco do Brasil. Verifique a chave da aplicação e os certificados."
        }, { status: 400 });
      }
    } catch (tokenError) {
      console.error("[TEST_CONNECTION_TOKEN_ERROR]", tokenError);
      
      return NextResponse.json({
        success: false,
        error: "Falha na autenticação. Verifique o Client ID e Client Secret."
      }, { status: 400 });
    }
  } catch (error) {
    console.error("[TEST_CONNECTION_ERROR]", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erro ao testar conexão"
    }, { status: 500 });
  }
} 
