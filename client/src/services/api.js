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
  extractResults: (files) => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    return request('/results/extract', { method: 'POST', body: form });
  },
  listPresets: () => request('/presets'),
  createPreset: (preset) =>
    request('/presets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(preset) }),
  deletePreset: (id) => request(`/presets/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
