import { environment } from '../../../environments/environment';

export function resolveBackendUrl(): string {
  const normalized = environment.apiUrl.replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized.slice(0, -4) : normalized;
}
