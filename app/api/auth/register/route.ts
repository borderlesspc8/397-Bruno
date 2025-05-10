import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const { name, email, password } = registerSchema.parse(body);

    // Verificar se o usuário já existe
    const userExists = await db.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return NextResponse.json(
        { message: "Este email já está em uso" },
        { status: 409 }
      );
    }

    // Hash da senha
    const hashedPassword = await hash(password, 10);

    // Criar usuário
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        authProvider: "EMAIL",
      },
    });

    // Remover a senha do objeto retornado
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: "Usuário criado com sucesso", 
        user: userWithoutPassword 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 