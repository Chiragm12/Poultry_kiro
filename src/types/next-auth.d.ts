import { UserRole } from "@prisma/client"
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: UserRole
      organizationId: string
      organizationName: string
    }
  }

  interface User {
    role: UserRole
    organizationId: string
    organizationName: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    organizationId: string
    organizationName: string
  }
}