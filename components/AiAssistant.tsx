import React, { useState, useRef, useEffect } from 'react';
import { Machine } from '../types';
import Modal from './common/Modal';
import { askAiAssistant } from '../services/geminiService';
import { PaperAirplaneIcon, UserCircleIcon, CpuChipIcon } from './common/Icons';
import { useI18n } from '../contexts/I18nContext';

interface AiAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    machineName: string;
    context?: string;
}

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ isOpen, onClose, machineName, context }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { t } = useI18n();

    useEffect(() => {
        if (isOpen && machineName) {
            const greeting = context
                ? t('ai.greetingWithContext', { machine: machineName, context })
                : t('ai.greeting', { machine: machineName });
            setMessages([{ sender: 'ai', text: greeting }]);
        }
    }, [isOpen, machineName, context, t]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Criar um contexto combinado para o assistente
            const fullContext = context ? `${context} | ${input}` : input;
            const aiResponse = await askAiAssistant(fullContext, machineName);
            const aiMessage: Message = { sender: 'ai', text: aiResponse };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = { sender: 'ai', text: t('ai.error') };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={machineName ? t('ai.titleWithMachine', { machine: machineName }) : t('ai.title')}
            size="xl"
        >
            <div className="flex flex-col h-[70vh]">
                <div className="flex-1 overflow-y-auto p-4 bg-gray-900 rounded-t-md space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <CpuChipIcon className="h-8 w-8 text-purple-400 mt-1" />}
                            <div className={`max-w-xl p-3 rounded-xl ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                            </div>
                            {msg.sender === 'user' && <UserCircleIcon className="h-8 w-8 text-blue-400 mt-1" />}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3 justify-start">
                            <CpuChipIcon className="h-8 w-8 text-purple-400 mt-1 animate-pulse" />
                            <div className="max-w-xl p-3 rounded-xl bg-gray-700">
                                <div className="flex space-x-1">
                                    <span className="h-2 w-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-purple-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="flex p-4 bg-gray-700 rounded-b-md">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t('ai.placeholder')}
                        className="flex-1 bg-gray-800 text-white p-3 rounded-l-md border-2 border-transparent focus:outline-none focus:border-purple-500 text-lg"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        className="bg-purple-600 text-white p-3 rounded-r-md hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        <PaperAirplaneIcon className="h-8 w-8" />
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AiAssistant;
