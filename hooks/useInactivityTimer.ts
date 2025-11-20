
import { useEffect, useRef } from 'react';

const useInactivityTimer = (onTimeout: () => void, timeout: number = 60000) => {
    const timeoutId = useRef<number | null>(null);

    const resetTimer = () => {
        if (timeoutId.current) {
            window.clearTimeout(timeoutId.current);
        }
        timeoutId.current = window.setTimeout(onTimeout, timeout);
    };

    useEffect(() => {
        const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

        const eventListener = () => {
            resetTimer();
        };

        events.forEach(event => window.addEventListener(event, eventListener));
        resetTimer();

        return () => {
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
            events.forEach(event => window.removeEventListener(event, eventListener));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onTimeout, timeout]);
};

export default useInactivityTimer;
