import { useState } from 'react'
import type { Plant, TradeOffer } from '../../types'
import { TYPE_ICONS, getPlantPalette } from '../../utils/plant'

interface Props {
  offer: TradeOffer
  myPlants: Plant[]
  onClose: () => void
  onSubmit: (plantId: number) => Promise<void>
}

export default function RequestTradeModal({ offer, myPlants, onClose, onSubmit }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const available = myPlants.filter(p => p.is_available && p.id !== offer.offered_plant_id)

  async function handleSubmit() {
    if (!selectedId) { setError('Выберите растение'); return }
    setLoading(true)
    try {
      await onSubmit(selectedId)
      onClose()
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">🌿 Предложить обмен</div>

        <div style={{ background: 'var(--paper)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Вы получите:</div>
          <div style={{ color: 'var(--moss)', fontSize: 16, fontFamily: "'Fraunces', serif", fontWeight: 600 }}>
            {TYPE_ICONS[offer.offered_plant?.type ?? 'other']} {offer.offered_plant?.name}
          </div>
        </div>

        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: 'var(--bark)' }}>
          Выберите растение для обмена:
        </div>

        {error && <div className="auth-error">{error}</div>}

        {available.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--mist)', textAlign: 'center', padding: '20px 0' }}>
            Нет доступных растений для обмена
          </p>
        ) : (
          <div className="plant-select-grid">
            {available.map(p => {
              const { bg } = getPlantPalette(p.id, p.name)
              return (
                <div
                  key={p.id}
                  className={`plant-select-item${selectedId === p.id ? ' selected' : ''}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 22, flexShrink: 0,
                  }}>
                    {TYPE_ICONS[p.type] ?? '🌿'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </div>
                    {p.region && <div style={{ fontSize: 11, color: 'var(--mist)' }}>📍 {p.region}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !selectedId || available.length === 0}
          >
            {loading ? 'Отправляем...' : 'Отправить запрос'}
          </button>
        </div>
      </div>
    </div>
  )
}