import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as AuthUser, syncMsalUser, logAccess } from '../src/services/api/users';
import { AuthResult } from '../services/authService'; // Remove this if unused or redefine locally
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "../src/authConfig";

interface AuthContextType {
    currentUser: AuthUser | null;
    setCurrentUser: (user: AuthUser | null) => void;
    unauthorizedUser: string | null;
    isLoading: boolean;
    login: () => Promise<AuthResult>;
    logout: () => void;
    isAdmin: boolean;
    isOperator: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [unauthorizedUser, setUnauthorizedUser] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    // Derived state
    // Derived state
    const isAdmin = React.useMemo(() => {
        if (!currentUser) return false;
        // Backend returns `role_name` from JOIN, but we also support legacy `role` object/string
        const roleSource = currentUser.role_name || currentUser.role;
        if (!roleSource) return false;

        const roleName = (typeof roleSource === 'string' ? roleSource : roleSource.name || '').toLowerCase();
        return roleName.startsWith('admin');
    }, [currentUser]);

    const isOperator = React.useMemo(() => {
        if (!currentUser) return false;
        const roleSource = currentUser.role_name || currentUser.role;
        if (!roleSource) return false;

        const roleName = (typeof roleSource === 'string' ? roleSource : roleSource.name || '').toLowerCase();
        return roleName === 'operador' || roleName === 'operator';
    }, [currentUser]);

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
        <AuthContext.Provider value={{ currentUser, setCurrentUser, unauthorizedUser, isLoading, login, logout, isAdmin, isOperator }}>
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
