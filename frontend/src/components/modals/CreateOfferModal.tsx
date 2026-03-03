import { useState } from 'react'
import type { Plant, CreateOfferInput } from '../../types'
import { PLANT_TYPES, TYPE_ICONS, REGIONS } from '../../utils/plant'

interface Props {
  myPlants: Plant[]
  onClose: () => void
  onSubmit: (data: CreateOfferInput) => Promise<void>
}

export default function CreateOfferModal({ myPlants, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<CreateOfferInput>({
    offered_plant_id: 0,
    wanted_types: '',
    wanted_region: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof CreateOfferInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit() {
    if (!form.offered_plant_id) { setError('Выберите растение для обмена'); return }
    setLoading(true)
    try {
      await onSubmit({ ...form, offered_plant_id: Number(form.offered_plant_id) })
      onClose()
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const available = myPlants.filter(p => p.is_available)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">🔄 Создать предложение</div>

        {error && <div className="auth-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Предлагаю растение *</label>
          {available.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--mist)', padding: '10px 0' }}>
              Нет доступных растений. Сначала добавьте растения в раздел «Мои растения».
            </p>
          ) : (
            <select className="form-select" value={form.offered_plant_id} onChange={set('offered_plant_id')}>
              <option value={0}>— выберите из своих растений —</option>
              {available.map(p => (
                <option key={p.id} value={p.id}>
                  {TYPE_ICONS[p.type]} {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Хочу взамен (типы через запятую)</label>
          <input
            className="form-input"
            value={form.wanted_types ?? ''}
            onChange={set('wanted_types')}
            placeholder="tropical, flowering, cactus"
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PLANT_TYPES.map(t => {
              const selected = (form.wanted_types ?? '').includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  className={`chip${selected ? ' active' : ''}`}
                  style={{ fontSize: 12, padding: '4px 10px' }}
                  onClick={() => {
                    const current = (form.wanted_types ?? '').split(',').map(s => s.trim()).filter(Boolean)
                    const updated = selected
                      ? current.filter(x => x !== t)
                      : [...current, t]
                    setForm(f => ({ ...f, wanted_types: updated.join(', ') }))
                  }}
                >
                  {TYPE_ICONS[t]} {t}
                </button>
              )
            })}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Предпочтительный регион</label>
          <select className="form-select" value={form.wanted_region ?? ''} onChange={set('wanted_region')}>
            <option value="">Любой регион</option>
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Комментарий</label>
          <textarea
            className="form-input form-textarea"
            value={form.description ?? ''}
            onChange={set('description')}
            placeholder="Дополнительные условия или пожелания..."
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || available.length === 0}>
            {loading ? 'Создаём...' : 'Создать предложение'}
          </button>
        </div>
      </div>
    </div>
  )
}