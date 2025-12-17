import React, { useState, useEffect, Suspense } from 'react';
import { useData } from '../contexts/DataContext'; // Still need for some legacy methods if any (e.g. acknowledgeDocument if not using hook?)
import { Machine } from '../types';
import { getStationsByLine, getInstructionsByLine, StationInstruction } from '../services/stationService';
import StationCard from './common/StationCard';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useI18n } from '../contexts/I18nContext';
import { usePDFStorage } from '../hooks/usePDFStorage';
import Modal from './common/Modal';
import Skeleton from './common/Skeleton';
import GestureWrapper from './common/GestureWrapper';
import { useSettings } from '../contexts/SettingsContext';

// New Hooks
import { useDocuments } from '../hooks/useDocuments';
import { useUnreadDocuments } from '../hooks/useUnreadDocuments';
import { useLine } from '../contexts/LineContext'; // Use LineContext for selection
import { useShiftLogic } from '../hooks/useShiftLogic';

// Lazy load PdfViewer
const PdfViewer = React.lazy(() => import('./common/PdfViewer'));

const WorkInstructions: React.FC = () => {
    // 1. Hooks for Global State
    const { settings } = useSettings();
    const { t } = useI18n();
    const { selectedLine, lines } = useLine(); // Use specific context
    const selectedLineId = selectedLine?.id || null;

    // Shift Logic (Need active shifts for unread logic)
    // Note: useShiftLogic takes selectedPlant found in DataContext. LineContext doesn't have plants?
    // DataContext has plants. We might need usePlants logic or get plant from Line?
    // selectedLine has plant_id.
    // Let's use DataContext for getDocumentById fallback and legacy state for now to minimize breakage
    const { getDocumentById, autoOpenDocId, setAutoOpenDocId, activeShifts, currentShift, plants } = useData();
    // Warning: we are trying to remove useData. 
    // `currentShift` can be got from useShiftLogic but needs plant. 
    // `autoOpenDocId` -> should be in URL/Router eventually.

    // 2. Documents & Acknowledgments
    const { acknowledgeDocument } = useDocuments();
    const unreadDocuments = useUnreadDocuments(selectedLineId, currentShift, activeShifts);

    // Local state
    const [machines, setMachines] = useState<Machine[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
    const [fetchedInstructions, setFetchedInstructions] = useState<StationInstruction[]>([]);
    const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
    const { getPDF } = usePDFStorage();

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
                        status: 'offline',
                        position: { x: 0, y: 0 },
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

    // Auto-open document logic
    useEffect(() => {
        if (autoOpenDocId && machines.length > 0 && fetchedInstructions.length > 0) {
            const targetMachine = machines.find(m => m.instructionId === autoOpenDocId);
            if (targetMachine) {
                setSelectedMachine(targetMachine);
                setAutoOpenDocId(null);
            }
        }
    }, [autoOpenDocId, machines, fetchedInstructions, setAutoOpenDocId]);

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

    const isUnread = instructionDoc && unreadDocuments.some(u =>
        u.id === instructionDoc.id ||
        u.title === instructionDoc.title
    );

    const unreadDocId = instructionDoc && unreadDocuments.find(u =>
        u.id === instructionDoc.id ||
        u.title === instructionDoc.title
    )?.id;

    const handleConfirmRead = () => {
        if (unreadDocId) {
            // Use Mutation from hook
            acknowledgeDocument.mutate({
                documentId: unreadDocId,
                shift: currentShift,
                userId: undefined // Pass undefined for now or current user? DataContext passed currentUser?.id
            });
        }
    };

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
                <h1 className="text-lg md:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight truncate max-w-[150px] pb-8 md:max-w-none">{t('workInstructions.title')}</h1>
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
                        {machines.map((machine, index) => {
                            const instruction = fetchedInstructions.find(i => i.station_id === machine.id);
                            const hasUnread = unreadDocuments.some(u => u.title === instruction?.title); // Match by title logic since IDs might differ

                            return (
                                <StationCard
                                    key={machine.id}
                                    machine={machine}
                                    index={index}
                                    onClick={() => setSelectedMachine(machine)}
                                    // Pass hasUnread if supported, otherwise just rely on border
                                    className={hasUnread ? "ring-4 ring-red-500 animate-pulse" : ""}
                                />
                            )
                        })}
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
                <div className="h-full relative group flex flex-col">
                    {/* Confirm Read Overlay/Bar */}
                    {isUnread && (
                        <div className="absolute top-0 left-0 right-0 z-[60] bg-red-600 text-white p-4 flex justify-between items-center shadow-lg animate-slide-down">
                            <div className="flex items-center gap-3">
                                <span className="bg-white text-red-600 p-1 rounded-full animate-pulse">
                                    <div className="h-2 w-2 rounded-full bg-current" />
                                </span>
                                <span className="font-bold text-lg">Documento Atualizado - Confirmação Pendente ({currentShift})</span>
                            </div>
                            <button
                                onClick={handleConfirmRead}
                                className="bg-white text-red-600 px-6 py-2 rounded-lg font-bold hover:bg-red-50 transition shadow-md"
                            >
                                Confirmar Leitura
                            </button>
                        </div>
                    )}

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
                        className="h-full w-full pt-4"
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