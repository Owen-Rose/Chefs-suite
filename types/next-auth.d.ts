import "next-auth";
import { AuthUser } from "./types/User";

declare module "next-auth" {
  interface Session {
    user: AuthUser;
  }
}
