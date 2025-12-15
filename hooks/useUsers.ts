import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAllUsers,
    addUserToDB,
    updateUserInDB,
    deleteUserInDB,
    restoreUserInDB
} from '../services/authService';
import { User } from '../services/authService'; // Note: authService has its own User interface, referencing permissions
// But DataContext uses User from types.ts. We should align.
// In authService: interface User { id, username, role: {id,name,allowed_resources} }
// In types: interface User { id, name, username, role: {id,name,allowed_resources}, plant_ids... }
// getAllUsers in authService returns mapping to match types.ts mostly. 
import { User as AppUser } from '../types';

export const useUsers = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const users = await getAllUsers();
            return users as AppUser[];
        },
        staleTime: 1000 * 60 * 5,
    });

    const createUser = useMutation({
        mutationFn: async (user: any) => {
            return await addUserToDB(user);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    const updateUser = useMutation({
        mutationFn: async (user: AppUser) => {
            return await updateUserInDB(user);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    const deleteUser = useMutation({
        mutationFn: async (id: string) => {
            return await deleteUserInDB(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    const restoreUser = useMutation({
        mutationFn: async ({ id, user }: { id: string; user: AppUser }) => {
            return await restoreUserInDB(id);
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
