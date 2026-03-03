import type { Plant } from '../types'
import { TYPE_ICONS, TYPE_COLORS, getPlantPalette, initials } from '../utils/plant'
import type { ReactNode } from 'react'

interface Props {
  plant: Plant
  onClick?: () => void
  actions?: ReactNode
}

export default function PlantCard({ plant, onClick, actions }: Props) {
  const { bg, accent } = getPlantPalette(plant.id, plant.name)
  const icon = TYPE_ICONS[plant.type] ?? '🌿'
  const color = TYPE_COLORS[plant.type] ?? '#888'

  return (
    <div className="plant-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div
        className="plant-card-img"
        style={{ background: `linear-gradient(135deg, ${bg}, ${accent}40)` }}
      >
        {plant.image_url ? (
          <img src={plant.image_url} alt={plant.name} />
        ) : (
          <span style={{ fontSize: 60, zIndex: 1 }}>{icon}</span>
        )}
        <div className="plant-card-badge" style={{ background: color }}>
          {plant.type}
        </div>
      </div>

      <div className="plant-card-body">
        <div className="plant-card-name">{plant.name}</div>
        {plant.species && (
          <div className="plant-card-species">{plant.species}</div>
        )}

        <div className="plant-card-meta">
          {plant.region && (
            <span className="tag tag-region">📍 {plant.region}</span>
          )}
          {plant.trade_count > 0 && (
            <span className="tag tag-trades">🔄 {plant.trade_count}</span>
          )}
          {!plant.is_available && (
            <span className="tag tag-unavailable">недоступно</span>
          )}
        </div>

        {plant.user && (
          <div className="plant-card-user">
            <div className="avatar-sm">{initials(plant.user.name)}</div>
            <span>{plant.user.name}</span>
            {plant.user.region && (
              <span style={{ marginLeft: 'auto', fontSize: 12 }}>{plant.user.region}</span>
            )}
          </div>
        )}

        {actions && (
          <div className="plant-card-actions" onClick={e => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}