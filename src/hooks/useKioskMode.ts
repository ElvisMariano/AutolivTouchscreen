import { useEffect } from 'react';

export const useKioskMode = (enabled: boolean) => {
    useEffect(() => {
        if (!enabled) return;

        const preventKeyboard = (e: KeyboardEvent) => {
            // Prevent F11 (Fullscreen toggle by browser)
            if (e.key === 'F11') {
                e.preventDefault();
            }
            // Prevent F5 and Ctrl+R (Refresh)
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                e.preventDefault();
            }
            // Prevent Alt+Tab (Window switching - browser can't fully block this but we can try to capture focus)
            if (e.altKey && e.key === 'Tab') {
                e.preventDefault();
            }
            // Prevent Ctrl+W (Close tab)
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
            }
            // Prevent Esc (Exit fullscreen)
            if (e.key === 'Escape') {
                e.preventDefault();
            }
        };

        const preventGestures = (e: TouchEvent) => {
            // Prevent pinch zoom
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        };

        // Prevent right click context menu
        const preventContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        window.addEventListener('keydown', preventKeyboard);
        window.addEventListener('touchstart', preventGestures, { passive: false });
        window.addEventListener('contextmenu', preventContextMenu);

        // Request fullscreen when enabled
        const enterFullscreen = async () => {
            try {
                if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (err) {
                console.error("Error attempting to enable full-screen mode:", err);
            }
        };

        // Try to enter fullscreen on any user interaction if not already
        const handleInteraction = () => {
            enterFullscreen();
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);

        // Initial attempt
        enterFullscreen();

        return () => {
            window.removeEventListener('keydown', preventKeyboard);
            window.removeEventListener('touchstart', preventGestures);
            window.removeEventListener('contextmenu', preventContextMenu);
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);

            // Exit fullscreen when disabled
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.error("Error exiting full-screen mode:", err));
            }
        };
    }, [enabled]);
};
