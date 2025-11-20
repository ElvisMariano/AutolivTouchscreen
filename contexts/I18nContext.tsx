import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useData } from './DataContext';
import ptBR from '../locales/pt-BR';
import enUS from '../locales/en-US';
import esES from '../locales/es-ES';

type Locale = 'pt-BR' | 'en-US' | 'es-ES';
type Translations = typeof ptBR;

interface I18nContextType {
    t: (key: string, params?: Record<string, string | number>) => string;
    locale: Locale;
    setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations: Record<Locale, Translations> = {
    'pt-BR': ptBR,
    'en-US': enUS,
    'es-ES': esES,
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { settings } = useData();
    const [locale, setLocale] = useState<Locale>(settings.language || 'pt-BR');

    useEffect(() => {
        if (settings.language) {
            setLocale(settings.language);
        }
    }, [settings.language]);

    const t = (key: string, params?: Record<string, string | number>): string => {
        const keys = key.split('.');
        let value: any = translations[locale];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k as keyof typeof value];
            } else {
                // Fallback to pt-BR if key not found
                let fallbackValue: any = translations['pt-BR'];
                for (const fk of keys) {
                    if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
                        fallbackValue = fallbackValue[fk as keyof typeof fallbackValue];
                    } else {
                        return key; // Return key if not found in fallback either
                    }
                }
                return fallbackValue as string;
            }
        }

        if (typeof value !== 'string') {
            return key;
        }

        if (params) {
            return Object.entries(params).reduce((acc, [key, val]) => {
                return acc.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
            }, value);
        }

        return value;
    };

    return (
        <I18nContext.Provider value={{ t, locale, setLocale }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error('useI18n must be used within a I18nProvider');
    }
    return context;
};
