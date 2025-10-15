import fs from 'fs';
import path from 'path';

function extractPemSection(content: string): string {
  const beginMarker = '-----BEGIN';
  const endMarker = '-----END';
  
  const beginIndex = content.indexOf(beginMarker);
  if (beginIndex === -1) {
    return content;
  }
  
  const endIndex = content.lastIndexOf(endMarker);
  if (endIndex === -1) {
    return content;
  }
  
  // Extrair a parte do certificado entre BEGIN e END (inclusive)
  const endLineIndex = content.indexOf('\n', endIndex);
  const extractedContent = content.substring(beginIndex, endLineIndex !== -1 ? endLineIndex : undefined);
  
  return extractedContent;
}

function fixCertificate(walletId: string) {
  const certsDir = path.join(process.cwd(), 'certs', walletId);
  const certPath = path.join(certsDir, 'cert.pem');
  const keyPath = path.join(certsDir, 'private.key');
  
  console.log(`[FIX_CERTS] Corrigindo certificados para carteira: ${walletId}`);
  
  // Ler o conteúdo do certificado
  const certContent = fs.readFileSync(certPath);
  const fixedCert = extractPemSection(certContent.toString('utf8'));
  fs.writeFileSync(certPath, fixedCert);
  console.log('[FIX_CERTS] Certificado corrigido');
  
  // Ler e corrigir chave privada
  const keyContent = fs.readFileSync(keyPath, 'utf8');
  const fixedKey = extractPemSection(keyContent);
  fs.writeFileSync(keyPath, fixedKey);
  console.log('[FIX_CERTS] Chave privada corrigida');
  
  // Ajustar permissões da chave privada
  fs.chmodSync(keyPath, 0o600);
  console.log('[FIX_CERTS] Permissões da chave privada ajustadas');
}

// ID da carteira para corrigir
const walletId = 'cm80v4mr50002gmfb0qzmdrgv';
fixCertificate(walletId); 
