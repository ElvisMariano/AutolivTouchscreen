import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Machine } from '../types';
import StationCard from './common/StationCard';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import PdfViewer from './common/PdfViewer';
import { useI18n } from '../contexts/I18nContext';

const WorkInstructions: React.FC = () => {
    const { selectedLine, lines, setSelectedLineId, getDocumentById } = useData();
    const { t } = useI18n();
    const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

    const instructionDoc = selectedMachine ? getDocumentById(selectedMachine.instructionId) : null;

    if (!selectedLine) {
        return (
            <div className="flex items-center justify-center h-full text-gray-900 dark:text-white">
                <p className="text-xl">{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-gray-100 dark:bg-gray-900 overflow-hidden flex flex-col transition-colors">
            {/* Header */}
            <div className="p-6 pb-2 flex-shrink-0 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <select
                            value={selectedLine.id}
                            onChange={(e) => setSelectedLineId(e.target.value)}
                            className="bg-transparent border-b border-gray-400 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer hover:text-cyan-400 transition-colors"
                        >
                            {lines.map(line => (
                                <option key={line.id} value={line.id} className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white">
                                    {line.name}
                                </option>
                            ))}
                        </select>
                        <span className="text-gray-600 dark:text-gray-500 text-lg font-normal">| {t('workInstructions.workStations')}</span>
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{t('workInstructions.selectStation')}</p>
                </div>
            </div>

            {/* Scrollable Grid Area */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {selectedLine.machines.map((machine, index) => (
                        <StationCard
                            key={machine.id}
                            machine={machine}
                            index={index}
                            onClick={() => setSelectedMachine(machine)}
                        />
                    ))}
                </div>
            </div>

            {/* Instruction Modal */}
            <AnimatePresence>
                {selectedMachine && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setSelectedMachine(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-300 dark:border-gray-700 relative"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 flex-shrink-0">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedMachine.name}</h3>
                                    <p className="text-cyan-600 dark:text-cyan-400 text-sm">{t('workInstructions.instruction')}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedMachine(null)}
                                    className="p-2 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                >
                                    <XMarkIcon className="w-8 h-8" />
                                </button>
                            </div>

                            {/* Modal Content - Full Height */}
                            <div className="flex-1 overflow-hidden relative">
                                {instructionDoc ? (
                                    <PdfViewer document={instructionDoc} className="w-full h-full" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-500 bg-gray-200 dark:bg-gray-900/50">
                                        <DocumentTextIcon className="w-24 h-24 mb-4 opacity-20" />
                                        <p className="text-xl">{t('workInstructions.noInstructions')}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default WorkInstructions;