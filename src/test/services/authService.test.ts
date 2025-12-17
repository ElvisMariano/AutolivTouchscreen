import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, checkUserPermission } from '../../../services/authService';
import { supabase } from '../../../services/supabaseClient';

// Mock Supabase
vi.mock('../../../services/supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    is: vi.fn(() => ({
                        single: vi.fn()
                    }))
                }))
            })),
            insert: vi.fn()
        }))
    }
}));

describe('authService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('login', () => {
        it('should return error if user not found', async () => {
            // Setup mock to return null data
            const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
            const mockIs = vi.fn().mockReturnValue({ single: mockSingle });
            const mockEq = vi.fn().mockReturnValue({ is: mockIs });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
            (supabase.from as any).mockReturnValue({ select: mockSelect });

            const result = await login('nonexistent', 'password');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Usuário não encontrado');
        });

        // Note: Testing success requires mocking crypto/hashing which is more involved 
        // because the service uses real hashing logic. We can mock internal hashPassword 
        // but it is not exported. For integration test we might rely on the logic itself 
        // but implementing crypto mock for jsdom is needed if not present.
        // Vitest with jsdom should have crypto.
    });

    describe('checkUserPermission', () => {
        it('should return exists false if user not found', async () => {
            const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
            const mockIs = vi.fn().mockReturnValue({ single: mockSingle });
            const mockEq = vi.fn().mockReturnValue({ is: mockIs });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
            (supabase.from as any).mockReturnValue({ select: mockSelect });

            const result = await checkUserPermission('unknown');
            expect(result.exists).toBe(false);
        });

        it('should return user info if exists', async () => {
            const mockUser = {
                id: '123',
                username: 'test',
                role: { name: 'Admin' }
            };
            const mockSingle = vi.fn().mockResolvedValue({ data: mockUser, error: null });
            const mockIs = vi.fn().mockReturnValue({ single: mockSingle });
            const mockEq = vi.fn().mockReturnValue({ is: mockIs });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
            (supabase.from as any).mockReturnValue({ select: mockSelect });

            const result = await checkUserPermission('test');
            expect(result.exists).toBe(true);
            expect(result.role).toBe('Admin');
            expect(result.userId).toBe('123');
        });
    });
});
