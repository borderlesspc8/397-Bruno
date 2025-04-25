import { NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { z } from "zod";
import { existsSync } from "fs";
import { join } from "path";
import { revalidatePath } from "next/cache";

// Validação dos parâmetros
const bbConnectionSchema = z.object({
  applicationKey: z.string().min(1, "Chave da aplicação é obrigatória"),
  clientBasic: z.string().min(1, "Client Basic é obrigatório"),
  clientId: z.string().min(1, "Client ID é obrigatório"),
  clientSecret: z.string().min(1, "Client Secret é obrigatório"),
  apiUrl: z.string().url("URL da API inválida"),
  agencia: z.string().min(1, "Agência é obrigatória"),
  conta: z.string().min(1, "Conta é obrigatória"),
});

export async function POST(request: Request) {
  try {
    const { user } = await getAuthSession();

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "Não autorizado ou email do usuário não disponível" },
        { status: 401 }
      );
    }

    // Buscar o usuário pelo email para garantir que estamos usando o ID correto
    const dbUser = await prisma.user.findUnique({
      where: {
        email: user.email
      }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado no banco de dados" },
        { status: 404 }
      );
    }

    // Log para debug
    console.log("ID do usuário na sessão:", user.id);
    console.log("ID do usuário no banco:", dbUser.id);

    // Verificar se os certificados existem
    const certsDir = join(process.cwd(), "certs");
    const caPath = join(certsDir, "ca.cer");
    const certPath = join(certsDir, "cert.pem");
    const keyPath = join(certsDir, "private.key");

    const certFilesExist = 
      existsSync(caPath) && 
      existsSync(certPath) && 
      existsSync(keyPath);
    
    if (!certFilesExist) {
      return NextResponse.json(
        { error: "Certificados não encontrados. Por favor, envie os certificados primeiro." },
        { status: 400 }
      );
    }

    // Atualizar o parse da requisição
    const body = await request.json();
    const { applicationKey, clientBasic, clientId, clientSecret, apiUrl, agencia, conta } = body;

    // Validar que todos os campos obrigatórios foram fornecidos
    if (!applicationKey || !clientBasic || !clientId || !clientSecret || !agencia || !conta) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 });
    }

    // Buscar ou criar o banco "Banco do Brasil" no sistema
    let bankBB = await prisma.bank.findFirst({
      where: {
        name: "Banco do Brasil",
      },
    });

    if (!bankBB) {
      // Criar o banco caso não exista
      await prisma.bank.create({
        data: {
          name: "Banco do Brasil",
          logo: "/banks/bb.svg" // Substituído por svg
        },
      });
      
      bankBB = await prisma.bank.findFirst({
        where: {
          name: "Banco do Brasil",
        },
      });
    }

    // Verificar se já existe conexão para esse banco/usuário
    const existingWallet = await prisma.wallet.findFirst({
      where: {
        userId: dbUser.id,
        bankId: bankBB?.id,
        type: "BANK_INTEGRATION"
      }
    });

    let wallet;

    if (existingWallet) {
      // Atualizar carteira existente
      wallet = await prisma.wallet.update({
        where: {
          id: existingWallet.id
        },
        data: {
          metadata: {
            ...(existingWallet.metadata as Record<string, any> || {}),
            integration: "BB_DIRECT",
            lastSync: new Date().toISOString(),
            agencia,
            conta,
            clientId,
            clientSecret,
            applicationKey,
            clientBasic,
            apiUrl,
            certPaths: {
              ca: "certs/ca.cer",
              cert: "certs/cert.pem",
              key: "certs/private.key"
            }
          }
        }
      });
    } else {
      // Criar nova carteira
      wallet = await prisma.wallet.create({
        data: {
          name: "Banco do Brasil",
          type: "BANK_INTEGRATION",
          balance: 0,
          bankId: bankBB?.id,
          userId: dbUser.id,
          metadata: {
            integration: "BB_DIRECT",
            lastSync: new Date().toISOString(),
            agencia,
            conta,
            clientId,
            clientSecret,
            applicationKey,
            clientBasic,
            apiUrl,
            certPaths: {
              ca: "certs/ca.cer",
              cert: "certs/cert.pem",
              key: "certs/private.key"
            }
          }
        }
      });

      console.log(`[BB_CONNECT_SUCCESS] Carteira criada com sucesso. Agência: ${agencia}, Conta: ${conta}, UserId: ${dbUser.id}`);
    }

    // Logs antes de criar carteira
    console.log("[BB_CONNECT] Verificando carteira existente:", !!existingWallet);
    
    // Após criar/atualizar carteira
    console.log("[BB_CONNECT] Carteira criada/atualizada com sucesso:", wallet.id);
    
    // Antes de fazer revalidação
    console.log("[BB_CONNECT] Revalidando páginas");
    
    // Adicionar após a criação bem-sucedida da carteira, antes do return
    // Forçar revalidação das páginas
    revalidatePath('/wallets');
    revalidatePath('/dashboard');
    revalidatePath(`/wallets/${wallet.id}`);

    return NextResponse.json({
      success: true,
      message: "Conexão com Banco do Brasil configurada com sucesso!",
      wallet: {
        id: wallet.id,
        name: wallet.name,
      }
    });
  } catch (error) {
    console.error("[BB_CONNECT_ERROR] Erro detalhado:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    // Adicionando mais informações de erro
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Falha ao conectar com Banco do Brasil",
        details: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
} 