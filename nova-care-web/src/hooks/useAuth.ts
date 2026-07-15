import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useAuth() {
  const router = useRouter();
  const {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    setAuth,
    clearAuth,
  } = useAuthStore();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Đăng nhập thành công!');
      router.push('/');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Đăng ký thành công!');
      router.push('/');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại');
    },
  });

  // Logout
  const logout = async () => {
    try {
      if (accessToken && refreshToken) {
        await authService.logout(accessToken, refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      router.push('/');
      toast.success('Đăng xuất thành công');
    }
  };

  // Get profile query
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => authService.getProfile(accessToken!),
    enabled: !!accessToken && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: user || profileQuery.data,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading: isLoading || profileQuery.isLoading,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    logout,
    logoutAll: async () => {
      if (accessToken) {
        await authService.logoutAll(accessToken);
      }
      clearAuth();
      router.push('/');
      toast.success('Đã đăng xuất khỏi tất cả thiết bị');
    },
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  };
}
