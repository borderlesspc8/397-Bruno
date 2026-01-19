/**
 * Endpoint simples de teste do Gestão Click (sem depender do banco de dados)
 * Testa apenas as credenciais do .env.local e conexão com a API
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Obter credenciais do ambiente
    const apiKey = process.env.GESTAO_CLICK_ACCESS_TOKEN || "";
    const secretToken = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || "";
    const apiUrl = process.env.GESTAO_CLICK_API_URL || "https://api.gestaoclick.com/v1";

    console.log("[TEST-SIMPLE] Credenciais carregadas do .env.local");

    // Verificar se as credenciais estão configuradas
    if (!apiKey || !secretToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Credenciais não configuradas no .env.local",
          credentials: {
            apiKey: apiKey ? "✓ Definido" : "✗ Não definido",
            secretToken: secretToken ? "✓ Definido" : "✗ Não definido",
            apiUrl: apiUrl ? "✓ Definido" : "✗ Não definido",
          },
        },
        { status: 400 }
      );
    }

    // Tentar conectar com a API do Gestão Click
    console.log("[TEST-SIMPLE] Testando conexão com:", apiUrl);

    const testUrl = `${apiUrl}/vendas`;

    // Construir headers com autenticação via headers (token)
    const headers = {
      "Content-Type": "application/json",
      "access-token": apiKey,
      "secret-access-token": secretToken,
    };

    console.log("[TEST-SIMPLE] Enviando requisição para:", testUrl);
    console.log("[TEST-SIMPLE] Headers:", {
      "Content-Type": "application/json",
      "access-token": apiKey.substring(0, 5) + "...",
      "secret-access-token": secretToken.substring(0, 5) + "...",
    });

    // Fazer a requisição (com timeout de 10 segundos)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(testUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.text();

    console.log("[TEST-SIMPLE] Resposta:", {
      status: response.status,
      statusText: response.statusText,
      body: data.substring(0, 200),
    });

    return NextResponse.json({
      success: response.ok,
      message: response.ok
        ? "Conexão com Gestão Click estabelecida com sucesso"
        : "Erro na conexão com Gestão Click",
      credentials: {
        apiKey: apiKey.substring(0, 5) + "...",
        secretToken: secretToken.substring(0, 5) + "...",
        apiUrl,
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get("content-type"),
        body: data.substring(0, 500),
      },
    });
  } catch (error: any) {
    console.error("[TEST-SIMPLE] Erro:", error.message);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao testar conexão",
        error: error.message,
        hint:
          error.name === "AbortError"
            ? "Timeout na requisição (10s) - API pode estar lenta ou inacessível"
            : error.message,
      },
      { status: 500 }
    );
  }
}
