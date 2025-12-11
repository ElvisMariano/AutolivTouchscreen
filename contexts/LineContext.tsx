import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProductionLine, getActiveLines } from '../services/lineService';

interface LineContextType {
    lines: ProductionLine[];
    selectedLine: ProductionLine | null;
    setSelectedLineId: (lineId: string | null) => void;
    refreshLines: () => Promise<void>;
    isLoading: boolean;
}

const LineContext = createContext<LineContextType | undefined>(undefined);

export const LineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [lines, setLines] = useState<ProductionLine[]>([]);
    const [selectedLine, setSelectedLine] = useState<ProductionLine | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshLines = async () => {
        try {
            setIsLoading(true);
            const activeLines = await getActiveLines();
            setLines(activeLines);

            // Se havia uma linha selecionada, manter seleção se ainda existir
            if (selectedLine) {
                const stillExists = activeLines.find(l => l.id === selectedLine.id);
                if (!stillExists) {
                    setSelectedLine(null);
                    localStorage.removeItem('selectedLineId');
                }
            }
        } catch (error) {
            console.error('Error refreshing lines:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshLines();

        // Recuperar linha selecionada do localStorage
        const savedLineId = localStorage.getItem('selectedLineId');
        if (savedLineId) {
            // A linha será definida após carregar as linhas
        }
    }, []);

    useEffect(() => {
        // Quando as linhas forem carregadas, restaurar seleção
        if (lines.length > 0) {
            const savedLineId = localStorage.getItem('selectedLineId');
            if (savedLineId) {
                const line = lines.find(l => l.id === savedLineId);
                if (line) {
                    setSelectedLine(line);
                }
            }
        }
    }, [lines]);

    const setSelectedLineId = (lineId: string | null) => {
        if (!lineId) {
            setSelectedLine(null);
            localStorage.removeItem('selectedLineId');
            return;
        }

        const line = lines.find(l => l.id === lineId);
        if (line) {
            setSelectedLine(line);
            localStorage.setItem('selectedLineId', lineId);
        }
    };

    return (
        <LineContext.Provider value={{
            lines,
            selectedLine,
            setSelectedLineId,
            refreshLines,
            isLoading
        }}>
            {children}
        </LineContext.Provider>
    );
};

export const useLine = (): LineContextType => {
    const context = useContext(LineContext);
    if (!context) {
        throw new Error('useLine must be used within LineProvider');
    }
    return context;
};
