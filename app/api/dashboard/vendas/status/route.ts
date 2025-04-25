import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  const isAuthenticated = !!session?.user;
  
  return NextResponse.json({
    status: "online",
    timestamp: new Date().toISOString(),
    authenticated: isAuthenticated,
    user: isAuthenticated ? {
      id: session.user.id,
      email: session.user.email,
    } : null
  });
} 