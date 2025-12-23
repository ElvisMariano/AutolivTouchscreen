import React, { useState, useCallback } from 'react';

interface RippleEffect {
    x: number;
    y: number;
    size: number;
    id: number;
}

interface RippleProps {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
}

/**
 * Componente Ripple que adiciona um efeito de ondulação ao clicar
 * Proporciona feedback visual melhorado para interações touch
 */
const Ripple: React.FC<RippleProps> = ({ children, className = '', onClick, disabled = false, type = 'button' }) => {
    const [ripples, setRipples] = useState<RippleEffect[]>([]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        const newRipple: RippleEffect = {
            x,
            y,
            size,
            id: Date.now()
        };

        setRipples(prev => [...prev, newRipple]);

        // Remove o ripple após a animação
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 600);

        // Chama o onClick passado como prop
        if (onClick) {
            onClick(e);
        }
    }, [onClick]);

    return (
        <button
            type={type}
            className={`relative overflow-hidden ${className}`}
            onClick={handleClick}
            disabled={disabled}
        >
            {children}
            {ripples.map(ripple => (
                <span
                    key={ripple.id}
                    className="absolute rounded-full bg-white opacity-30 animate-ripple pointer-events-none"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: ripple.size,
                        height: ripple.size,
                    }}
                />
            ))}
        </button>
    );
};

export default Ripple;
