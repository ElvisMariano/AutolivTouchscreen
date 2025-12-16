import React, { useState, useEffect, Suspense } from 'react';
import { useData } from '../contexts/DataContext';
import { Machine } from '../types';
import { ProductionLine } from '../services/lineService';
import { getStationsByLine, getInstructionsByLine, StationInstruction } from '../services/stationService';
import StationCard from './common/StationCard';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../contexts/I18nContext';
import { usePDFStorage } from '../hooks/usePDFStorage';
import Modal from './common/Modal';
import Skeleton from './common/Skeleton';
import GestureWrapper from './common/GestureWrapper';

// Lazy load PdfViewer
const PdfViewer = React.lazy(() => import('./common/PdfViewer'));

const WorkInstructions: React.FC = () => {
    const { getDocumentById, setSelectedLineId, selectedLineId, lines, settings } = useData();
    const { t } = useI18n();

    // Local state for Machines/Instructions (still specific to this view's data fetching)
    const [machines, setMachines] = useState<Machine[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
    const [fetchedInstructions, setFetchedInstructions] = useState<StationInstruction[]>([]);
    const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
    const { getPDF } = usePDFStorage();

    // Line fetching is now done in DataContext globally

    // Fetch stations and instructions when line changes
    useEffect(() => {
        const fetchStationsAndInstructions = async () => {
            if (!selectedLineId) return;

            setIsLoading(true);
            try {
                const [stations, instructions] = await Promise.all([
                    getStationsByLine(selectedLineId),
                    getInstructionsByLine(selectedLineId)
                ]);

                // Map stations to Machine type
                const mappedMachines: Machine[] = stations.map((station, index) => {
                    // Find latest instruction for this station
                    const stationInstruction = instructions.find(i => i.station_id === station.id);

                    return {
                        id: station.id,
                        name: station.name,
                        status: 'offline', // Default status as we don't have real-time status from DB yet
                        position: { x: 0, y: 0 }, // Grid layout doesn't use x/y
                        type: 'station',
                        instructionId: stationInstruction?.document_id
                    };
                });

                setMachines(mappedMachines);
                setFetchedInstructions(instructions);
            } catch (error) {
                console.error('Error fetching stations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStationsAndInstructions();
    }, [selectedLineId]);

    const activeInstruction = selectedMachine
        ? fetchedInstructions.find(i => i.station_id === selectedMachine.id)
        : null;

    useEffect(() => {
        const resolveUrl = async () => {
            if (!activeInstruction?.document_id) {
                setResolvedUrl(null);
                return;
            }
            const url = activeInstruction.document_id;
            if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
                setResolvedUrl(url);
            } else {
                try {
                    const blob = await getPDF(url);
                    if (blob) {
                        setResolvedUrl(URL.createObjectURL(blob));
                    } else {
                        console.warn('PDF not found in local storage:', url);
                        setResolvedUrl(null);
                    }
                } catch (e) {
                    console.error('Error resolving PDF:', e);
                    setResolvedUrl(null);
                }
            }
        };
        resolveUrl();
    }, [activeInstruction?.document_id]);

    const instructionDoc = (activeInstruction && resolvedUrl) ? {
        id: activeInstruction.id,
        title: activeInstruction.title,
        url: resolvedUrl,
        category: 'work_instruction',
        version: activeInstruction.version || '1',
        lastUpdated: activeInstruction.uploaded_at
    } as any : (selectedMachine && selectedMachine.instructionId
        ? getDocumentById(selectedMachine.instructionId)
        : null);

    const selectedLine = lines.find(l => l.id === selectedLineId);

    if (!selectedLine) {
        return (
            <div className="flex items-center justify-center h-full text-gray-900 dark:text-white">
                <p className="text-xl">{t('workInstructions.selectLine')}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-gray-100 dark:bg-gray-900 overflow-hidden flex flex-col transition-colors">
            {/* Scrollable Grid Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 h-64 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <Skeleton width="40%" height="24px" className="mb-2" />
                                    <Skeleton variant="circular" width="32px" height="32px" />
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                    <Skeleton variant="circular" width="64px" height="64px" />
                                    <Skeleton width="60%" height="20px" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                        {machines.map((machine, index) => (
                            <StationCard
                                key={machine.id}
                                machine={machine}
                                index={index}
                                onClick={() => setSelectedMachine(machine)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Instruction Modal */}
            <Modal
                isOpen={!!selectedMachine}
                onClose={() => setSelectedMachine(null)}
                title={selectedMachine?.name || ''}
                size="full"
            >
                <div className="h-full relative group">
                    {/* Botão Anterior */}
                    {selectedMachine && machines.findIndex(m => m.id === selectedMachine.id) > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const idx = machines.findIndex(m => m.id === selectedMachine.id);
                                if (idx > 0) setSelectedMachine(machines[idx - 1]);
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all focus:outline-none shadow-lg border border-white/10"
                            title={t('common.previousPage')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                    )}

                    {/* Botão Próximo */}
                    {selectedMachine && machines.findIndex(m => m.id === selectedMachine.id) < machines.length - 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const idx = machines.findIndex(m => m.id === selectedMachine.id);
                                if (idx < machines.length - 1) setSelectedMachine(machines[idx + 1]);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all focus:outline-none shadow-lg border border-white/10"
                            title={t('common.nextPage')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    )}

                    <motion.div
                        key={selectedMachine?.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="h-full w-full"
                    >
                        <Suspense fallback={
                            <div className="flex items-center justify-center h-full">
                                <div className="flex flex-col items-center gap-4 w-full max-w-2xl px-4">
                                    <Skeleton width="100%" height="60vh" />
                                    <Skeleton width="80%" height="20px" />
                                    <Skeleton width="60%" height="20px" />
                                </div>
                            </div>
                        }>
                            {instructionDoc ? (
                                <PdfViewer document={instructionDoc} className="w-full h-full" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-500 bg-gray-200 dark:bg-gray-900/50 rounded-lg">
                                    <DocumentTextIcon className="w-24 h-24 mb-4 opacity-20" />
                                    <p className="text-xl">{t('workInstructions.noInstructions')}</p>
                                </div>
                            )}
                        </Suspense>
                    </motion.div>
                </div>
            </Modal>
        </div>
    );
};

export default WorkInstructions;