import fs from 'fs';
import https from 'https';
import { Agent } from 'https';
import path from 'path';
import { join } from 'path';
import { prisma } from '../prisma';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';

/**
 * Converte um certificado PKCS#12 para formato PEM
 * @param certPath Caminho do certificado
 * @returns Conteúdo do certificado em formato PEM
 */
function convertPkcs12ToPem(certPath: string): string {
  try {
    const certContent = readFileSync(certPath, 'utf8');
    
    // Se já estiver no formato PEM, retornar como está
    if (certContent.includes('-----BEGIN CERTIFICATE-----') || 
        certContent.includes('-----BEGIN PRIVATE KEY-----')) {
      return certContent;
    }
    
    // Se estiver no formato PKCS#12, converter para PEM
    if (certContent.includes('Bag Attributes')) {
      console.log(`[BB_INTEGRATION] Certificado ${certPath} está no formato PKCS com Bag Attributes, extraindo seção PEM...`);
      
      const beginMarker = '-----BEGIN';
      const endMarker = '-----END';
      
      const beginIndex = certContent.indexOf(beginMarker);
      if (beginIndex === -1) {
        console.log(`[BB_INTEGRATION] Não foi possível encontrar o marcador "${beginMarker}" no certificado`);
        return certContent;
      }
      
      const endIndex = certContent.lastIndexOf(endMarker);
      if (endIndex === -1) {
        console.log(`[BB_INTEGRATION] Não foi possível encontrar o marcador "${endMarker}" no certificado`);
        return certContent;
      }
      
      // Extrair a parte do certificado entre BEGIN e END (inclusive)
      const endLineIndex = certContent.indexOf('\n', endIndex);
      const extractedContent = certContent.substring(beginIndex, endLineIndex !== -1 ? endLineIndex : undefined);
      
      console.log(`[BB_INTEGRATION] Certificado extraído com sucesso, tamanho: ${extractedContent.length} caracteres`);
      return extractedContent;
    }
    
    return certContent;
  } catch (error) {
    console.error('[BB_INTEGRATION] Erro ao converter certificado:', error);
    throw error;
  }
}

/**
 * Cria um agente HTTPS com os certificados necessários para mTLS
 * @param certPaths Caminhos para os certificados
 * @returns Agente HTTPS configurado
 */
export function createHttpsAgent(certPaths?: { ca: string; cert: string; key: string }): Agent {
  if (!certPaths) {
    throw new Error('É necessário fornecer caminhos de certificados válidos. Nenhum certificado padrão está disponível.');
  }
  
  try {
    // Verificar se os certificados existem
    const certFiles = [
      { name: 'CA Certificate', path: certPaths.ca },
      { name: 'Client Certificate', path: certPaths.cert },
      { name: 'Private Key', path: certPaths.key }
    ];
    
    const missingCerts = certFiles.filter(cert => !existsSync(cert.path));
    
    if (missingCerts.length > 0) {
      const missing = missingCerts.map(c => c.name).join(', ');
      console.error(`[BB_INTEGRATION] Certificados não encontrados: ${missing}`);
      throw new Error(`Certificados não encontrados: ${missing}`);
    }
    
    // Carregar certificados como Buffer
    const ca = readFileSync(certPaths.ca);
    const cert = readFileSync(certPaths.cert);
    const key = readFileSync(certPaths.key);
    
    // Verificar se os certificados têm conteúdo
    if (!ca || !cert || !key) {
      throw new Error('[BB_INTEGRATION] Um ou mais certificados estão vazios');
    }

    // Criar agente HTTPS com configurações otimizadas
    const agent = new https.Agent({
      ca: ca,
      cert: cert,
      key: key,
      rejectUnauthorized: true,
      ciphers: 'DEFAULT:!LOW:!EXP:!MD5:@STRENGTH',
      keepAlive: true,
      timeout: 30000 // 30 segundos
    });
    
    return agent;
  } catch (error) {
    console.error('[BB_INTEGRATION_ERROR] Erro ao criar agente HTTPS:', error);
    throw error;
  }
}

/**
 * Prepara os certificados para serem usados nas requisições HTTPS
 */
export async function prepareCertificates(context: string, walletId: string): Promise<{ ca: string; cert: string; key: string }> {
  try {
    console.log(`[${context}] Preparando certificados para a carteira:`, walletId);
    
    // Obter o diretório onde estão os certificados para a carteira
    const certsDir = getWalletCertsDir(join(process.cwd(), 'certs'), walletId);
    
    // Obter os caminhos para os certificados
    const certPaths = getCertPathsForWallet(join(process.cwd(), 'certs'), walletId);
    
    // Verificar se os arquivos de certificado existem
    let caExists = false;
    let certExists = false;
    let keyExists = false;
    
    try {
      caExists = existsSync(certPaths.ca);
      certExists = existsSync(certPaths.cert);
      keyExists = existsSync(certPaths.key);
    } catch (error) {
      console.warn(`[${context}] Erro ao verificar existência dos certificados:`, error);
    }
    
    console.log(`[${context}] Status dos certificados:`, {
      certsDir,
      caCaminho: certPaths.ca,
      certCaminho: certPaths.cert,
      keyCaminho: certPaths.key,
      caExiste: caExists,
      certExiste: certExists,
      keyExiste: keyExists
    });
    
    if (caExists && certExists && keyExists) {
      console.log(`[${context}] Certificados da carteira encontrados e serão utilizados.`);
      
      // Ler os certificados como Buffer
      const ca = readFileSync(certPaths.ca);
      const cert = readFileSync(certPaths.cert);
      const key = readFileSync(certPaths.key);
      
      return { 
        ca: certPaths.ca,
        cert: certPaths.cert,
        key: certPaths.key
      };
    }
    

    
    // Se não estamos em desenvolvimento, falhar com erro
    throw new Error(`[${context}] Certificados não encontrados para a carteira ${walletId}`);
  } catch (error) {
    console.error(`[${context}_ERROR] Erro ao preparar certificados:`, error);
    throw error;
  }
}

