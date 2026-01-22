import type { Space, SpaceDetail, Document, APIKey, Stats, QueryLog, ChatResponse, UsageData } from '@/types/api'

const BASE_URL = '/api'
const TOKEN_KEY = 'polidex_admin_token'

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAdminToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

function getAuthHeaders(): HeadersInit {
  const token = getAdminToken()
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication required')
    }
    if (response.status === 403) {
      throw new Error('Invalid credentials')
    }
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || 'Request failed')
  }

  return response.json()
}

export const spacesAPI = {
  list: () => fetchAPI<{ spaces: Space[]; total: number }>('/spaces'),
  get: (id: number) => fetchAPI<SpaceDetail>(`/spaces/${id}`),
  create: (data: { name: string; description?: string }) =>
    fetchAPI<Space>('/spaces', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number) => fetchAPI(`/spaces/${id}`, { method: 'DELETE' }),
}

export const documentsAPI = {
  list: (spaceId?: number) =>
    fetchAPI<{ documents: Document[]; total: number }>(
      `/documents${spaceId ? `?space_id=${spaceId}` : ''}`
    ),
  get: (id: number) => fetchAPI<Document>(`/documents/${id}`),
  upload: async (file: File, spaceIds: number[]) => {
    const formData = new FormData()
    formData.append('file', file)
    spaceIds.forEach((id) => formData.append('space_ids', id.toString()))

    const response = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required')
      }
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
      throw new Error(error.detail || 'Upload failed')
    }

    return response.json()
  },
  delete: (id: number) => fetchAPI(`/documents/${id}`, { method: 'DELETE' }),
  addToSpace: (docId: number, spaceId: number) =>
    fetchAPI(`/documents/${docId}/spaces/${spaceId}`, { method: 'POST' }),
  removeFromSpace: (docId: number, spaceId: number) =>
    fetchAPI(`/documents/${docId}/spaces/${spaceId}`, { method: 'DELETE' }),
}

export const apiKeysAPI = {
  list: (spaceId?: number) =>
    fetchAPI<{ api_keys: APIKey[] }>(`/api-keys${spaceId ? `?space_id=${spaceId}` : ''}`),
  create: (data: { name: string; space_id: number }) =>
    fetchAPI<{ id: number; name: string; space_id: number; key: string; message: string }>(
      '/api-keys',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  revoke: (id: number) => fetchAPI(`/api-keys/${id}/revoke`, { method: 'POST' }),
  delete: (id: number) => fetchAPI(`/api-keys/${id}`, { method: 'DELETE' }),
}

export const statsAPI = {
  overview: () => fetchAPI<Stats>('/stats/overview'),
  logs: (limit = 100) => fetchAPI<{ logs: QueryLog[]; total: number }>(`/stats/logs?limit=${limit}`),
}

export const usageAPI = {
  get: (limit = 100, offset = 0) => fetchAPI<UsageData>(`/stats/usage?limit=${limit}&offset=${offset}`),
}

export const chatAPI = {
  query: (data: { query: string; space_id: number; top_k?: number }) =>
    fetchAPI<ChatResponse>('/chat/query', { method: 'POST', body: JSON.stringify(data) }),
}
