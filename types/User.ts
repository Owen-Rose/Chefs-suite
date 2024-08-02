import { UserRole } from "./Roles";

export interface User {
  uid: string;
  email: string;
  password: string;
  FirstName: string;
  LastName: string;
  role: UserRole;
}
