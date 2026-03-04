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
type MyFilter = 'all' | 'open' | 'pending' | 'completed' | 'cancelled'
type MyRole = 'all' | 'owner' | 'requester'

export default function OffersPage() {
  const { user } = useAuthStore()
  const { showToast } = useToast()

  const [offers, setOffers] = useState<TradeOffer[]>([])
  const [myPlants, setMyPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')

  // Фильтры для «Все предложения»
  const [typeFilter, setTypeFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')

  // Фильтры для «Мои предложения»
  const [myStatusFilter, setMyStatusFilter] = useState<MyFilter>('all')
  const [myRoleFilter, setMyRoleFilter] = useState<MyRole>('all')

  const [showCreate, setShowCreate] = useState(false)
  const [requestOffer, setRequestOffer] = useState<TradeOffer | null>(null)

  useEffect(() => {
    plantsApi.getMy().then(r => setMyPlants(r.data ?? [])).catch(() => {})
  }, [])

  async function loadOffers() {
    setLoading(true)
    try {
      if (tab === 'compatible') {
        const res = await offersApi.getCompatible()
        setOffers(res.data ?? [])

      } else if (tab === 'my') {
        const [open, pending, completed, cancelled] = await Promise.all([
          offersApi.getAll({ status: 'open' }),
          offersApi.getAll({ status: 'pending' }),
          offersApi.getAll({ status: 'completed' }),
          offersApi.getAll({ status: 'cancelled' }),
        ])
        const all = [
          ...(open.data ?? []),
          ...(pending.data ?? []),
          ...(completed.data ?? []),
          ...(cancelled.data ?? []),
        ]
        setOffers(all.filter(o =>
          o.owner_id === user?.id || o.requester_id === user?.id
        ))

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

  // Применяем локальные фильтры к «Мои предложения»
  const filteredOffers = tab === 'my'
    ? offers.filter(o => {
        const statusOk = myStatusFilter === 'all' || o.status === myStatusFilter
        const roleOk =
          myRoleFilter === 'all' ||
          (myRoleFilter === 'owner' && o.owner_id === user?.id) ||
          (myRoleFilter === 'requester' && o.requester_id === user?.id)
        return statusOk && roleOk
      })
    : offers

  async function handleCreateOffer(data: Parameters<typeof offersApi.create>[0]) {
    await offersApi.create(data)
    showToast('Предложение создано!')
    loadOffers()
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
      showToast('🎉 Обмен принят! Растения переданы.')
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

  // Счётчики для «Мои предложения»
  const pendingCount = offers.filter(o =>
    o.status === 'pending' && o.owner_id === user?.id
  ).length

  const openCount = tab === 'all'
    ? offers.filter(o => o.status === 'open').length
    : offers.filter(o => o.status === 'open' && o.owner_id === user?.id).length

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
          <div className="page-sub">
            {openCount} открытых
            {pendingCount > 0 && (
              <span style={{
                marginLeft: 10,
                background: '#fff8e1',
                color: '#f57f17',
                padding: '2px 10px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
              }}>
                ⏳ {pendingCount} ожидают подтверждения
              </span>
            )}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Создать предложение
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {([
          ['all', 'Все предложения'],
          ['compatible', '✨ Подходящие мне'],
          ['my', `Мои предложения${pendingCount > 0 ? ` (${pendingCount})` : ''}`],
        ] as [Tab, string][]).map(([v, l]) => (
          <button
            key={v}
            className={`tab${tab === v ? ' active' : ''}`}
            onClick={() => setTab(v)}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Фильтры для «Все предложения» */}
      {tab === 'all' && (
        <div className="filters">
          <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Все типы</option>
            {PLANT_TYPES.map(t => (
              <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>
            ))}
          </select>
          <select className="filter-select" value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
            <option value="">Все регионы</option>
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      )}

      {/* Фильтры для «Мои предложения» */}
      {tab === 'my' && (
        <div className="filters">
          {/* Статус */}
          <div className="type-chips" style={{ marginBottom: 0 }}>
            {([
              ['all',       'Все'],
              ['open',      '🟢 Открытые'],
              ['pending',   '⏳ Ожидают'],
              ['completed', '✅ Завершённые'],
              ['cancelled', '❌ Отменённые'],
            ] as [MyFilter, string][]).map(([v, l]) => (
              <div
                key={v}
                className={`chip${myStatusFilter === v ? ' active' : ''}`}
                onClick={() => setMyStatusFilter(v)}
              >
                {l}
              </div>
            ))}
          </div>

          {/* Роль */}
          <select
            className="filter-select"
            value={myRoleFilter}
            onChange={e => setMyRoleFilter(e.target.value as MyRole)}
          >
            <option value="all">Все роли</option>
            <option value="owner">Я предлагаю</option>
            <option value="requester">Я запрашиваю</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="spinner" />
      ) : filteredOffers.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🔄</div>
          <div className="empty-text">Предложений не найдено</div>
          {tab === 'compatible' && (
            <div className="empty-sub">
              Добавьте растения в коллекцию, чтобы найти совместимые предложения
            </div>
          )}
          {tab !== 'my' && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              Создать первое
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-3">
          {filteredOffers.map(o => (
            <OfferCard
              key={o.id}
              offer={o}
              currentUserId={user?.id}
              onRequest={setRequestOffer}
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