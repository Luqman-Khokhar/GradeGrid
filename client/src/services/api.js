import { getTurnstileToken } from './turnstile';

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE_URL}/api${path}`, options);
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.success === false) {
    throw new ApiError(res.status, body?.message ?? `Request failed (${res.status})`);
  }
  return body?.data;
};

export const api = {
  health: () => request('/health'),
  extractResults: async (files) => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    // Tokens are single use, so every batch gets its own.
    const token = await getTurnstileToken();
    const headers = token ? { 'cf-turnstile-response': token } : undefined;
    return request('/results/extract', { method: 'POST', body: form, headers });
  },
};
