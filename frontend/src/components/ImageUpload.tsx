import { useState, useRef } from 'react'
import { uploadImage } from '../api/upload'

interface Props {
  value: string
  onChange: (url: string) => void
  shape?: 'square' | 'circle'
  placeholder?: string
}

export default function ImageUpload({ value, onChange, shape = 'square', placeholder = '🌿' }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Файл слишком большой (макс. 5MB)')
      return
    }

    setLoading(true)
    setError('')
    try {
      const url = await uploadImage(file)
      onChange(url)
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Ошибка загрузки')
    } finally {
      setLoading(false)
      // сбросить input чтобы можно было загрузить тот же файл повторно
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const isCircle = shape === 'circle'

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      <div
        onClick={() => !loading && inputRef.current?.click()}
        style={{
          width:        isCircle ? 100 : '100%',
          height:       isCircle ? 100 : 180,
          borderRadius: isCircle ? '50%' : 14,
          border:       '2px dashed var(--border)',
          background:   value ? 'transparent' : 'var(--paper)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          cursor:       loading ? 'wait' : 'pointer',
          overflow:     'hidden',
          position:     'relative',
          transition:   'border-color 0.2s',
          margin:       isCircle ? '0 auto' : undefined,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--moss-light)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="upload"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Оверлей при наведении */}
            <div style={{
              position:   'absolute',
              inset:      0,
              background: 'rgba(0,0,0,0.4)',
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity:    0,
              transition: 'opacity 0.2s',
              color:      '#fff',
              fontSize:   13,
              fontWeight: 600,
              borderRadius: isCircle ? '50%' : 12,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
            >
              📷 Изменить
            </div>
          </>
        ) : loading ? (
          <div style={{ textAlign: 'center', color: 'var(--mist)' }}>
            <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 6px', borderWidth: 2 }} />
            <div style={{ fontSize: 12 }}>Загрузка...</div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--mist)', padding: 16 }}>
            <div style={{ fontSize: isCircle ? 32 : 40, marginBottom: 6 }}>{placeholder}</div>
            <div style={{ fontSize: 12, lineHeight: 1.4 }}>
              Нажмите чтобы<br />загрузить фото
            </div>
            <div style={{ fontSize: 11, marginTop: 4, opacity: 0.6 }}>JPG, PNG, WEBP до 5MB</div>
          </div>
        )}
      </div>

      {value && !loading && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange('') }}
          style={{
            marginTop: 8,
            background: 'none',
            border: 'none',
            color: 'var(--mist)',
            fontSize: 12,
            cursor: 'pointer',
            display: 'block',
            width: '100%',
            textAlign: 'center',
          }}
        >
          ✕ Удалить фото
        </button>
      )}

      {error && <div className="form-error">{error}</div>}
    </div>
  )
}