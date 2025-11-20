import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Machine } from '../types';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import Modal from './common/Modal';
import { useI18n } from '../contexts/I18nContext';

const ProductionLineEditor: React.FC = () => {
    const {
        lines,
        addMachine,
        updateMachine,
        deleteMachine,
        moveMachine,
        docs,
    } = useData();
    const { t } = useI18n();

    const [selectedLineId, setSelectedLineId] = useState<string>(lines[0]?.id || '');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
    const [deletingMachine, setDeletingMachine] = useState<Machine | null>(null);

    // Form states
    const [machineName, setMachineName] = useState('');
    const [machineInstructionId, setMachineInstructionId] = useState('');

    const selectedLine = useMemo(() => {
        return lines.find(l => l.id === selectedLineId) || lines[0];
    }, [lines, selectedLineId]);

    const handleAddMachine = () => {
        if (!selectedLine) return;
        // Create new machine with default position (appended)
        const newIndex = selectedLine.machines.length;
        addMachine(selectedLine.id, {
            name: machineName,
            instructionId: machineInstructionId || undefined,
            position: { x: newIndex * 10, y: 10 }, // Dummy position
            type: 'station'
        });
        setIsAddModalOpen(false);
        resetForm();
    };

    const handleEditMachine = () => {
        if (!selectedLine || !editingMachine) return;
        updateMachine(selectedLine.id, editingMachine.id, {
            name: machineName,
            instructionId: machineInstructionId || undefined
        });
        setIsEditModalOpen(false);
        setEditingMachine(null);
        resetForm();
    };

    const handleDeleteMachine = (machine: Machine) => {
        setDeletingMachine(machine);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedLine || !deletingMachine) return;
        deleteMachine(selectedLine.id, deletingMachine.id);
        setIsDeleteModalOpen(false);
        setDeletingMachine(null);
    };

    const openEditModal = (machine: Machine) => {
        setEditingMachine(machine);
        setMachineName(machine.name);
        setMachineInstructionId(machine.instructionId || '');
        setIsEditModalOpen(true);
    };

    const resetForm = () => {
        setMachineName('');
        setMachineInstructionId('');
    };

    if (!selectedLine) return <div className="text-white">{t('dashboard.noLineSelected')}</div>;

    return (
        <div className="h-full flex flex-col bg-gray-900 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">{t('admin.lineEditor')}</h2>
                    <p className="text-gray-400">{t('admin.lineEditorDescription')}</p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={selectedLineId}
                        onChange={(e) => setSelectedLineId(e.target.value)}
                        className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                    >
                        {lines.map(line => (
                            <option key={line.id} value={line.id}>{line.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                        className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                        <PlusIcon className="w-5 h-5" />
                        {t('admin.addStation')}
                    </button>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto bg-gray-800/50 rounded-xl border border-gray-700 p-4">
                {selectedLine.machines.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <p className="text-lg">{t('admin.noStations')}</p>
                        <p className="text-sm">{t('admin.clickToAddStation')}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {selectedLine.machines.map((machine, index) => (
                            <div
                                key={machine.id}
                                className="flex items-center justify-between bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded bg-gray-700 flex items-center justify-center text-gray-400 font-mono text-sm">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium text-lg">{machine.name}</h3>
                                        {machine.instructionId ? (
                                            <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
                                                <DocumentTextIcon className="w-3 h-3" />
                                                <span>{t('admin.linkedInstruction')}</span>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-xs mt-1">{t('admin.noLinkedInstruction')}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    {/* Reorder buttons placeholder */}
                                    <div className="flex flex-col mr-2">
                                        <button
                                            className="text-gray-500 hover:text-white disabled:opacity-30"
                                            disabled={index === 0}
                                            onClick={() => moveMachine(selectedLine.id, machine.id, 'up')}
                                        >
                                            <ChevronUpIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="text-gray-500 hover:text-white disabled:opacity-30"
                                            disabled={index === selectedLine.machines.length - 1}
                                            onClick={() => moveMachine(selectedLine.id, machine.id, 'down')}
                                        >
                                            <ChevronDownIcon className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => openEditModal(machine)}
                                        className="p-2 text-cyan-400 hover:bg-cyan-900/30 rounded-lg transition-colors"
                                        title={t('common.edit')}
                                    >
                                        <PencilSquareIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMachine(machine)}
                                        className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                        title={t('common.delete')}
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('admin.addNewStation')}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t('admin.stationName')}</label>
                        <input
                            type="text"
                            value={machineName}
                            onChange={e => setMachineName(e.target.value)}
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="Ex: Montagem Final"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t('admin.workInstructionOptional')}</label>
                        <select
                            value={machineInstructionId}
                            onChange={e => setMachineInstructionId(e.target.value)}
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                        >
                            <option value="">{t('admin.selectDocument')}</option>
                            {docs.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleAddMachine}
                            disabled={!machineName.trim()}
                            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            {t('common.add')}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t('admin.editUser')}> {/* Reusing editUser or add new key editStation? Better add editStation */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t('admin.stationName')}</label>
                        <input
                            type="text"
                            value={machineName}
                            onChange={e => setMachineName(e.target.value)}
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t('workInstructions.title')}</label>
                        <select
                            value={machineInstructionId}
                            onChange={e => setMachineInstructionId(e.target.value)}
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                        >
                            <option value="">{t('admin.selectDocument')}</option>
                            {docs.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={() => { setIsEditModalOpen(false); setEditingMachine(null); resetForm(); }}
                            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleEditMachine}
                            disabled={!machineName.trim()}
                            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            {t('common.save')}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('admin.confirmDelete')} size="md">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <TrashIcon className="w-8 h-8 text-red-400 flex-shrink-0" />
                        <div>
                            <p className="text-white font-medium">{t('admin.confirmDelete')}</p>
                            {deletingMachine && (
                                <p className="text-gray-400 text-sm mt-1">
                                    {t('common.station')}: <span className="text-white font-medium">{deletingMachine.name}</span>
                                </p>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-300 text-sm">
                        {t('admin.deleteStationWarning')}
                    </p>
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-medium text-lg"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-medium text-lg"
                        >
                            {t('common.delete')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProductionLineEditor;