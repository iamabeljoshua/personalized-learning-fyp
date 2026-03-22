import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { get, post, patch } from '../../services/client';
import type { OnboardRequest, UpdateProfileRequest, ProfileResponse } from '../../types';

export const studentKeys = {
  all: ['students'] as const,
  profile: () => [...studentKeys.all, 'profile'] as const,
};

export const useProfile = (options?: Partial<UseQueryOptions<ProfileResponse, Error>>) => {
  return useQuery<ProfileResponse, Error>({
    queryKey: studentKeys.profile(),
    queryFn: () => get<ProfileResponse>('/students/profile'),
    ...options,
  });
};

export const useOnboard = () => {
  return useMutation({
    mutationFn: (body: OnboardRequest) => post<ProfileResponse>('/students/onboard', body),
  });
};

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => patch<ProfileResponse>('/students/profile', body),
  });
};
