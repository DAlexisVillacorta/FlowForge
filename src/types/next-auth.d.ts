import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      orgId: string | null;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    orgId: string | null;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    orgId: string | null;
    role: Role;
  }
}
