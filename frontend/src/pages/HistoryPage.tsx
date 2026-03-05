import { useState, useEffect } from 'react'
import type { TradeHistory } from '../types'
import { historyApi } from '../api/client'
import { TYPE_ICONS, timeAgo, initials } from '../utils/plant'
import { useToast } from '../context/ToastContext'

export default function HistoryPage() {
  const [history, setHistory] = useState<TradeHistory[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    historyApi.getAll()
      .then(resolt => setHistory(resolt.data))
      .catch(() => showToast('Ошибка загрузки', 'error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">История <em>обменов</em></div>
          <div className="page-sub">{history.length} завершённых обменов</div>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : history.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📜</div>
          <div className="empty-text">История пока пуста</div>
          <div className="empty-sub">Завершённые обмены будут отображаться здесь</div>
        </div>
      ) : (
        history.map(h => (
          <div key={h.id} className="history-item">
            <div className="history-users">
              <div style={{ fontWeight: 600, color: 'var(--bark)', fontSize: 13 }}>
                <div className="avatar-sm" style={{ margin: '0 auto 4px' }}>{initials(h.initiator?.name)}</div>
                {h.initiator?.name?.split(' ')[0]}
              </div>
              <div style={{ margin: '4px 0', color: 'var(--mist)' }}>⇄</div>
              <div style={{ fontWeight: 600, color: 'var(--bark)', fontSize: 13 }}>
                <div className="avatar-sm" style={{ margin: '0 auto 4px', background: 'var(--clay)', color: '#fff' }}>
                  {initials(h.receiver?.name)}
                </div>
                {h.receiver?.name?.split(' ')[0]}
              </div>
            </div>

            <div className="history-plant" style={{ background: '#e8f5e9' }}>
              <div style={{ fontSize: 10, color: 'var(--mist)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>
                Отдал
              </div>
              <div className="history-plant-name">
                {TYPE_ICONS[h.plant_given?.type ?? 'other']} {h.plant_given?.name}
              </div>
              {h.plant_given?.species && (
                <div className="history-plant-type">{h.plant_given.species}</div>
              )}
            </div>

            <div className="history-arrow">⇄</div>

            <div className="history-plant" style={{ background: '#fce4ec' }}>
              <div style={{ fontSize: 10, color: 'var(--mist)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>
                Получил
              </div>
              <div className="history-plant-name">
                {TYPE_ICONS[h.plant_received?.type ?? 'other']} {h.plant_received?.name}
              </div>
              {h.plant_received?.species && (
                <div className="history-plant-type">{h.plant_received.species}</div>
              )}
            </div>

            <div className="history-meta">
              <div style={{ fontSize: 11, color: 'var(--mist)' }}>
                🕐 {timeAgo(h.created_at)}
              </div>
              {h.notes && (
                <div style={{ fontSize: 12, marginTop: 4, color: 'var(--bark)' }}>{h.notes}</div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}