import { useState } from 'react'
import { useAuthStore } from '../store/auth'
import { authApi } from '../api/client'
import { useToast } from '../context/ToastContext'
import { REGIONS, initials } from '../utils/plant'

export default function ProfilePage() {
  const { user, fetchProfile } = useAuthStore()
  const { showToast } = useToast()

  const [info, setInfo] = useState({
    name:   user?.name   ?? '',
    email:  user?.email  ?? '',
    region: user?.region ?? '',
    bio:    user?.bio    ?? '',
    avatar: user?.avatar ?? '',
  })

  const [passwords, setPasswords] = useState({
    old_password: '',
    new_password: '',
    confirm:      '',
  })

  const [loadingInfo, setLoadingInfo]   = useState(false)
  const [loadingPass, setLoadingPass]   = useState(false)
  const [errorInfo,   setErrorInfo]     = useState('')
  const [errorPass,   setErrorPass]     = useState('')

  const setI = (k: keyof typeof info) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setErrorInfo('')
      setInfo(f => ({ ...f, [k]: e.target.value }))
    }

  const setP = (k: keyof typeof passwords) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setErrorPass('')
      setPasswords(f => ({ ...f, [k]: e.target.value }))
    }

  async function handleSaveInfo() {
    if (!info.name.trim()) { setErrorInfo('Имя не может быть пустым'); return }
    setLoadingInfo(true)
    try {
      await authApi.updateProfile({
        name:   info.name,
        email:  info.email,
        region: info.region,
        bio:    info.bio,
        avatar: info.avatar,
      })
      await fetchProfile()
      showToast('Профиль обновлён!')
    } catch (e: any) {
      setErrorInfo(e.response?.data?.error ?? 'Ошибка сохранения')
    } finally {
      setLoadingInfo(false)
    }
  }

  async function handleChangePassword() {
    if (!passwords.old_password) { setErrorPass('Введите старый пароль'); return }
    if (passwords.new_password.length < 6) { setErrorPass('Минимум 6 символов'); return }
    if (passwords.new_password !== passwords.confirm) { setErrorPass('Пароли не совпадают'); return }
    setLoadingPass(true)
    try {
      await authApi.updateProfile({
        old_password: passwords.old_password,
        new_password: passwords.new_password,
      } as any)
      await fetchProfile()
      setPasswords({ old_password: '', new_password: '', confirm: '' })
      showToast('Пароль изменён!')
    } catch (e: any) {
      setErrorPass(e.response?.data?.error ?? 'Ошибка')
    } finally {
      setLoadingPass(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Личный <em>кабинет</em></div>
          <div className="page-sub">Управление профилем</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>

        {/* ── Левая колонка: аватар + основная инфо ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Аватар */}
          <div className="section-card" style={{ textAlign: 'center' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: info.avatar ? 'transparent' : 'var(--moss)',
              margin: '0 auto 16px',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, fontWeight: 700, color: '#fff',
              border: '4px solid var(--paper)',
              boxShadow: '0 4px 20px var(--shadow-lg)',
            }}>
              {info.avatar
                ? <img src={info.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials(info.name)
              }
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700 }}>
              {user?.name}
            </div>
            <div style={{ color: 'var(--mist)', fontSize: 14, marginTop: 4 }}>{user?.email}</div>
            {user?.region && (
              <div style={{ marginTop: 8 }}>
                <span className="tag tag-region">📍 {user.region}</span>
              </div>
            )}
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 16, fontSize: 13, color: 'var(--mist)' }}>
              <div><strong style={{ color: 'var(--moss)', fontSize: 20, fontFamily: "'Fraunces', serif" }}>{user?.plants?.length ?? 0}</strong><br />растений</div>
            </div>
          </div>

          {/* Смена пароля */}
          <div className="section-card">
            <div className="section-title">🔒 Сменить пароль</div>
            {errorPass && <div className="auth-error">{errorPass}</div>}
            <div className="form-group">
              <label className="form-label">Текущий пароль</label>
              <input
                className="form-input"
                type="password"
                value={passwords.old_password}
                onChange={setP('old_password')}
                placeholder="••••••"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Новый пароль</label>
              <input
                className="form-input"
                type="password"
                value={passwords.new_password}
                onChange={setP('new_password')}
                placeholder="минимум 6 символов"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Повторите новый пароль</label>
              <input
                className="form-input"
                type="password"
                value={passwords.confirm}
                onChange={setP('confirm')}
                placeholder="••••••"
              />
              {passwords.new_password && passwords.confirm && passwords.new_password !== passwords.confirm && (
                <div className="form-error">Пароли не совпадают</div>
              )}
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleChangePassword}
              disabled={loadingPass}
            >
              {loadingPass ? 'Сохраняем...' : 'Изменить пароль'}
            </button>
          </div>
        </div>

        {/* ── Правая колонка: редактирование данных ── */}
        <div className="section-card">
          <div className="section-title">✏️ Основная информация</div>
          {errorInfo && <div className="auth-error">{errorInfo}</div>}

          <div className="form-group">
            <label className="form-label">Имя *</label>
            <input className="form-input" value={info.name} onChange={setI('name')} placeholder="Анна Зеленова" />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={info.email} onChange={setI('email')} placeholder="anna@plants.ru" />
          </div>

          <div className="form-group">
            <label className="form-label">Регион</label>
            <select className="form-select" value={info.region} onChange={setI('region')}>
              <option value="">— не указан —</option>
              {REGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">О себе</label>
            <textarea
              className="form-input form-textarea"
              value={info.bio}
              onChange={setI('bio')}
              placeholder="Расскажите о себе и своих растениях..."
              style={{ minHeight: 100 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ссылка на аватар (URL)</label>
            <input
              className="form-input"
              value={info.avatar}
              onChange={setI('avatar')}
              placeholder="https://example.com/photo.jpg"
            />
            {info.avatar && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src={info.avatar}
                  alt="preview"
                  style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
                <span style={{ fontSize: 13, color: 'var(--mist)' }}>Предпросмотр</span>
              </div>
            )}
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            onClick={handleSaveInfo}
            disabled={loadingInfo}
          >
            {loadingInfo ? 'Сохраняем...' : '💾 Сохранить изменения'}
          </button>
        </div>

      </div>
    </div>
  )
}