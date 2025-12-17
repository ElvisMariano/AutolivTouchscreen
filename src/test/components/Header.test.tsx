import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Header from '../../../components/common/Header';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QualityAlert } from '../../../types';
import { MemoryRouter } from 'react-router-dom';

// Mocks
vi.mock('../../../contexts/DataContext', () => ({
    useData: vi.fn()
}));
vi.mock('../../../contexts/I18nContext', () => ({
    useI18n: () => ({ t: (key: string) => key, locale: 'pt-BR' })
}));
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));
vi.mock('../../../hooks/useUpdateCheck', () => ({
    default: () => ({ hasUpdate: false })
}));
vi.mock('../../../components/common/DocumentNotification', () => ({
    default: () => <div data-testid="doc-noti">DocNoti</div>
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

import { useData } from '../../../contexts/DataContext';
import { useAuth } from '../../../contexts/AuthContext';

describe('Header', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Default mocks
        (useData as any).mockReturnValue({
            alerts: [],
            selectedLineId: null
        });
        (useAuth as any).mockReturnValue({
            isAdmin: false,
            currentUser: { role: { allowed_resources: [] } }
        });
    });

    const renderHeader = () => {
        return render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );
    }

    it('should render logo', () => {
        renderHeader();
        expect(screen.getByAltText('Autoliv')).toBeInTheDocument();
    });

    it('should show alerts button with correct count', () => {
        // Mock alerts
        const activeAlert: QualityAlert = {
            id: '1', title: 'Alert 1', description: 'Desc', severity: 'A', documentId: 'd1', createdAt: '2023-01-01', expiresAt: '2099-01-01', isRead: false
        } as any;

        (useData as any).mockReturnValue({
            alerts: [activeAlert],
            selectedLineId: null
        });

        renderHeader();

        expect(screen.getByText('header.alerts')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // Badge
    });

    it('should NOT show admin button for normal user', () => {
        (useAuth as any).mockReturnValue({
            isAdmin: false,
            currentUser: { role: { allowed_resources: [] } }
        });
        renderHeader();

        const buttons = screen.getAllByRole('button');

        let adminFound = false;
        buttons.forEach(btn => {
            fireEvent.click(btn);
            if (mockNavigate.mock.calls.some(call => call[0] === '/admin')) {
                adminFound = true;
            }
            mockNavigate.mockClear();
        });

        expect(adminFound).toBe(false);
    });

    it('should show admin button for admin user', () => {
        (useAuth as any).mockReturnValue({
            isAdmin: true,
            currentUser: { role: { allowed_resources: [] } }
        });

        renderHeader();

        const buttons = screen.getAllByRole('button');

        let found = false;
        buttons.forEach(btn => {
            fireEvent.click(btn);
            if (mockNavigate.mock.calls.some(call => call[0] === '/admin')) {
                found = true;
            }
            mockNavigate.mockClear();
        });

        expect(found).toBe(true);
    });
});

