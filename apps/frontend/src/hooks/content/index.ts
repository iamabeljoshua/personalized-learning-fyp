import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { get } from '../../services/client';
import type { ContentItem, ContentStatus } from '../../types';

export const contentKeys = {
  all: ['content'] as const,
  item: (nodeId: string) => [...contentKeys.all, nodeId] as const,
  status: (nodeId: string) => [...contentKeys.all, 'status', nodeId] as const,
};

export const useContent = (nodeId: string, options?: Partial<UseQueryOptions<ContentItem, Error>>) => {
  return useQuery<ContentItem, Error>({
    queryKey: contentKeys.item(nodeId),
    queryFn: () => get<ContentItem>(`/content/${nodeId}`),
    enabled: !!nodeId,
    ...options,
  });
};

export const useContentStatus = (nodeId: string, options?: Partial<UseQueryOptions<ContentStatus, Error>>) => {
  return useQuery<ContentStatus, Error>({
    queryKey: contentKeys.status(nodeId),
    queryFn: () => get<ContentStatus>(`/content/${nodeId}/status`),
    enabled: !!nodeId,
    refetchInterval: (query) => {
      const d = query.state.data;
      if (!d) return 3000;
      const terminal = ['ready', 'failed', 'skipped'];
      if (
        terminal.includes(d.textStatus) &&
        terminal.includes(d.audioStatus) &&
        terminal.includes(d.videoStatus)
      ) return false;
      return 3000;
    },
    ...options,
  });
};
