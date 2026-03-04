import { useState, useEffect } from 'react'
import type { TradeOffer, Plant } from '../types'
import { offersApi, plantsApi } from '../api/client'
import { useAuthStore } from '../store/auth'
import OfferCard from '../components/OfferCard'
import CreateOfferModal from '../components/modals/CreateOfferModal'
import RequestTradeModal from '../components/modals/RequestTradeModal'
import { PLANT_TYPES, TYPE_ICONS, REGIONS } from '../utils/plant'
import { useToast } from '../context/ToastContext'

type Tab = 'all' | 'compatible' | 'my'

export default function OffersPage() {
  const { user } = useAuthStore()
  const { showToast } = useToast()

  const [offers, setOffers] = useState<TradeOffer[]>([])
  const [myPlants, setMyPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [typeFilter, setTypeFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [requestOffer, setRequestOffer] = useState<TradeOffer | null>(null)

  useEffect(() => {
    plantsApi.getMy().then(r => setMyPlants(r.data)).catch(() => {})
  }, [])

  async function loadOffers() {
  setLoading(true)
  try {
    if (tab === 'compatible') {
      const res = await offersApi.getCompatible()
      setOffers(res.data ?? [])
    } else if (tab === 'my') {
      const all = await offersApi.getAll({ status: '' })
      setOffers((all.data ?? []).filter(o => o.owner_id === user?.id))
    } else {
      const res = await offersApi.getAll({
        type: typeFilter || undefined,
        region: regionFilter || undefined,
      })
      setOffers(res.data ?? [])
    }
  } catch {
    showToast('Ошибка загрузки', 'error')
  } finally {
    setLoading(false)
  }
}

  useEffect(() => { loadOffers() }, [tab, typeFilter, regionFilter])

  async function handleCreateOffer(data: Parameters<typeof offersApi.create>[0]) {
    await offersApi.create(data)
    showToast('Предложение создано!')
    loadOffers()
  }

  async function handleRequest(offer: TradeOffer) {
    setRequestOffer(offer)
  }

  async function handleRequestSubmit(plantId: number) {
    if (!requestOffer) return
    await offersApi.request(requestOffer.id, plantId)
    showToast('Запрос на обмен отправлен!')
    setRequestOffer(null)
    loadOffers()
  }

  async function handleAccept(offer: TradeOffer) {
    try {
      await offersApi.accept(offer.id)
      showToast('🎉 Обмен принят!')
      loadOffers()
    } catch (e: any) {
      showToast(e.response?.data?.error ?? 'Ошибка', 'error')
    }
  }

  async function handleReject(offer: TradeOffer) {
    try {
      await offersApi.reject(offer.id)
      showToast('Запрос отклонён')
      loadOffers()
    } catch (e: any) {
      showToast(e.response?.data?.error ?? 'Ошибка', 'error')
    }
  }

  async function handleDelete(offer: TradeOffer) {
    if (!confirm('Удалить предложение?')) return
    try {
      await offersApi.delete(offer.id)
      showToast('Предложение удалено')
      loadOffers()
    } catch (e: any) {
      showToast(e.response?.data?.error ?? 'Ошибка', 'error')
    }
  }

  const openCount = offers.filter(o => o.status === 'open').length

  return (
    <div className="page">
      {showCreate && (
        <CreateOfferModal
          myPlants={myPlants}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreateOffer}
        />
      )}
      {requestOffer && (
        <RequestTradeModal
          offer={requestOffer}
          myPlants={myPlants}
          onClose={() => setRequestOffer(null)}
          onSubmit={handleRequestSubmit}
        />
      )}

      <div className="page-header">
        <div>
          <div className="page-title">Предложения <em>обмена</em></div>
          <div className="page-sub">{openCount} открытых предложений</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Создать предложение</button>
      </div>

      <div className="tabs">
        {([
          ['all', 'Все предложения'],
          ['compatible', '✨ Подходящие мне'],
          ['my', 'Мои предложения'],
        ] as [Tab, string][]).map(([v, l]) => (
          <button key={v} className={`tab${tab === v ? ' active' : ''}`} onClick={() => setTab(v)}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'all' && (
        <div className="filters">
          <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Все типы</option>
            {PLANT_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
          </select>
          <select className="filter-select" value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
            <option value="">Все регионы</option>
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      )}

      {loading ? (
        <div className="spinner" />
      ) : offers.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🔄</div>
          <div className="empty-text">Предложений не найдено</div>
          {tab === 'compatible' && (
            <div className="empty-sub">Добавьте растения в свою коллекцию, чтобы найти совместимые предложения</div>
          )}
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Создать первое</button>
        </div>
      ) : (
        <div className="grid grid-3">
          {offers.map(o => (
            <OfferCard
              key={o.id}
              offer={o}
              currentUserId={user?.id}
              onRequest={handleRequest}
              onAccept={handleAccept}
              onReject={handleReject}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}