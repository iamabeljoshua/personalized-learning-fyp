import { queryClient } from '../../lib/queryClient';
import type { Student } from '../../types';

export const saveToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const saveUser = (user: Student) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): Student | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  queryClient.clear();
};
