import { ObjectId } from "mongodb";
import { UserRole } from "./Roles";

export interface User {
  _id: ObjectId;
  FirstName: string;
  LastName: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeUser {
  id: string;
  FirstName: string;
  LastName: string;
  email: string;
  role: UserRole;
}