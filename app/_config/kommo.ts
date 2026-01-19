import { z } from "zod";

// Schema de validação para as configurações do KOMMO
const kommoConfigSchema = z.object({
  jwtToken: z.string().default(""),
  apiUrl: z.string().url().default("https://api-c.kommo.com"),
  timeout: z.number().min(1000).default(30000),
  retryAttempts: z.number().min(0).default(3),
  retryDelay: z.number().min(100).default(1000),
  debug: z.boolean().default(true),
  baseDomain: z.string().default("kommo.com"),
});

// Obtém configurações das variáveis de ambiente
const jwtToken =
  process.env.KOMMO_JWT_TOKEN ||
  process.env.KOMMO_LONG_LIVED_TOKEN ||
  "";

const defaultConfig = {
  jwtToken: jwtToken,
  apiUrl: process.env.KOMMO_API_URL || "https://api-c.kommo.com",
  timeout: parseInt(process.env.KOMMO_TIMEOUT || "30000"),
  retryAttempts: parseInt(process.env.KOMMO_RETRY_ATTEMPTS || "3"),
  retryDelay: parseInt(process.env.KOMMO_RETRY_DELAY || "1000"),
  debug: process.env.KOMMO_DEBUG === "true" || true,
  baseDomain: process.env.KOMMO_BASE_DOMAIN || "kommo.com",
};

// Log das configurações antes da validação
console.log("[KOMMO_CONFIG] Configurações antes da validação:", {
  apiUrl: defaultConfig.apiUrl,
  jwtToken: defaultConfig.jwtToken
    ? defaultConfig.jwtToken.substring(0, 20) + "..."
    : "não definido",
  timeout: defaultConfig.timeout,
  retryAttempts: defaultConfig.retryAttempts,
  debug: defaultConfig.debug,
  baseDomain: defaultConfig.baseDomain,
});

// Verificar se estamos em modo de build (CI/CD ou build local)
const isBuildProcess =
  process.env.NODE_ENV === "production" &&
  (process.env.CI === "true" ||
    process.env.NEXT_PHASE === "phase-production-build");

// Validação das configurações
const validateConfig = () => {
  try {
    const validatedConfig = kommoConfigSchema.parse(defaultConfig);
    console.log("[KOMMO_CONFIG] Configurações validadas com sucesso");
    return validatedConfig;
  } catch (error) {
    console.error(
      "[KOMMO_CONFIG] Erro na validação das configurações:",
      error,
    );

    // Em desenvolvimento ou durante o build, permitir continuar com configurações inválidas
    if (process.env.NODE_ENV === "development" || isBuildProcess) {
      console.warn(
        "[KOMMO_CONFIG] Usando configurações não validadas em ambiente de desenvolvimento ou durante build",
      );
      return defaultConfig as z.infer<typeof kommoConfigSchema>;
    }

    throw error;
  }
};

export const kommoConfig = validateConfig();

export type KommoConfig = z.infer<typeof kommoConfigSchema>;
export { kommoConfigSchema };
