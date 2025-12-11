import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as AuthUser, AuthResult, autoLoginOperator, login as authLogin } from '../services/authService';

interface AuthContextType {
    currentUser: AuthUser | null;
    setCurrentUser: (user: AuthUser | null) => void;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<AuthResult>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const osUsername = window.electron?.getOsUsername();
                console.log('AuthContext: OS Username determined as:', osUsername);

                if (osUsername) {
                    // Try auto-login for operators
                    const result = await autoLoginOperator(osUsername);
                    if (result.success && result.user) {
                        console.log('AuthContext: Auto-login successful for', result.user.username);
                        setCurrentUser(result.user);
                    } else {
                        console.log('AuthContext: Auto-login not available, will require password');
                    }
                }
            } catch (error) {
                console.error('AuthContext: Error during auto-login', error);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (username: string, password: string): Promise<AuthResult> => {
        const result = await authLogin(username, password);
        if (result.success && result.user) {
            setCurrentUser(result.user);
        }
        return result;
    };

    const logout = () => {
        setCurrentUser(null);
    };

    return (
        <AuthContext.Provider value={{ currentUser, setCurrentUser, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
