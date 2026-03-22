import { useQuery, useMutation } from '@tanstack/react-query';
import { get, post } from '../../services/client';
import type { Quiz, SubmitAttemptRequest, AttemptResult } from '../../types';

export const quizKeys = {
  all: ['quizzes'] as const,
  quiz: (nodeId: string) => [...quizKeys.all, nodeId] as const,
};

export const useQuiz = (nodeId: string) => {
  return useQuery<Quiz, Error>({
    queryKey: quizKeys.quiz(nodeId),
    queryFn: () => get<Quiz>(`/quizzes/${nodeId}`),
    enabled: !!nodeId,
  });
};

export const useSubmitAttempt = (nodeId: string) => {
  return useMutation<AttemptResult, Error, SubmitAttemptRequest>({
    mutationFn: (data) => post<AttemptResult, SubmitAttemptRequest>(`/quizzes/${nodeId}/attempt`, data),
  });
};
