import React, { createContext, useContext, ReactNode } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { UserRole } from "../types/Roles";

interface SafeUser {
  id: string;
  email: string | null | undefined;
  name: string | null | undefined;
  role: UserRole;
}

interface AuthContextType {
  user: SafeUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { data: session } = useSession();

  const user: SafeUser | null = session?.user
    ? {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as UserRole,
    }
    : null;

  const login = async (email: string, password: string) => {
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      throw new Error(result.error);
    }
  };

  const logout = async () => {
    await signOut();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
