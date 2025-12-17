import { renderHook, act } from '@testing-library/react';
import { SettingsProvider, useSettings } from '../../../contexts/SettingsContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';

// Mock useAuth
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        currentUser: null
    })
}));

describe('SettingsContext', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.clearAllMocks();
    });

    it('should provide default settings', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <SettingsProvider>{children}</SettingsProvider>
        );
        const { result } = renderHook(() => useSettings(), { wrapper });

        expect(result.current.settings).toBeDefined();
        expect(result.current.settings.language).toBe('pt-BR'); // Default language
    });

    it('should update settings', async () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <SettingsProvider>{children}</SettingsProvider>
        );
        const { result } = renderHook(() => useSettings(), { wrapper });

        act(() => {
            result.current.updateSetting('language', 'en-US');
        });

        expect(result.current.settings.language).toBe('en-US');
    });

    it('should persist to localStorage', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <SettingsProvider>{children}</SettingsProvider>
        );
        const { result } = renderHook(() => useSettings(), { wrapper });

        act(() => {
            result.current.updateSetting('theme', 'dark');
        });

        const stored = window.localStorage.getItem('app_settings');
        expect(stored).toBeTruthy();
        expect(JSON.parse(stored!).theme).toBe('dark');
    });
});
