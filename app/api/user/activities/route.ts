import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/app/_lib/prisma";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


// Tipos para o histórico de atividades
interface ActivityItem {
  id: string;
  description: string;
  type: "login" | "transaction" | "setting_change" | "account" | "security";
  timestamp: string; // ISO date string
  ipAddress: string;
  device: string;
  location: string;
}

// Dados mockados (em uma aplicação real viriam do banco de dados)
const mockActivityHistory: ActivityItem[] = [
  {
    id: "act-1",
    description: "Login bem-sucedido",
    type: "login",
    timestamp: "2023-05-15T14:30:00Z",
    ipAddress: "187.122.45.123",
    device: "Chrome em macOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-2",
    description: "Alteração de senha",
    type: "security",
    timestamp: "2023-05-14T18:15:00Z",
    ipAddress: "187.122.45.123",
    device: "Chrome em macOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-3",
    description: "Transferência realizada para Conta 4321-X",
    type: "transaction",
    timestamp: "2023-05-14T10:22:00Z",
    ipAddress: "187.122.45.123",
    device: "Safari em iOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-4",
    description: "Conexão com Banco do Brasil",
    type: "account",
    timestamp: "2023-05-13T09:15:00Z",
    ipAddress: "187.122.45.123",
    device: "Firefox em Windows",
    location: "Rio de Janeiro, Brasil"
  },
  {
    id: "act-5",
    description: "Alteração nas preferências de notificação",
    type: "setting_change",
    timestamp: "2023-05-12T16:40:00Z",
    ipAddress: "45.188.32.198",
    device: "Chrome em macOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-6",
    description: "Login bem-sucedido",
    type: "login",
    timestamp: "2023-05-12T11:05:00Z",
    ipAddress: "45.188.32.198",
    device: "Safari em iOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-7",
    description: "Atualização de dados pessoais",
    type: "setting_change",
    timestamp: "2023-05-10T14:32:00Z",
    ipAddress: "45.188.32.198",
    device: "Chrome em macOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-8",
    description: "Login bem-sucedido",
    type: "login",
    timestamp: "2023-05-10T14:20:00Z",
    ipAddress: "187.122.45.123",
    device: "Chrome em macOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-9",
    description: "Transferência realizada para Conta 7890-Y",
    type: "transaction",
    timestamp: "2023-05-09T09:55:00Z",
    ipAddress: "187.122.45.123",
    device: "Chrome em macOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-10",
    description: "Login bem-sucedido",
    type: "login",
    timestamp: "2023-05-08T17:12:00Z",
    ipAddress: "187.122.45.123",
    device: "Chrome em macOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-11",
    description: "Ativação de notificações por email",
    type: "setting_change",
    timestamp: "2023-05-07T12:18:00Z",
    ipAddress: "187.122.45.123",
    device: "Chrome em macOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-12",
    description: "Login bem-sucedido",
    type: "login",
    timestamp: "2023-05-07T12:15:00Z",
    ipAddress: "45.188.32.198",
    device: "Safari em iOS",
    location: "São Paulo, Brasil"
  },
];

// Comentando a exportação duplicada que está causando o erro
// export { dynamic, fetchCache, revalidate };

// GET /api/user/activities - Obter histórico de atividades do usuário
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Parâmetros de consulta
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "desc";

    // Em uma aplicação real, buscar do banco de dados
    // const activities = await prisma.userActivity.findMany({
    //   where: {
    //     userId: user.id,
    //     ...(type ? { type } : {}),
    //     ...(search ? {
    //       OR: [
    //         { description: { contains: search, mode: 'insensitive' } },
    //         { location: { contains: search, mode: 'insensitive' } },
    //         { device: { contains: search, mode: 'insensitive' } },
    //       ]
    //     } : {})
    //   },
    //   orderBy: {
    //     timestamp: sort === "asc" ? "asc" : "desc"
    //   },
    //   skip: (page - 1) * limit,
    //   take: limit,
    // });
    
    // const total = await prisma.userActivity.count({
    //   where: {
    //     userId: user.id,
    //     ...(type ? { type } : {}),
    //     ...(search ? {
    //       OR: [
    //         { description: { contains: search, mode: 'insensitive' } },
    //         { location: { contains: search, mode: 'insensitive' } },
    //         { device: { contains: search, mode: 'insensitive' } },
    //       ]
    //     } : {})
    //   }
    // });

    // Usando dados mockados para simulação
    let filteredActivities = [...mockActivityHistory];
    
    // Filtrar por tipo
    if (type && type !== "all") {
      filteredActivities = filteredActivities.filter(
        (activity) => activity.type === type
      );
    }
    
    // Filtrar por texto de busca
    if (search) {
      const searchLower = search.toLowerCase();
      filteredActivities = filteredActivities.filter(
        (activity) =>
          activity.description.toLowerCase().includes(searchLower) ||
          activity.location.toLowerCase().includes(searchLower) ||
          activity.device.toLowerCase().includes(searchLower)
      );
    }
    
    // Ordenar
    filteredActivities.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sort === "asc" ? dateA - dateB : dateB - dateA;
    });
    
    // Paginação
    const total = filteredActivities.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedActivities = filteredActivities.slice(startIndex, endIndex);
    
    return NextResponse.json({
      activities: paginatedActivities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar histórico de atividades:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico de atividades" },
      { status: 500 }
    );
  }
} 
