import { useState } from 'react'
import type { CreatePlantInput, PlantType } from '../../types'
import { PLANT_TYPES, TYPE_ICONS, REGIONS } from '../../utils/plant'
import ImageUpload from '../ImageUpload'

interface Props {
  onClose: () => void
  onSubmit: (data: CreatePlantInput) => Promise<void>
}

export default function AddPlantModal({ onClose, onSubmit }: Props) {
  const [form, setForm] = useState<CreatePlantInput>({
    name: '',
    species: '',
    type: 'tropical',
    description: '',
    image_url: '',
    region: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof CreatePlantInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Укажите название'); return }
    setLoading(true)
    try {
      await onSubmit(form)
      onClose()
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">🌱 Добавить растение</div>

        {error && <div className="auth-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Название *</label>
          <input className="form-input" value={form.name} onChange={set('name')} placeholder="Монстера Деликатесная" autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Вид (латынь)</label>
          <input className="form-input" value={form.species} onChange={set('species')} placeholder="Monstera deliciosa" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Тип *</label>
            <select className="form-select" value={form.type} onChange={set('type')}>
              {PLANT_TYPES.map(t => (
                <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Регион</label>
            <select className="form-select" value={form.region ?? ''} onChange={set('region')}>
              <option value="">— выберите —</option>
              {REGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Описание</label>
          <textarea
            className="form-input form-textarea"
            value={form.description}
            onChange={set('description')}
            placeholder="Расскажите о вашем растении..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Фото растения</label>
          <ImageUpload
            value={form.image_url ?? ''}
            onChange={url => setForm(f => ({ ...f, image_url: url }))}
            placeholder="🌿"
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Добавляем...' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  )
}