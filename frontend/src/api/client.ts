import axios from 'axios'
import type {
  Plant, TradeOffer, TradeHistory, PaginatedPlants, Stats,
  ActiveUserReport, RegisterInput, LoginInput, CreatePlantInput,
  CreateOfferInput, User,
} from '../types'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// ── Auth header injection ─────────────────────────────────────────────────────
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── 401 → logout ─────────────────────────────────────────────────────────────
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: RegisterInput) =>
    http.post<{ token: string; user: User }>('/auth/register', data),
  login: (data: LoginInput) =>
    http.post<{ token: string; user: User }>('/auth/login', data),
  getProfile: () => http.get<User>('/profile'),
  updateProfile: (data: Partial<User>) => http.put<User>('/profile', data),
}

// ─── Plants ───────────────────────────────────────────────────────────────────
export const plantsApi = {
  getAll: (params?: { type?: string; region?: string; search?: string; page?: number; limit?: number }) =>
    http.get<PaginatedPlants>('/plants', { params }),
  getMy: () => http.get<Plant[]>('/plants/my'),
  getById: (id: number) => http.get<Plant>(`/plants/${id}`),
  search: (q: string) => http.get<Plant[]>('/plants/search', { params: { q } }),
  create: (data: CreatePlantInput) => http.post<Plant>('/plants', data),
  update: (id: number, data: Partial<CreatePlantInput> & { is_available?: boolean }) =>
    http.put<Plant>(`/plants/${id}`, data),
  delete: (id: number) => http.delete(`/plants/${id}`),
}

// ─── Offers ───────────────────────────────────────────────────────────────────
export const offersApi = {
  getAll: (params?: { type?: string; region?: string; status?: string }) =>
    http.get<TradeOffer[]>('/offers', { params }),
  getCompatible: () => http.get<TradeOffer[]>('/offers/compatible'),
  getById: (id: number) => http.get<TradeOffer>(`/offers/${id}`),
  create: (data: CreateOfferInput) => http.post<TradeOffer>('/offers', data),
  update: (id: number, data: Partial<CreateOfferInput>) =>
    http.put<TradeOffer>(`/offers/${id}`, data),
  delete: (id: number) => http.delete(`/offers/${id}`),
  request: (id: number, requestedPlantId: number) =>
    http.post<TradeOffer>(`/offers/${id}/request`, { requested_plant_id: requestedPlantId }),
  accept: (id: number) => http.patch(`/offers/${id}/accept`),
  reject: (id: number) => http.patch(`/offers/${id}/reject`),
}

// ─── History ──────────────────────────────────────────────────────────────────
export const historyApi = {
  getAll: () => http.get<TradeHistory[]>('/history'),
  getById: (id: number) => http.get<TradeHistory>(`/history/${id}`),
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  getActiveUsers: () => http.get<ActiveUserReport[]>('/reports/active-users'),
  getPopularPlants: () => http.get<Plant[]>('/reports/popular-plants'),
  getStats: () => http.get<Stats>('/reports/stats'),
}

export default http