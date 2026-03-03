export type PlantType =
  | 'flowering' | 'cactus' | 'fern' | 'succulent'
  | 'tropical' | 'herb' | 'tree' | 'vine' | 'other'

export type OfferStatus = 'open' | 'pending' | 'completed' | 'cancelled'

export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  region?: string
  bio?: string
  created_at: string
  plants?: Plant[]
}

export interface Plant {
  id: number
  user_id: number
  user?: User
  name: string
  species?: string
  type: PlantType
  description?: string
  image_url?: string
  region?: string
  is_available: boolean
  trade_count: number
  created_at: string
}

export interface TradeOffer {
  id: number
  owner_id: number
  owner?: User
  offered_plant_id: number
  offered_plant?: Plant
  wanted_types?: string
  wanted_region?: string
  description?: string
  status: OfferStatus
  requester_id?: number
  requester?: User
  requested_plant_id?: number
  requested_plant?: Plant
  created_at: string
}

export interface TradeHistory {
  id: number
  trade_offer_id: number
  initiator_id: number
  initiator?: User
  receiver_id: number
  receiver?: User
  plant_given_id: number
  plant_given?: Plant
  plant_received_id: number
  plant_received?: Plant
  notes?: string
  created_at: string
}

export interface PaginatedPlants {
  data: Plant[]
  total: number
  page: number
  limit: number
}

export interface Stats {
  total_users: number
  total_plants: number
  total_trades: number
  open_offers: number
}

export interface ActiveUserReport {
  user_id: number
  name: string
  email: string
  trade_count: number
}

// ─── Input DTOs ───────────────────────────────────────────────────────────────

export interface RegisterInput {
  name: string
  email: string
  password: string
  region?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface CreatePlantInput {
  name: string
  species?: string
  type: PlantType
  description?: string
  image_url?: string
  region?: string
}

export interface CreateOfferInput {
  offered_plant_id: number
  wanted_types?: string
  wanted_region?: string
  description?: string
}