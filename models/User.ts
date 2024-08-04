import { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "CHEF" | "MANAGER" | "STAFF";
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CHEF" | "MANAGER" | "STAFF";
}
