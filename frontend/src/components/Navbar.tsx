import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { initials } from '../utils/plant'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const navLinks = [
    { to: '/',           label: '🌿 Каталог' },
    { to: '/my-plants',  label: '🪴 Мои растения' },
    { to: '/offers',     label: '🔄 Обмены' },
    { to: '/history',    label: '📜 История' },
    { to: '/reports',    label: '📊 Отчёты' },
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
        <div className="nav-avatar">{initials(user?.name)}</div>
        <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.name?.split(' ')[0]}
        </span>
        <button className="nav-btn" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }} onClick={handleLogout}>
          выйти
        </button>
      </div>
    </nav>
  )
}