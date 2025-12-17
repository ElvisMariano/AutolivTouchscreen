import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';
import { ChangeLog, ChangeEntity } from '../types';

interface LogContextType {
    changeLogs: ChangeLog[];
    logEvent: (entity: ChangeEntity, action: 'create' | 'update' | 'delete' | 'view', targetId: string, label: string) => void;
    clearLogs: () => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [changeLogs, setChangeLogs] = useLocalStorage<ChangeLog[]>('system_changelogs', []);

    const logEvent = useCallback((entity: ChangeEntity, action: 'create' | 'update' | 'delete' | 'view', targetId: string, label: string) => {
        const newLog: ChangeLog = {
            id: crypto.randomUUID(),
            entity,
            action,
            targetId,
            label,
            timestamp: new Date().toISOString(),
            userId: currentUser?.id,
            userName: currentUser?.name || currentUser?.username || 'Sistema'
        };
        setChangeLogs(prev => [newLog, ...prev].slice(0, 1000));
    }, [currentUser, setChangeLogs]);

    const clearLogs = useCallback(() => {
        setChangeLogs([]);
    }, [setChangeLogs]);

    return (
        <LogContext.Provider value={{ changeLogs, logEvent, clearLogs }}>
            {children}
        </LogContext.Provider>
    );
};

export const useLog = () => {
    const context = useContext(LogContext);
    if (context === undefined) {
        throw new Error('useLog must be used within a LogProvider');
    }
    return context;
};
