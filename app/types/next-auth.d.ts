import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

export enum SubscriptionPlan {
  FREE = "FREE",
  BASIC = "BASIC",
  PREMIUM = "PREMIUM",
  ENTERPRISE = "ENTERPRISE"
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image?: string
      role: "USER" | "ADMIN" | "SUPERADMIN"
      subscriptionPlan: SubscriptionPlan
      planExpiresAt?: Date
      isActive: boolean
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    name: string
    email: string
    image?: string
    role: "USER" | "ADMIN" | "SUPERADMIN"
    subscriptionPlan: SubscriptionPlan
    planExpiresAt?: Date
    isActive: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    name: string
    email: string
    image?: string
    role: "USER" | "ADMIN" | "SUPERADMIN"
    subscriptionPlan: SubscriptionPlan
    planExpiresAt?: Date
    isActive: boolean
  }
}
