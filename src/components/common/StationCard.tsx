import React from 'react';
import { Machine } from '../../types';
import { motion } from 'framer-motion';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { useI18n } from '../../contexts/I18nContext';

interface StationCardProps {
    machine: Machine;
    onClick?: () => void;
    index: number;
    readOnly?: boolean;
    hasUnread?: boolean;
    className?: string;
}

const StationCard: React.FC<StationCardProps> = ({ machine, onClick, index, readOnly = false, hasUnread = false, className = '' }) => {
    const { t } = useI18n();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`
                relative overflow-hidden rounded-xl border border-white/10 
                bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md 
                p-6 shadow-xl transition-all duration-300
                ${!readOnly ? 'cursor-pointer hover:border-cyan-500/50 hover:shadow-cyan-500/20 hover:bg-white/10' : ''}
                ${hasUnread ? 'ring-2 ring-red-500 shadow-red-500/20 animate-pulse' : ''}
                ${className}
            `}
        >
            {/* Decorative background glow */}
            <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl ${hasUnread ? 'bg-red-500/20' : 'bg-cyan-500/10'}`} />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${hasUnread ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                        <span className="font-mono font-bold text-lg">{index + 1}</span>
                    </div>
                    {machine.instructionId && (
                        <div className={`rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1 ${hasUnread ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            <DocumentTextIcon className="w-3 h-3" />
                            <span>{hasUnread ? 'Atualizado' : t('common.instruction')}</span>
                        </div>
                    )}
                </div>

                <div className="mt-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide leading-tight">
                        {machine.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2" title={machine.description || t('common.workStation')}>
                        {machine.description || t('common.workStation')}
                    </p>
                </div>

                {!readOnly && (
                    <div className={`mt-6 flex items-center text-sm font-medium group ${hasUnread ? 'text-red-400' : 'text-cyan-400'}`}>
                        <span>{t('common.accessInstruction')}</span>
                        <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default StationCard;
