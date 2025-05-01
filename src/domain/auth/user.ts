import { ObjectId } from 'mongodb';
import { UserRole } from './roles';

export interface User {
  _id?: ObjectId;
  FirstName: string;
  LastName: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
} 