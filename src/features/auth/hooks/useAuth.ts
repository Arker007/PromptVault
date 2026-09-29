import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { message } from '@/shared/lib/message.ts';
import { authApi } from '../api/authApi.ts';
import { authStorage } from '@/shared/api/apiClient.ts';
import { LoginCredentials, RegisterCredentials } from '../types/index.ts';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const hasToken = Boolean(authStorage.getToken());

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const res = await authApi.getMe();
      return res.user;
    },
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (res) => {
      authStorage.setToken(res.token);
      queryClient.setQueryData(authKeys.me, res.user);
      message.success(`Welcome back, ${res.user.displayName}`);
      navigate('/prompts', { replace: true });
    },
    onError: (err: any) => {
      message.error(err.message || 'Login failed. Please check credentials.');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterCredentials) => authApi.register(credentials),
    onSuccess: (res) => {
      authStorage.setToken(res.token);
      queryClient.setQueryData(authKeys.me, res.user);
      message.success(`Account created successfully! Welcome to PromptVault.`);
      navigate('/prompts', { replace: true });
    },
    onError: (err: any) => {
      message.error(err.message || 'Registration failed');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      authStorage.removeToken();
      queryClient.clear();
      message.info('Logged out');
      navigate('/login', { replace: true });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { displayName?: string; preferences?: Record<string, any> }) =>
      authApi.updateProfile(data),
    onSuccess: (res) => {
      queryClient.setQueryData(authKeys.me, res.user);
      message.success('Preferences saved');
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to update preferences');
    },
  });

  const user = data || null;
  const isAuthenticated = Boolean(user && hasToken);

  return {
    user,
    isAuthenticated,
    isLoading: hasToken && isLoading,
    isError,
    refetch,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
  };
}
