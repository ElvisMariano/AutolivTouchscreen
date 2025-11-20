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
}

const StationCard: React.FC<StationCardProps> = ({ machine, onClick, index, readOnly = false }) => {
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
            `}
        >
            {/* Decorative background glow */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <span className="font-mono font-bold text-lg">{index + 1}</span>
                    </div>
                    {machine.instructionId && (
                        <div className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400 flex items-center gap-1">
                            <DocumentTextIcon className="w-3 h-3" />
                            <span>{t('common.instruction')}</span>
                        </div>
                    )}
                </div>

                <div className="mt-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide leading-tight">
                        {machine.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {t('common.workStation')}
                    </p>
                </div>

                {!readOnly && (
                    <div className="mt-6 flex items-center text-sm text-cyan-400 font-medium group">
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
