import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { get, post, del } from '../../services/client';
import type { CreateGoalRequest, Goal, GoalListResponse, GoalProgress, Outline } from '../../types';

export const goalKeys = {
  all: ['goals'] as const,
  list: () => [...goalKeys.all, 'list'] as const,
  detail: (goalId: string) => [...goalKeys.all, 'detail', goalId] as const,
  outline: (goalId: string) => [...goalKeys.all, 'outline', goalId] as const,
  progress: (goalId: string) => [...goalKeys.all, 'progress', goalId] as const,
};

export const useGoals = (options?: Partial<UseQueryOptions<GoalListResponse, Error>>) => {
  return useQuery<GoalListResponse, Error>({
    queryKey: goalKeys.list(),
    queryFn: () => get<GoalListResponse>('/goals'),
    ...options,
  });
};

export const useGoal = (goalId: string, options?: Partial<UseQueryOptions<Goal, Error>>) => {
  return useQuery<Goal, Error>({
    queryKey: goalKeys.detail(goalId),
    queryFn: () => get<Goal>(`/goals/${goalId}`),
    enabled: !!goalId,
    ...options,
  });
};

export const useOutline = (goalId: string, options?: Partial<UseQueryOptions<Outline, Error>>) => {
  return useQuery<Outline, Error>({
    queryKey: goalKeys.outline(goalId),
    queryFn: () => get<Outline>(`/goals/${goalId}/outline`),
    enabled: !!goalId,
    ...options,
  });
};

export const useProgress = (goalId: string) => {
  return useQuery<GoalProgress, Error>({
    queryKey: goalKeys.progress(goalId),
    queryFn: () => get<GoalProgress>(`/goals/${goalId}/progress`),
    enabled: !!goalId,
  });
};

export const useCreateGoal = () => {
  return useMutation({
    mutationFn: (body: CreateGoalRequest) => post<Goal>('/goals', body),
  });
};

export const useDeleteGoal = () => {
  return useMutation({
    mutationFn: (goalId: string) => del(`/goals/${goalId}`),
  });
};
