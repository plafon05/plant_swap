import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface Toast { id: number; msg: string; type: 'success' | 'error' }

interface ToastContextProps {
  showToast: (msg: string, type?: 'success' | 'error') => void
}

const ToastContext = createContext<ToastContextProps>({ showToast: () => {} })

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => { 
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts(ts => [...ts, { id, msg, type }])
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' ? '✅' : '❌'} {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)