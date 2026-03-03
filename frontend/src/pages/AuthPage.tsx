import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { REGIONS } from '../utils/plant'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '', region: '' })
  const { login, register, loading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    clearError()
    setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSubmit() {
    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password })
      } else {
        await register({ name: form.name, email: form.email, password: form.password, region: form.region })
      }
      navigate('/')
    } catch {
      // error shown from store
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">🌿 Plant<span>Swap</span></div>
        <div className="auth-tagline">
          Платформа для обмена комнатными растениями. Найдите нового зелёного друга и поделитесь своими питомцами с сообществом.
        </div>
        <div className="auth-icons">
          {['🌸', '🌵', '🌴', '🪴', '🌿', '🌱', '🌳', '🍃'].map((e, i) => (
            <div key={i} className="auth-icon-box">{e}</div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form">
          <div className="auth-title">{isLogin ? 'Добро пожаловать!' : 'Регистрация'}</div>
          <div className="auth-sub">{isLogin ? 'Войдите в свой аккаунт' : 'Создайте аккаунт PlantSwap'}</div>

          {error && <div className="auth-error">{error}</div>}

          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">Имя *</label>
                <input className="form-input" value={form.name} onChange={set('name')} placeholder="Анна Зеленова" onKeyDown={handleKey} />
              </div>
              <div className="form-group">
                <label className="form-label">Регион</label>
                <select className="form-select" value={form.region} onChange={set('region')}>
                  <option value="">— выберите —</option>
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="anna@plants.ru"
              autoFocus={isLogin}
              onKeyDown={handleKey}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль *</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="минимум 6 символов"
              onKeyDown={handleKey}
            />
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleSubmit} disabled={loading}>
            {loading ? '...' : isLogin ? 'Войти →' : 'Создать аккаунт →'}
          </button>

          <div className="auth-switch">
            {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
            <button className="auth-link" onClick={() => { clearError(); setIsLogin(!isLogin) }}>
              {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}