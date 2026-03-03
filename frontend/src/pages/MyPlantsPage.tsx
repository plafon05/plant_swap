import { useState, useEffect } from 'react'
import type { Plant } from '../types'
import { plantsApi } from '../api/client'
import PlantCard from '../components/PlantCard'
import AddPlantModal from '../components/modals/AddPlantModal'
import { useToast } from '../context/ToastContext'

export default function MyPlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const { showToast } = useToast()

  async function load() {
    setLoading(true)
    try {
      const res = await plantsApi.getMy()
      setPlants(res.data)
    } catch {
      showToast('Ошибка загрузки', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleAdd(data: Parameters<typeof plantsApi.create>[0]) {
    await plantsApi.create(data)
    showToast('Растение добавлено!')
    load()
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить растение?')) return
    try {
      await plantsApi.delete(id)
      showToast('Растение удалено')
      setPlants(ps => ps.filter(p => p.id !== id))
    } catch (e: any) {
      showToast(e.response?.data?.error ?? 'Ошибка удаления', 'error')
    }
  }

  async function handleToggleAvailable(plant: Plant) {
    try {
      await plantsApi.update(plant.id, { is_available: !plant.is_available })
      showToast(plant.is_available ? 'Убрано из доступных' : 'Отмечено как доступное')
      load()
    } catch {
      showToast('Ошибка', 'error')
    }
  }

  return (
    <div className="page">
      {showAdd && <AddPlantModal onClose={() => setShowAdd(false)} onSubmit={handleAdd} />}

      <div className="page-header">
        <div>
          <div className="page-title">Мои <em>растения</em></div>
          <div className="page-sub">{plants.length} растений в коллекции</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Добавить</button>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : plants.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🪴</div>
          <div className="empty-text">У вас пока нет растений</div>
          <div className="empty-sub">Добавьте свои первые растения для обмена</div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>Добавить растение</button>
        </div>
      ) : (
        <div className="grid grid-4">
          {plants.map(p => (
            <PlantCard
              key={p.id}
              plant={p}
              actions={
                <>
                  <button
                    className={`btn btn-sm ${p.is_available ? 'btn-secondary' : 'btn-ghost'}`}
                    style={{ flex: 1, fontSize: 12 }}
                    onClick={() => handleToggleAvailable(p)}
                  >
                    {p.is_available ? '✓ Доступно' : '✗ Недоступно'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(p.id)}
                  >
                    🗑
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}