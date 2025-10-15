import { NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Função para garantir que o diretório de certificados existe
async function ensureCertsDirectory() {
  const certsDir = join(process.cwd(), "certs");
  if (!existsSync(certsDir)) {
    await mkdir(certsDir, { recursive: true });
  }
  return certsDir;
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Verificar se a requisição é multipart/form-data
    const formData = await request.formData();
    
    // Recuperar os arquivos
    const ca = formData.get("ca") as File | null;
    const cert = formData.get("cert") as File | null;
    const key = formData.get("key") as File | null;

    // Verificar se todos os certificados foram enviados
    if (!ca || !cert || !key) {
      return NextResponse.json(
        { error: "Todos os certificados são obrigatórios" },
        { status: 400 }
      );
    }

    // Garantir que o diretório de certificados existe
    const certsDir = await ensureCertsDirectory();

    // Salvar os arquivos
    const filePaths = {
      ca: join(certsDir, "ca.cer"),
      cert: join(certsDir, "cert.pem"),
      key: join(certsDir, "private.key"),
    };

    // Converter cada arquivo para um ArrayBuffer e salvá-lo
    const caBuffer = await ca.arrayBuffer();
    const certBuffer = await cert.arrayBuffer();
    const keyBuffer = await key.arrayBuffer();

    await writeFile(filePaths.ca, Buffer.from(caBuffer));
    await writeFile(filePaths.cert, Buffer.from(certBuffer));
    await writeFile(filePaths.key, Buffer.from(keyBuffer));

    // Log informações para debug (remover em produção)
    console.log("[CERTIFICATES_SAVED]", {
      ca: filePaths.ca,
      cert: filePaths.cert,
      key: filePaths.key,
    });

    return NextResponse.json({
      message: "Certificados salvos com sucesso",
      paths: {
        ca: "certs/ca.cer",
        cert: "certs/cert.pem",
        key: "certs/private.key",
      },
    });
  } catch (error) {
    console.error("[CERTIFICATES_ERROR]", error);
    return NextResponse.json(
      { error: "Erro ao processar os certificados" },
      { status: 500 }
    );
  }
} 
