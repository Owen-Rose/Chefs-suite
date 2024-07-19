import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

        if (devMode) {
            // Mock user for development mode
            setUser({
                uid: 'dev-uid',
                email: 'dev@example.com',
                displayName: 'Developer',
            } as User);
        } else {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                setUser(user);
            });
            return unsubscribe;
        }
    }, []);

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        await signOut(auth);
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
        throw new Error("useauth must be used within an AuthProvider");
    }
    return context;
};

export { AuthProvider, useAuth };

