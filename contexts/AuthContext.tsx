import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as AuthUser, AuthResult, syncMsalUser, logAccess } from '../services/authService';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "../src/authConfig";

interface AuthContextType {
    currentUser: AuthUser | null;
    setCurrentUser: (user: AuthUser | null) => void;
    unauthorizedUser: string | null;
    isLoading: boolean;
    login: () => Promise<AuthResult>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [unauthorizedUser, setUnauthorizedUser] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    useEffect(() => {
        const checkAuth = async () => {
            if (isAuthenticated && accounts.length > 0) {
                const account = accounts[0];
                try {
                    // Sync user with DB to ensure we have a valid ID for logs
                    const name = account.name || account.username;
                    const dbUser = await syncMsalUser(account.username, name || 'Unknown');

                    if (dbUser) {
                        setUnauthorizedUser(null);
                        setCurrentUser(dbUser);
                        // Log the access
                        await logAccess(dbUser.id, 'login_success', `User Logged In (MSAL): ${name}`);
                    } else {
                        // User not in DB - Unauthorized
                        console.warn('User not found in DB:', name);
                        setUnauthorizedUser(name || account.username);
                        setCurrentUser(null);
                    }
                } catch (error) {
                    console.error('Error syncing MSAL user:', error);
                    setUnauthorizedUser(null); // Or set generic error? Safe to clear.
                }
            } else if (!isAuthenticated) {
                setCurrentUser(null);
                setUnauthorizedUser(null);
            }
            setIsLoading(false);
        };

        checkAuth();
    }, [isAuthenticated, accounts, instance]);

    const login = async () => {
        await instance.loginRedirect(loginRequest);
        return { success: true };
    };

    const logout = () => {
        instance.logoutRedirect();
        setCurrentUser(null);
        setUnauthorizedUser(null);
    };

    return (
        <AuthContext.Provider value={{ currentUser, setCurrentUser, unauthorizedUser, isLoading, login, logout }}>
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
