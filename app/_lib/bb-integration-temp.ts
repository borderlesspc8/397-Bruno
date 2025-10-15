import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "./prisma";
import { Agent } from "https";
import { existsSync } from "fs";
import https from "https";
import fs from 'fs';

interface BBCredentials {
  applicationKey: string;
  clientId: string;
  clientSecret: string;
  clientBasic: string;
  apiUrl: string;
  certPaths: {
    ca: string;
    cert: string;
    key: string;
  };
}

interface BBAccountResponse {
  Data: {
    Account: Array<{
      AccountId: string;
      AccountType: string;
      AccountSubType: string;
      Description: string;
      Nickname: string;
      Balance: number;
      Currency: string;
    }>
  };
}

interface BBTransactionResponse {
  Data: {
    Transaction: Array<{
      TransactionId: string;
      BookingDateTime: string;
      ValueDateTime: string;
      TransactionInformation: string;
      Amount: {
        Amount: string;
        Currency: string;
      };
      CreditDebitIndicator: "CRDT" | "DBIT";
      Status: string;
      TransactionReference: string;
      BankTransactionCode: {
        Code: string;
        SubCode: string;
      };
    }>
  };
}

interface BankConnection {
  id: string;
  userId: string;
  bankId: string;
  accessToken: string | null;
  // refreshToken é opcional, pois alguns bancos não o usam
  refreshToken?: string | null;
  expiresAt: Date | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  status?: string;
  consentId?: string | null;
}

// Interface para a resposta da API do Banco do Brasil
export interface BBExtractResponse {
  numeroPaginaAtual: number;
  quantidadeRegistroPaginaAtual: number;
  numeroPaginaAnterior: number;
  numeroPaginaProximo: number;
  quantidadeTotalPagina: number;
  quantidadeTotalRegistro: number;
  listaLancamento: BBTransaction[];
}

export interface BBTransaction {
  indicadorTipoLancamento: "1" | "2";  // 1-Efetivados, 2-Futuros
  dataLancamento: number;             // Formato DDMMAAAA
  dataMovimento?: number;             // Formato DDMMAAAA
  codigoAgenciaOrigem?: number;
  numeroLote?: number;
  numeroDocumento?: number;
  codigoHistorico?: number;
  textoDescricaoHistorico: string;
  valorLancamento: number;
  indicadorSinalLancamento: "D" | "C";  // D-Débito, C-Crédito
  textoInformacaoComplementar?: string;
  numeroCpfCnpjContrapartida?: number;
  indicadorTipoPessoaContrapartida?: "F" | "J";
  codigoBancoContrapartida?: number;
  codigoAgenciaContrapartida?: number;
  numeroContaContrapartida?: string;
  textoDvContaContrapartida?: string;
}

/**
 * Serviço para integração com o Banco do Brasil
 * Implementa padrão Singleton para garantir uma única instância
 */
export class BBIntegrationService {
  private static instance: BBIntegrationService;
  private certsDir: string;

  private constructor() {
    // Inicializar diretório de certificados do ambiente
    // Usar caminho absoluto para os certificados
    const projectRoot = process.cwd(); // Obtém o diretório raiz do projeto
    this.certsDir = process.env.CERTS_DIR || join(projectRoot, "certs");
    
  }

  /**
   * Obter a instância única do serviço
   */
  static getInstance(): BBIntegrationService {
    if (!BBIntegrationService.instance) {
      BBIntegrationService.instance = new BBIntegrationService();
    }
    return BBIntegrationService.instance;
  }

  /**
   * Cria um agente HTTPS com os certificados necessários para mTLS
   * @param certPaths Caminhos opcionais para os certificados
   */
  private createHttpsAgent(certPaths?: { ca: string; cert: string; key: string }): Agent {
    try {
      
      
      // Definir caminhos dos certificados
      const caCertPath = certPaths?.ca || join(this.certsDir, 'ca.cer');
      const certPath = certPaths?.cert || join(this.certsDir, 'cert.pem');
      const keyPath = certPaths?.key || join(this.certsDir, 'private.key');

      
      // Verificar se o diretório de certificados existe
      if (!existsSync(this.certsDir)) {
        console.error('[BB_INTEGRATION] Diretório de certificados não encontrado:', this.certsDir);
        throw new Error(`Diretório de certificados não encontrado: ${this.certsDir}`);
      }
      
      // Verificar se os arquivos de certificado existem
      if (!existsSync(caCertPath)) {
        console.error('[BB_INTEGRATION] Certificado CA não encontrado:', caCertPath);
        throw new Error(`Certificado CA não encontrado: ${caCertPath}`);
      }
      
      if (!existsSync(certPath)) {
        console.error('[BB_INTEGRATION] Certificado do cliente não encontrado:', certPath);
        throw new Error(`Certificado do cliente não encontrado: ${certPath}`);
      }
      
      if (!existsSync(keyPath)) {
        console.error('[BB_INTEGRATION] Chave privada não encontrada:', keyPath);
        throw new Error(`Chave privada não encontrada: ${keyPath}`);
      }
      
      // Carregar certificados
      const ca = readFileSync(caCertPath);
      const cert = readFileSync(certPath);
      const key = readFileSync(keyPath);
      

      // Criar agente HTTPS com os certificados e opções adicionais de segurança
      const agent = new https.Agent({
        ca,
        cert,
        key,
        rejectUnauthorized: true,
        ciphers: 'DEFAULT:!LOW:!EXP:!MD5:@STRENGTH',
        keepAlive: true,
        timeout: 30000
      });

      return agent;
    } catch (error) {
      console.error('[BB_INTEGRATION] Erro ao criar agente HTTPS:', error);
      throw error;
    }
  }

