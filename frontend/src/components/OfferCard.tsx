import type { TradeOffer } from '../types'
import { TYPE_ICONS, getPlantPalette, timeAgo, initials } from '../utils/plant'

interface Props {
  offer: TradeOffer
  currentUserId?: number
  onRequest?: (offer: TradeOffer) => void
  onAccept?: (offer: TradeOffer) => void
  onReject?: (offer: TradeOffer) => void
  onDelete?: (offer: TradeOffer) => void
}

export default function OfferCard({ offer, currentUserId, onRequest, onAccept, onReject, onDelete }: Props) {
  const plant = offer.offered_plant
  const { bg } = plant ? getPlantPalette(plant.id, plant.name) : { bg: '#e8f5e9' }
  const icon = plant ? (TYPE_ICONS[plant.type] ?? '🌿') : '🌿'

  const isOwner = offer.owner_id === currentUserId
  const wantedTypes = offer.wanted_types
    ? offer.wanted_types.split(',').map(s => s.trim()).filter(Boolean)
    : []

  return (
    <div className="offer-card">
      <div className="offer-header">
        <div className="offer-plant">
          <div className="offer-plant-icon" style={{ background: `${bg}cc` }}>
            {icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="offer-plant-name">{plant?.name ?? '—'}</div>
            <div className="offer-plant-sub">
              {plant?.species || plant?.type}
              {plant?.region && ` · ${plant.region}`}
            </div>
          </div>
        </div>
        <span className={`status-badge status-${offer.status}`}>{offer.status}</span>
      </div>

      {offer.description && (
        <p style={{ fontSize: 13, color: 'var(--mist)', marginBottom: 12, lineHeight: 1.5 }}>
          {offer.description}
        </p>
      )}

      <div className="offer-wants">
        <strong>Хочу взамен: </strong>
        {wantedTypes.length > 0
          ? wantedTypes.map(t => `${TYPE_ICONS[t] ?? '🌿'} ${t}`).join(', ')
          : 'что угодно'}
        {offer.wanted_region && <span> · 📍 {offer.wanted_region}</span>}
      </div>

      <div className="offer-footer">
        <div className="offer-owner">
          <div className="avatar-sm">{initials(offer.owner?.name)}</div>
          <span>{offer.owner?.name}</span>
          {offer.owner?.region && (
            <span style={{ fontSize: 12, opacity: 0.7 }}>· {offer.owner.region}</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {!isOwner && offer.status === 'open' && onRequest && (
            <button className="btn btn-primary btn-sm" onClick={() => onRequest(offer)}>
              🌿 Предложить обмен
            </button>
          )}
          {isOwner && offer.status === 'pending' && (
            <>
              {onAccept && (
                <button className="btn btn-primary btn-sm" onClick={() => onAccept(offer)}>✓ Принять</button>
              )}
              {onReject && (
                <button className="btn btn-danger btn-sm" onClick={() => onReject(offer)}>✕ Отклонить</button>
              )}
            </>
          )}
          {isOwner && (offer.status === 'open' || offer.status === 'completed') && onDelete && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(offer)}>🗑</button>
          )}
        </div>
      </div>

      {offer.status === 'pending' && offer.requester && (
        <div style={{
          marginTop: 10,
          padding: '8px 12px',
          background: '#fff8e1',
          borderRadius: 8,
          fontSize: 13,
          color: '#f57f17',
        }}>
          ⏳ Запрос от <strong>{offer.requester.name}</strong>
          {offer.requested_plant && ` · предлагает: ${offer.requested_plant.name}`}
        </div>
      )}

      <div className="offer-time">{timeAgo(offer.created_at)}</div>
    </div>
  )
}