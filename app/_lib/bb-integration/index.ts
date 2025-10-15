import { join } from 'path';
import { getAccessToken } from './auth';
import { getExtract, getBalance } from './account';
import { BBExtractResponse, ExtractOptions } from './types';
import { getWalletCertsDir, getCertPathsForWallet } from './certificates';
import { prisma } from '../prisma';

/**
 * Classe principal para integração com o Banco do Brasil
 * Implementa o padrão Singleton para garantir uma única instância
 */
export class BBIntegrationService {
  private static instance: BBIntegrationService;
  private certsDir: string;

  /**
   * Construtor privado (padrão Singleton)
   */
  private constructor() {
    // Inicializar diretório de certificados
    this.certsDir = join(process.cwd(), 'certs');
   
  }

  /**
   * Obtém a instância única do serviço (padrão Singleton)
   * @returns Instância do serviço
   */
  static getInstance(): BBIntegrationService {
    if (!BBIntegrationService.instance) {
      BBIntegrationService.instance = new BBIntegrationService();
    }
    return BBIntegrationService.instance;
  }

  /**
   * Obtém um token de acesso para uma conexão
   * @param connectionIdOrToken ID da conexão ou token direto
   * @param walletId ID da carteira (opcional)
   * @returns Token de acesso
   */
  public async getAccessToken(connectionIdOrToken: string, walletId?: string): Promise<string> {
    return getAccessToken(connectionIdOrToken, walletId);
  }

  /**
   * Obtém o extrato bancário
   * @param agencia Número da agência
   * @param conta Número da conta
   * @param connectionIdOrToken ID da conexão ou token de acesso
   * @param appKey Chave da aplicação
   * @param options Opções adicionais
   * @returns Extrato bancário
   */
  public async getExtract(
    agencia: string,
    conta: string,
    connectionIdOrToken: string,
    appKey: string,
    options: ExtractOptions
  ): Promise<BBExtractResponse> {
    // Obter token de acesso (caso seja ID da conexão) ou usar diretamente (caso seja token)
    const accessToken = await this.getAccessToken(connectionIdOrToken, options.walletId);
    
    // Chamar a implementação no módulo account
    return getExtract(agencia, conta, accessToken, appKey, options);
  }

  /**
   * Obtém o saldo da conta
   * @param agencia Número da agência
   * @param conta Número da conta
   * @param connectionIdOrToken ID da conexão ou token de acesso
   * @param appKey Chave da aplicação
   * @param walletId ID da carteira
   * @returns Saldo da conta
   */
  public async getBalance(
    agencia: string, 
    conta: string, 
    connectionIdOrToken: string,
    appKey: string,
    walletId: string
  ): Promise<number> {
    // Obter token de acesso (caso seja ID da conexão) ou usar diretamente (caso seja token)
    const accessToken = await this.getAccessToken(connectionIdOrToken, walletId);
    
    // Chamar a implementação no módulo account
    return getBalance(agencia, conta, accessToken, appKey, walletId);
  }

  /**
   * Obtém o caminho para o diretório de certificados de uma carteira
   * @param walletId ID da carteira
   * @returns Caminho para o diretório de certificados
   */
  public getWalletCertsDir(walletId: string): string {
    return getWalletCertsDir(this.certsDir, walletId);
  }

  /**
   * Obtém os caminhos para os certificados de uma carteira
   * @param walletId ID da carteira
   * @returns Caminhos para os certificados
   */
  public getCertificatePaths(walletId: string): { ca: string; cert: string; key: string } {
    return getCertPathsForWallet(this.certsDir, walletId);
  }
}

// Re-exportar tipos e utilitários para uso externo
export * from './types';
export * from './utils';

// Re-exportar a instância para acesso rápido
export const bbService = BBIntegrationService.getInstance(); 