/**
 * Obtém os caminhos para os certificados de uma carteira específica
 * @param certsDir Diretório base de certificados
 * @param walletId ID da carteira
 * @returns Caminhos para os certificados
 */
export function getCertPathsForWallet(certsDir: string, walletId: string): { ca: string; cert: string; key: string } {
  const walletDir = getWalletCertsDir(certsDir, walletId);
  return {
    ca: join(walletDir, 'ca.cer'),
    cert: join(walletDir, 'cert.pem'),
    key: join(walletDir, 'private.key')
  };
}

/**
 * Obtém o diretório de certificados para uma carteira específica
 * @param certsDir Diretório base de certificados
 * @param walletId ID da carteira
 * @returns Caminho para o diretório de certificados
 */
export function getWalletCertsDir(certsDir: string, walletId: string): string {
  try {
    // Diretório no padrão: certs/[walletId]/
    const walletDir = join(certsDir, walletId);
    
    // Verificar se o diretório existe, caso contrário criar
    if (!existsSync(walletDir)) {
      fs.mkdirSync(walletDir, { recursive: true });
    }
    
    return walletDir;
  } catch (error: any) {
    console.error(`[BB_INTEGRATION] Erro ao acessar diretório de certificados:`, error);
    throw new Error(`Erro ao acessar diretório de certificados: ${error.message}`);
  }
}

/**
 * Carrega certificados de uma carteira específica
 * @param walletId ID da carteira
 * @returns Caminhos dos certificados e flag indicando se foram encontrados
 */
export async function loadCertificatesFromWallet(walletId: string): Promise<{
  ca: string;
  cert: string;
  key: string;
  found: boolean;
}> {
  // Obter diretório base de certificados
  const certsDir = join(process.cwd(), 'certs');
  
  // Obter caminhos dos certificados da carteira
  const certPaths = getCertPathsForWallet(certsDir, walletId);
  
  // Verificar se os arquivos existem
  const caExists = existsSync(certPaths.ca);
  const certExists = existsSync(certPaths.cert);
  const keyExists = existsSync(certPaths.key);
  
  const found = caExists && certExists && keyExists;
  
  return {
    ...certPaths,
    found
  };
}

/**
 * Exporta certificados em formato Base64 para arquivos
 * @param walletId ID da carteira
 * @returns Caminhos dos certificados exportados e flag de sucesso
 */
export async function exportCertificatesFromBase64(walletId: string): Promise<{
  ca: string;
  cert: string;
  key: string;
  success: boolean;
}> {
  // Obter diretório base de certificados
  const certsDir = join(process.cwd(), 'certs');
  
  // Obter caminhos dos certificados da carteira
  const certPaths = getCertPathsForWallet(certsDir, walletId);
  
  // Inicializar resultado
  const result = {
    ...certPaths,
    success: false
  };
  
  if (!walletId) {
    return result;
  }
  
  try {
    
    // Buscar carteira
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      include: {
        // Buscar banco associado à carteira
        bank: true
      }
    });
    
    if (!wallet || !wallet.metadata) {
      console.log('[BB_INTEGRATION] Carteira não encontrada ou sem metadados:', walletId);
      return result;
    }
    
    // Verificar se há certificados em Base64 nos metadados
    const metadata = wallet.metadata as Record<string, any>;
    
    if (!metadata.certificates || 
        !metadata.certificates.caBase64 || 
        !metadata.certificates.certBase64 || 
        !metadata.certificates.keyBase64) {
      return result;
    }
    
    // Criar diretório da carteira se não existir
    const walletDir = getWalletCertsDir(certsDir, walletId);
    
    // Decodificar e salvar certificados
    fs.writeFileSync(certPaths.ca, Buffer.from(metadata.certificates.caBase64, 'base64'));
    fs.writeFileSync(certPaths.cert, Buffer.from(metadata.certificates.certBase64, 'base64'));
    fs.writeFileSync(certPaths.key, Buffer.from(metadata.certificates.keyBase64, 'base64'));
    
    // Definir permissões adequadas para a chave privada
    fs.chmodSync(certPaths.key, 0o600);
    
    // Verificar se os arquivos foram criados corretamente
    const caExists = existsSync(certPaths.ca) && fs.statSync(certPaths.ca).size > 0;
    const certExists = existsSync(certPaths.cert) && fs.statSync(certPaths.cert).size > 0;
    const keyExists = existsSync(certPaths.key) && fs.statSync(certPaths.key).size > 0;
    
    result.success = caExists && certExists && keyExists;
    
    return result;
  } catch (error) {
    console.error('[BB_INTEGRATION] Erro ao exportar certificados:', error);
    return result;
  }
}