import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginScreen from '../../../components/common/LoginScreen';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { User } from '../../../types';

// Mock dependencie imports with root paths
vi.mock('../../../contexts/DataContext', () => ({
    useData: vi.fn(() => ({
        users: [{
            id: '1',
            username: 'admin',
            name: 'Administrator',
            password: 'password123',
            role: { id: 'admin', name: 'Admin', allowed_resources: [] }
        }]
    }))
}));
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));
vi.mock('../../../contexts/I18nContext', () => ({
    useI18n: () => ({ t: (key: string) => key })
}));

// Import mocks to setup return values
import { useData } from '../../../contexts/DataContext';
import { useAuth } from '../../../contexts/AuthContext';

describe('LoginScreen', () => {
    const mockOnUnlock = vi.fn();
    const mockSetCurrentUser = vi.fn();

    // Mock user data matching the component's expectations
    const mockUsers: User[] = [
        {
            id: '1',
            username: 'admin',
            name: 'Administrator',
            password: 'password123', // Component compares plain text password currently
            role: { id: 'admin', name: 'Admin', allowed_resources: [] }
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (useData as any).mockReturnValue({ users: mockUsers });
        (useAuth as any).mockReturnValue({ setCurrentUser: mockSetCurrentUser });
    });

    it('should render login form', () => {
        render(<LoginScreen onUnlock={mockOnUnlock} />);

        expect(screen.getByPlaceholderText('common.user')).toBeInTheDocument(); // Mocked t returns key
        // The password placeholder is hardcoded '••••••••' in the component, check label instead
        expect(screen.getByText('common.password')).toBeInTheDocument();
        expect(screen.getByText('common.login', { selector: 'button' })).toBeInTheDocument();
    });

    it('should handle successful login', async () => {
        const user = userEvent.setup();
        render(<LoginScreen onUnlock={mockOnUnlock} />);

        const userInput = screen.getByPlaceholderText('common.user');
        const passInput = screen.getByPlaceholderText('••••••••');

        await user.type(userInput, 'admin');
        await user.type(passInput, 'password123');

        const submitButton = screen.getByRole('button', { name: 'common.login' });
        await user.click(submitButton);

        expect(mockSetCurrentUser).toHaveBeenCalledWith(expect.objectContaining({ username: 'admin' }));
        expect(mockOnUnlock).toHaveBeenCalled();
    });

    it('should show error on invalid credentials', () => {
        render(<LoginScreen onUnlock={mockOnUnlock} />);

        fireEvent.change(screen.getByPlaceholderText('common.user'), { target: { value: 'admin' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });

        const form = screen.getByRole('button', { name: 'common.login' }).closest('form');
        fireEvent.submit(form!);

        expect(mockSetCurrentUser).not.toHaveBeenCalled();
        expect(mockOnUnlock).not.toHaveBeenCalled();
        // Checks for error message in the document
        expect(screen.getByText('admin.invalidCredentials')).toBeInTheDocument();
    });
});
