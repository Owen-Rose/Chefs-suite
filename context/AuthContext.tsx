import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebaseConfig";

interface User extends FirebaseUser {
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const devMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

    if (devMode) {
      setUser({
        uid: "dev-uid",
        email: "dev@example.com",
        displayName: "Developer",
        role: "ADMIN",
      } as User);
    } else {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const idTokenResult = await firebaseUser.getIdTokenResult();
          setUser({
            ...firebaseUser,
            role: idTokenResult.claims.role as string,
          });
        } else {
          setUser(null);
        }
      });
      return unsubscribe;
    }
  }, []);

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const idTokenResult = await userCredential.user.getIdTokenResult();
    setUser({
      ...userCredential.user,
      role: idTokenResult.claims.role as string,
    });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };
