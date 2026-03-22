import HTTPService from './client';

export async function post<T = unknown, D = unknown>(url: string, data: D): Promise<T> {
  return await new HTTPService().instance.post<T>(url, data) as T;
}

export async function get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<T> {
  return await new HTTPService().instance.get<T>(url, { params }) as T;
}

export async function patch<T = unknown, D = unknown>(url: string, data: D): Promise<T> {
  return await new HTTPService().instance.patch<T>(url, data) as T;
}

export async function del<T = unknown>(url: string): Promise<T> {
  return await new HTTPService().instance.delete<T>(url) as T;
}
