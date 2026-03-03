import { useState, useEffect } from 'react'
import type { Stats, ActiveUserReport, Plant } from '../types'
import { reportsApi } from '../api/client'
import { TYPE_ICONS } from '../utils/plant'
import { useToast } from '../context/ToastContext'

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeUsers, setActiveUsers] = useState<ActiveUserReport[]>([])
  const [popularPlants, setPopularPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    Promise.all([
      reportsApi.getStats(),
      reportsApi.getActiveUsers(),
      reportsApi.getPopularPlants(),
    ])
      .then(([s, u, p]) => {
        setStats(s.data)
        setActiveUsers(u.data)
        setPopularPlants(p.data)
      })
      .catch(() => showToast('Ошибка загрузки', 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />

  const maxUserTrades = activeUsers[0]?.trade_count ?? 1
  const maxPlantTrades = popularPlants[0]?.trade_count ?? 1

  const STAT_ITEMS = stats ? [
    { icon: '👤', num: stats.total_users,  label: 'Пользователей' },
    { icon: '🌿', num: stats.total_plants, label: 'Растений в базе' },
    { icon: '🔄', num: stats.total_trades, label: 'Обменов совершено' },
    { icon: '📋', num: stats.open_offers,  label: 'Открытых предложений' },
  ] : []

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Отчёты и <em>статистика</em></div>
          <div className="page-sub">Аналитика активности платформы</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {STAT_ITEMS.map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div className="stat-number">{s.num.toLocaleString('ru')}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        {/* Active Users */}
        <div className="section-card">
          <div className="section-title">🏆 Самые активные пользователи</div>
          {activeUsers.length === 0 ? (
            <p style={{ color: 'var(--mist)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
              Данных пока нет
            </p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Пользователь</th>
                  <th style={{ textAlign: 'right' }}>Обменов</th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.map((u, i) => (
                  <tr key={u.user_id}>
                    <td>
                      <span className={`rank-num rank-${i + 1}`}>{i + 1}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--mist)' }}>{u.email}</div>
                      <div className="bar">
                        <div className="bar-fill" style={{ width: `${(u.trade_count / maxUserTrades) * 100}%` }} />
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--moss)', textAlign: 'right' }}>
                      {u.trade_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Popular Plants */}
        <div className="section-card">
          <div className="section-title">🌸 Популярные растения</div>
          {popularPlants.length === 0 ? (
            <p style={{ color: 'var(--mist)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
              Данных пока нет — совершите первый обмен!
            </p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Растение</th>
                  <th style={{ textAlign: 'right' }}>Обменов</th>
                </tr>
              </thead>
              <tbody>
                {popularPlants.map((p, i) => (
                  <tr key={p.id}>
                    <td>
                      <span className={`rank-num rank-${i + 1}`}>{i + 1}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{TYPE_ICONS[p.type] ?? '🌿'}</span>
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.name}</div>
                          <div className="bar">
                            <div className="bar-fill" style={{ width: `${(p.trade_count / maxPlantTrades) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--clay)', textAlign: 'right' }}>
                      {p.trade_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}