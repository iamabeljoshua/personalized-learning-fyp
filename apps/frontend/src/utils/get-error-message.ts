import type { AxiosError } from 'axios';

export function getErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<{ message: string | string[] }>;
  const message = axiosErr.response?.data?.message || 'Something went wrong';
  return Array.isArray(message) ? message[0] : message;
}
