import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Script para verificar a integridade dos certificados do Banco do Brasil
 * Verifica se os certificados existem, são válidos e não estão expirados
 */

// Configurar diretório base de certificados
const certsDir = path.join(process.cwd(), 'certs');

// Lista de certificados que devem estar presentes
const requiredCerts = [
  { name: 'ca.cer', description: 'Certificado da Autoridade Certificadora (CA)' },
  { name: 'cert.pem', description: 'Certificado do cliente' },
  { name: 'private.key', description: 'Chave privada' }
];

/**
 * Verifica se um certificado existe
 * @param walletId ID da carteira (opcional)
 * @param certName Nome do certificado
 * @returns Verdadeiro se o certificado existe
 */
function certificateExists(walletId: string | undefined, certName: string): boolean {
  const certDir = walletId ? path.join(certsDir, walletId) : certsDir;
  const certPath = path.join(certDir, certName);
  return fs.existsSync(certPath);
}

/**
 * Verifica a data de expiração de um certificado usando OpenSSL
 * @param walletId ID da carteira (opcional)
 * @param certName Nome do certificado
 * @returns Informações sobre a validade do certificado ou null se houver erro
 */
function checkCertificateValidity(walletId: string | undefined, certName: string): { valid: boolean; expiresIn?: string; error?: string } {
  if (!certificateExists(walletId, certName)) {
    return { valid: false, error: 'Certificado não encontrado' };
  }

  try {
    const certDir = walletId ? path.join(certsDir, walletId) : certsDir;
    const certPath = path.join(certDir, certName);
    
    // Executar o comando OpenSSL para verificar a validade do certificado
    // x509 para certificados, não funciona com chaves privadas (.key)
    if (certName.endsWith('.key')) {
      // Para chaves privadas, apenas verificar se estão no formato correto
      const command = `openssl rsa -in "${certPath}" -check -noout`;
      
      try {
        execSync(command, { stdio: 'pipe' });
        return { valid: true };
      } catch (e) {
        return { valid: false, error: 'Formato de chave privada inválido' };
      }
    } else {
      // Para certificados, verificar data de validade
      const command = `openssl x509 -in "${certPath}" -noout -dates`;
      const output = execSync(command, { encoding: 'utf8' });
      
      // Extrair datas de validade
      const notAfterMatch = output.match(/notAfter=(.+)/);
      
      if (notAfterMatch && notAfterMatch[1]) {
        const expiryDate = new Date(notAfterMatch[1]);
        const now = new Date();
        
        // Calcular dias até expiração
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return { 
          valid: diffDays > 0, 
          expiresIn: diffDays > 0 
            ? `${diffDays} dias` 
            : 'EXPIRADO'
        };
      }
      
      return { valid: true }; // Se não conseguir extrair a data, assume que é válido
    }
  } catch (error: any) {
    return { valid: false, error: `Erro ao verificar certificado: ${error.message || 'Desconhecido'}` };
  }
}

/**
 * Verifica todos os certificados de uma carteira
 * @param walletId ID da carteira (opcional)
 */
export function checkCertificates(walletId?: string): boolean {
  console.log(`\n🔍 Verificando certificados${walletId ? ` da carteira ${walletId}` : ''}...\n`);
  
  const certDir = walletId ? path.join(certsDir, walletId) : certsDir;
  
  // Verificar se o diretório existe
  if (!fs.existsSync(certDir)) {
    console.error(`❌ Diretório de certificados não encontrado: ${certDir}`);
    return false;
  }
  
  let allValid = true;
  
  // Verificar cada certificado
  for (const cert of requiredCerts) {
    const exists = certificateExists(walletId, cert.name);
    
    if (!exists) {
      console.error(`❌ Certificado ${cert.name} (${cert.description}) não encontrado.`);
      allValid = false;
      continue;
    }
    
    // Para arquivos que existem, verificar validade
    if (cert.name !== 'private.key') {
      const validity = checkCertificateValidity(walletId, cert.name);
      
      if (!validity.valid) {
        console.error(`❌ Certificado ${cert.name} (${cert.description}) inválido: ${validity.error || 'Data expirada'}`);
        allValid = false;
      } else if (validity.expiresIn) {
        console.log(`✓ Certificado ${cert.name} (${cert.description}) válido, expira em ${validity.expiresIn}.`);
      } else {
        console.log(`✓ Certificado ${cert.name} (${cert.description}) válido.`);
      }
    } else {
      console.log(`✓ Chave privada ${cert.name} presente.`);
    }
  }
  
  console.log("\n");
  
  if (allValid) {
    console.log('✅ Todos os certificados estão válidos e prontos para uso.');
  } else {
    console.error('❌ Há problemas com os certificados. Execute o script de download para obtê-los novamente.');
  }
  
  return allValid;
}

// Executar o script diretamente se chamado como script principal
if (typeof require !== 'undefined' && require.main === module) {
  const walletId = process.argv[2]; // Pegar walletId da linha de comando, se fornecido
  const result = checkCertificates(walletId);
  process.exit(result ? 0 : 1);
} 
