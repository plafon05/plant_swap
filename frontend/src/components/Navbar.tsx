import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { initials } from '../utils/plant'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = [
    { to: '/',          label: '🌿 Каталог' },
    { to: '/my-plants', label: '🪴 Мои растения' },
    { to: '/offers',    label: '🔄 Обмены' },
    { to: '/history',   label: '📜 История' },
    { to: '/reports',   label: '📊 Отчёты' },
  ]

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="nav">
      <NavLink to="/" className="nav-logo">
        🌿 Plant<span>Swap</span>
      </NavLink>

      {navLinks.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
        >
          {label}
        </NavLink>
      ))}

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