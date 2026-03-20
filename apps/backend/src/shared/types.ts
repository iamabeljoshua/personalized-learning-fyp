export type UpdateOf<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;
export type CreateOf<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
