import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getUsers,
    createUser as addUserApi,
    updateUser as updateUserApi,
    deleteUser as deleteUserApi
} from '@/services/api/users';
import { User as AppUser } from '../types';

export const useUsers = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const users = await getUsers();
            return users as AppUser[];
        },
        staleTime: 1000 * 60 * 5,
    });

    const createUser = useMutation({
        mutationFn: async (user: any) => {
            return await addUserApi(user);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    const updateUser = useMutation({
        mutationFn: async (user: AppUser) => {
            // Adapt AppUser to UpdateUserDTO if needed, but for now passing as is if API handles it
            return await updateUserApi(user.id, user);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    const deleteUser = useMutation({
        mutationFn: async (id: string) => {
            return await deleteUserApi(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    const restoreUser = useMutation({
        mutationFn: async ({ id, user }: { id: string, user: AppUser }) => {
            // Stub functionality: restore not yet implemented in API, maybe just update status?
            console.warn('restoreUser not fully implemented in API');
            return await updateUserApi(id, { ...user, status: 'active' } as any);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    return {
        users: query.data || [],
        isLoading: query.isLoading,
        createUser,
        updateUser,
        deleteUser,
        restoreUser
    };
};