  /**
   * Carrega certificados a partir dos metadados da carteira ou conexão
   * @param walletId ID da carteira para buscar certificados
   * @returns Caminhos dos certificados
   */
  public async loadCertificatesFromWallet(walletId: string): Promise<{
    ca: string;
    cert: string;
    key: string;
    found: boolean;
  }> {
    try {
      // Buscar carteira
      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId }
      });
      
      if (!wallet) {
        console.error('[BB_INTEGRATION] Carteira não encontrada:', walletId);
        return {
          ca: join(this.certsDir, 'ca.cer'),
          cert: join(this.certsDir, 'cert.pem'),
          key: join(this.certsDir, 'private.key'),
          found: false
        };
      }
      
      // Extrair metadados
      const metadata = wallet.metadata as Record<string, any> || {};
      
      // Verificar se há certificados nos metadados
      if (metadata.certificates) {
        
        return {
          ca: metadata.certificates.ca || join(this.certsDir, 'ca.cer'),
          cert: metadata.certificates.cert || join(this.certsDir, 'cert.pem'),
          key: metadata.certificates.key || join(this.certsDir, 'private.key'),
          found: true
        };
      }
      
      return {
        ca: join(this.certsDir, 'ca.cer'),
        cert: join(this.certsDir, 'cert.pem'),
        key: join(this.certsDir, 'private.key'),
        found: false
      };
    } catch (error) {
      console.error('[BB_INTEGRATION] Erro ao carregar certificados da carteira:', error);
      return {
        ca: join(this.certsDir, 'ca.cer'),
        cert: join(this.certsDir, 'cert.pem'),
        key: join(this.certsDir, 'private.key'),
        found: false
      };
    }
  }

  /**
   * Exporta certificados a partir de strings Base64 nos metadados
   * @param walletId ID da carteira
   * @returns Caminhos para os certificados exportados
   */
  public async exportCertificatesFromBase64(walletId: string): Promise<{
    ca: string;
    cert: string;
    key: string;
    success: boolean;
  }> {
    try {
      
      // Buscar carteira
      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId }
      });
      
      if (!wallet) {
        console.error('[BB_INTEGRATION] Carteira não encontrada:', walletId);
        return {
          ca: join(this.certsDir, 'ca.cer'),
          cert: join(this.certsDir, 'cert.pem'),
          key: join(this.certsDir, 'private.key'),
          success: false
        };
      }
      
      // Extrair metadados
      const metadata = wallet.metadata as Record<string, any> || {};
      
      // Verificar se há certificados em Base64 nos metadados
      if (!metadata.certificatesBase64) {
        console.log('[BB_INTEGRATION] Nenhum certificado Base64 encontrado nos metadados');
        return {
          ca: join(this.certsDir, 'ca.cer'),
          cert: join(this.certsDir, 'cert.pem'),
          key: join(this.certsDir, 'private.key'),
          success: false
        };
      }
      
      const base64Certs = metadata.certificatesBase64;
      
      // Verificar o novo formato de caminho: certs/[walletId]/
      const newFormatDir = join(this.certsDir, walletId);
      
      // Verificar o formato legado: certs/wallet-[walletId]/
      const legacyFormatDir = join(this.certsDir, `wallet-${walletId}`);
      
      // Verificar qual formato existe no disco
      const newFormatExists = existsSync(newFormatDir);
      const legacyFormatExists = existsSync(legacyFormatDir);
      
      // Decidir qual diretório usar
      let tempDir: string;
      
      if (newFormatExists) {
        // Usar o novo formato se existir
        tempDir = newFormatDir;
        console.log(`[BB_INTEGRATION] Usando diretório existente no novo formato: ${tempDir}`);
      } else if (legacyFormatExists) {
        // Usar o formato legado se existir
        tempDir = legacyFormatDir;
        console.log(`[BB_INTEGRATION] Usando diretório existente no formato legado: ${tempDir}`);
      } else {
        // Criar no novo formato caso nenhum exista
        tempDir = newFormatDir;
        console.log(`[BB_INTEGRATION] Criando diretório no novo formato: ${tempDir}`);
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Caminhos para os certificados exportados
      const caCertPath = join(tempDir, 'ca.cer');
      const certPath = join(tempDir, 'cert.pem');
      const keyPath = join(tempDir, 'private.key');
      
      // Exportar certificados
      if (base64Certs.ca) {
        fs.writeFileSync(caCertPath, Buffer.from(base64Certs.ca, 'base64'));
      }
      
      if (base64Certs.cert) {
        fs.writeFileSync(certPath, Buffer.from(base64Certs.cert, 'base64'));
      }
      
      if (base64Certs.key) {
        fs.writeFileSync(keyPath, Buffer.from(base64Certs.key, 'base64'));
      }
      
      
      return {
        ca: caCertPath,
        cert: certPath,
        key: keyPath,
        success: true
      };
    } catch (error) {
      console.error('[BB_INTEGRATION] Erro ao exportar certificados:', error);
      return {
        ca: join(this.certsDir, 'ca.cer'),
        cert: join(this.certsDir, 'cert.pem'),
        key: join(this.certsDir, 'private.key'),
        success: false
      };
    }
  }

  // Restante dos métodos existentes na classe...
} 
