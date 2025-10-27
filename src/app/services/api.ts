export const API_BASE_URL = (window as any).ENV?.API_URL || 'http://localhost:8080/api';

export function apiUrl(path: string): string {
  const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  return url;
}