import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { offersApi } from '../api/client'
import { initials } from '../utils/plant'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [pendingCount, setPendingCount] = useState(0)

  // Загружаем количество входящих запросов
  useEffect(() => {
    if (!user) return

    async function fetchPending() {
      try {
        const res = await offersApi.getAll({ status: 'pending' })
        const count = (res.data ?? []).filter(o => o.owner_id === user!.id).length
        setPendingCount(count)
      } catch {}
    }

    fetchPending()
    // Проверяем каждые 30 секунд
    const interval = setInterval(fetchPending, 30_000)
    return () => clearInterval(interval)
  }, [user, location.pathname]) // обновляем при смене страницы

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="nav">
      <NavLink to="/" className="nav-logo">
        🌿 Plant<span>Swap</span>
      </NavLink>

      <NavLink to="/" end className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}>
        🌿 Каталог
      </NavLink>
      <NavLink to="/my-plants" className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}>
        🪴 Мои растения
      </NavLink>

      {/* Обмены с бейджем */}
      <NavLink to="/offers" className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}>
        🔄 Обмены
        {pendingCount > 0 && (
          <span style={{
            background: '#ef5350',
            color: '#fff',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            padding: '1px 7px',
            marginLeft: 2,
            lineHeight: 1.6,
          }}>
            {pendingCount}
          </span>
        )}
      </NavLink>

      <NavLink to="/history" className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}>
        📜 История
      </NavLink>
      <NavLink to="/reports" className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}>
        📊 Отчёты
      </NavLink>

      <div className="nav-spacer" />

      <div className="nav-user">
        <NavLink
          to="/profile"
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
        >
          <div
            className="nav-avatar"
            style={{
              background: user?.avatar ? 'transparent' : undefined,
              border: location.pathname === '/profile' ? '2px solid var(--clay-light)' : undefined,
              overflow: 'hidden',
            }}
          >
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials(user?.name)
            }
          </div>
          <span style={{
            color: location.pathname === '/profile' ? '#fff' : 'rgba(255,255,255,0.85)',
            maxWidth: 100,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 14,
          }}>
            {user?.name?.split(' ')[0]}
          </span>
        </NavLink>

        <button
          className="nav-btn"
          style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}
          onClick={handleLogout}
        >
          выйти
        </button>
      </div>
    </nav>
  )
}