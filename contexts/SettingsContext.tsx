import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { SystemSettings, User } from '../types';
import { supabase } from '../services/supabaseClient';

// Configurações padrão
const DEFAULT_SETTINGS: SystemSettings = {
    inactivityTimeout: 300,
    language: 'pt-BR',
    theme: 'light',
    fontSize: 'medium',
    autoRefreshInterval: 30,
    enableSoundNotifications: true,
    enableVibration: true,
    showTutorials: true,
    compactMode: false,
    kioskMode: false,
    gestureNavigation: true,
    gestureSensitivity: 100,
    shiftCheckInterval: 60,
};

interface SettingsContextType {
    settings: SystemSettings;
    updateSetting: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => Promise<void>;
    isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    // Carregar configurações iniciais
    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            try {
                if (currentUser && currentUser.settings) {
                    // Mesclar configurações do usuário com os padrões (para garantir novas chaves)
                    setSettings({ ...DEFAULT_SETTINGS, ...currentUser.settings } as SystemSettings);
                } else {
                    // Fallback para localStorage
                    const localSettings = localStorage.getItem('app_settings');
                    if (localSettings) {
                        try {
                            const parsed = JSON.parse(localSettings);
                            setSettings({ ...DEFAULT_SETTINGS, ...parsed });
                        } catch (e) {
                            console.error('Erro ao ler settings do localStorage', e);
                            setSettings(DEFAULT_SETTINGS);
                        }
                    } else {
                        setSettings(DEFAULT_SETTINGS);
                    }
                }
            } catch (error) {
                console.error('Erro ao carregar configurações:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, [currentUser]); // Recarrega se o usuário mudar (Login/Logout)

    // Sincronizar tema com o DOM (efeito colateral de UI)
    useEffect(() => {
        const root = window.document.documentElement;
        if (settings.theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
    }, [settings.theme]);

    // Sincronizar tamanho da fonte
    useEffect(() => {
        const root = window.document.documentElement;
        const sizeMap: Record<string, string> = {
            small: '14px',
            medium: '16px',
            large: '18px',
        };
        root.style.fontSize = sizeMap[settings.fontSize] || '16px';
    }, [settings.fontSize]);

    const updateSetting = async <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
        // Atualização Otimista
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            // Salvar no localStorage sempre (backup/cache)
            localStorage.setItem('app_settings', JSON.stringify(newSettings));

            // Se logado, salvar no DB
            if (currentUser) {
                const { error } = await supabase
                    .from('users')
                    .update({ settings: newSettings })
                    .eq('id', currentUser.id);

                if (error) {
                    console.error('Erro ao salvar configurações no DB:', error);
                    // Opcional: Reverter estado ou mostrar toast
                }
            }
        } catch (error) {
            console.error('Erro ao persistir configurações:', error);
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
    }
    return context;
};
