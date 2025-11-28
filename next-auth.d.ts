import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      isSuperAdmin: boolean;
      organizationRole?: Role;
      organizationId?: string;
      storeRole?: Role;
      storeId?: string;
      permissions: string[];
    };
  }
  interface User {
    id: string;
    isSuperAdmin: boolean;
    organizationRole?: Role;
    organizationId?: string;
    storeRole?: Role;
    storeId?: string;
  }
}
