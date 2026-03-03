import { useState, useEffect, useCallback } from 'react'
import type { Plant } from '../types'
import { plantsApi } from '../api/client'
import PlantCard from '../components/PlantCard'
import AddPlantModal from '../components/modals/AddPlantModal'
import { PLANT_TYPES, TYPE_ICONS, REGIONS } from '../utils/plant'
import { useToast } from '../context/ToastContext'

export default function PlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const { showToast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await plantsApi.getAll({
        search: search || undefined,
        type: typeFilter || undefined,
        region: regionFilter || undefined,
      })
      setPlants(res.data.data)
      setTotal(res.data.total)
    } catch {
      showToast('Не удалось загрузить растения', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, regionFilter])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  async function handleAdd(data: Parameters<typeof plantsApi.create>[0]) {
    await plantsApi.create(data)
    showToast('Растение добавлено!')
    load()
  }

  return (
    <div className="page">
      {showAdd && <AddPlantModal onClose={() => setShowAdd(false)} onSubmit={handleAdd} />}

      <div className="page-header">
        <div>
          <div className="page-title">Все <em>растения</em></div>
          <div className="page-sub">{total} растений доступно для обмена</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Добавить</button>
      </div>

      <div className="filters">
        <input
          className="filter-input"
          placeholder="🔍 Поиск по названию..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
          <option value="">Все регионы</option>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="type-chips">
        <div className={`chip${!typeFilter ? ' active' : ''}`} onClick={() => setTypeFilter('')}>Все</div>
        {PLANT_TYPES.map(t => (
          <div
            key={t}
            className={`chip${typeFilter === t ? ' active' : ''}`}
            onClick={() => setTypeFilter(t === typeFilter ? '' : t)}
          >
            {TYPE_ICONS[t]} {t}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="spinner" />
      ) : plants.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🔍</div>
          <div className="empty-text">Растения не найдены</div>
          <div className="empty-sub">Попробуйте изменить фильтры или добавьте своё растение</div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>Добавить растение</button>
        </div>
      ) : (
        <div className="grid grid-4">
          {plants.map(p => <PlantCard key={p.id} plant={p} />)}
        </div>
      )}
    </div>
  )
}