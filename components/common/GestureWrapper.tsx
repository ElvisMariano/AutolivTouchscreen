import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface GestureWrapperProps {
    children: React.ReactNode;
    onNavigate: (direction: 'next' | 'prev') => void;
    canGoNext?: boolean;
    canGoPrev?: boolean;
    className?: string;
    threshold?: number;
}

const GestureWrapper: React.FC<GestureWrapperProps> = ({
    children,
    onNavigate,
    canGoNext = true,
    canGoPrev = true,
    className = '',
    threshold = 100 // Pixel distance to trigger navigation
}) => {
    const x = useMotionValue(0);
    const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

    // We use a ref to track if a navigation has been triggered to prevent multiple calls
    const hasNavigated = useRef(false);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        // Reset navigation flag
        hasNavigated.current = false;

        // Swipe Left (Go to Next)
        if (offset < -threshold && canGoNext) {
            onNavigate('next');
        }
        // Swipe Right (Go to Prev)
        else if (offset > threshold && canGoPrev) {
            onNavigate('prev');
        }
    };

    return (
        <motion.div
            className={`w-full h-full ${className}`}
            style={{ x, opacity, touchAction: 'pan-y' }} // pan-y allows vertical scroll, horizontal is captured
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2} // Resistance feel
            onDragEnd={handleDragEnd}
            dragPropagation={false} // Stop propagation to parents
        >
            {children}
        </motion.div>
    );
};

export default GestureWrapper;
