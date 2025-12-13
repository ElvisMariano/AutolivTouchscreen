import React from 'react';
import { useLine } from '../../contexts/LineContext';
import { useData } from '../../contexts/DataContext';
import { useI18n } from '../../contexts/I18nContext';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const LineSelector: React.FC = () => {
    const { lines, selectedLine, setSelectedLineId, isLoading } = useLine();
    const { setSelectedLineId: setDataSelectedLineId, selectedPlantId } = useData();
    const { t } = useI18n();

    const filteredLines = React.useMemo(() => {
        if (!selectedPlantId) return lines;
        return lines.filter(l => l.plantId === selectedPlantId);
    }, [lines, selectedPlantId]);

    if (isLoading || lines.length === 0) {
        return null;
    }

    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('admin.selectLine', 'Selecionar Linha de Produção')}
            </label>
            <div className="relative">
                <select
                    value={selectedLine?.id || ''}
                    onChange={(e) => {
                        const value = e.target.value || '';
                        setSelectedLineId(value || null);
                        setDataSelectedLineId(value);
                    }}
                    className="w-full px-4 py-3 pr-10 rounded-lg border-2 border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all"
                >
                    <option value="">{t('admin.selectLinePlaceholder', 'Nenhuma linha selecionada')}</option>
                    {filteredLines.map(line => (
                        <option key={line.id} value={line.id}>
                            {line.name}
                        </option>
                    ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 dark:text-blue-400 pointer-events-none" />
            </div>
            {selectedLine && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        ✓ Linha selecionada: <strong>{selectedLine.name}</strong>
                    </p>
                    {selectedLine.description && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {selectedLine.description}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default LineSelector;
