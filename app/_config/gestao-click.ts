import { z } from "zod";

// Schema de validação para as configurações
const gestaoClickConfigSchema = z.object({
  apiUrl: z.string().url(),
  accessToken: z.string().min(1),
  secretAccessToken: z.string().min(1),
  apiKey: z.string().min(1),
  secretToken: z.string().min(1),
  timeout: z.number().min(1000).default(30000),
  retryAttempts: z.number().min(0).default(3),
  retryDelay: z.number().min(100).default(1000),
  authMethod: z.enum(['bearer', 'basic', 'api-key', 'url-params', 'token']).default('bearer'),
  apiVersion: z.enum(['', 'v1', 'v2']).default(''),
  userAgent: z.string().default('ContaRapida API Client/1.0'),
  debug: z.boolean().default(true),
  defaultEndpoint: z.string().default('/api/vendas'),
});

// Configura variáveis legadas e novas, dando prioridade às novas
const apiKey = process.env.GESTAO_CLICK_API_KEY || process.env.GESTAO_CLICK_ACCESS_TOKEN || "";
const secretToken = process.env.GESTAO_CLICK_SECRET_TOKEN || process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || "";

// Configurações padrão
const defaultConfig = {
  apiUrl: process.env.GESTAO_CLICK_API_URL || "https://api.beteltecnologia.com.br",
  accessToken: apiKey,
  secretAccessToken: secretToken,
  apiKey: apiKey,
  secretToken: secretToken,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  authMethod: 'token',  // Alterado para usar token como padrão
  apiVersion: '',
  userAgent: 'ContaRapida API Client/1.0',
  debug: true,
  defaultEndpoint: '/vendas'
};

// Log das configurações antes da validação
console.log("[GESTAO_CLICK_CONFIG] Configurações antes da validação:", {
  apiUrl: defaultConfig.apiUrl,
  apiKey: defaultConfig.apiKey ? defaultConfig.apiKey.substring(0, 5) + "..." : "não definido",
  secretToken: defaultConfig.secretToken ? defaultConfig.secretToken.substring(0, 5) + "..." : "não definido",
  accessToken: defaultConfig.accessToken ? defaultConfig.accessToken.substring(0, 5) + "..." : "não definido",
  secretAccessToken: defaultConfig.secretAccessToken ? defaultConfig.secretAccessToken.substring(0, 5) + "..." : "não definido",
  timeout: defaultConfig.timeout,
  retryAttempts: defaultConfig.retryAttempts,
  retryDelay: defaultConfig.retryDelay,
  authMethod: defaultConfig.authMethod,
  apiVersion: defaultConfig.apiVersion,
  debug: defaultConfig.debug,
  defaultEndpoint: defaultConfig.defaultEndpoint
});

// Validação das configurações
const validateConfig = () => {
  try {
    const validatedConfig = gestaoClickConfigSchema.parse(defaultConfig);
    console.log("[GESTAO_CLICK_CONFIG] Configurações validadas com sucesso");
    return validatedConfig;
  } catch (error) {
    console.error("[GESTAO_CLICK_CONFIG] Erro na validação das configurações:", error);
    
    // Em desenvolvimento, permitir continuar mesmo com configurações inválidas
    if (process.env.NODE_ENV === 'development') {
      console.warn("[GESTAO_CLICK_CONFIG] Usando configurações não validadas em ambiente de desenvolvimento");
      return defaultConfig;
    }
    
    throw new Error("Configurações do Gestão Click inválidas");
  }
};

// Exportação das configurações validadas
export const gestaoClickConfig = validateConfig();

// Tipos exportados
export type GestaoClickConfig = z.infer<typeof gestaoClickConfigSchema>; 