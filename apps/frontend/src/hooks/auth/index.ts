import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { post, get } from '../../services/client';
import { saveToken, saveUser, getUser, getToken, logout } from '../../auth/storage/auth.storage';
import type { AuthResponse, LoginRequest, RegisterRequest, Student } from '../../types';

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

export const useUser = () => {
  return useQuery<Student>({
    queryKey: authKeys.user(),
    queryFn: async () => {
      const token = getToken();
      if (!token) throw new Error('No token');

      const cached = getUser();
      if (cached) return cached;

      const user = await get<Student>('/auth/me');
      saveUser(user);
      return user;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: LoginRequest) => post<AuthResponse>('/auth/login', body),
    onSuccess: (data) => {
      saveToken(data.accessToken);
      saveUser(data.user);
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: RegisterRequest) => post<AuthResponse>('/auth/register', body),
    onSuccess: (data) => {
      saveToken(data.accessToken);
      saveUser(data.user);
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      logout();
    },
  });
};

export const useIsAuthenticated = () => {
  const token = getToken();
  const { data: user, isLoading, error } = useUser();

  return {
    isAuthenticated: !!token && !!user && !error,
    isLoading,
    user,
  };
};
