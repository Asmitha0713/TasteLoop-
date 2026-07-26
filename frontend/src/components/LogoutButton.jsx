import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api, { clearSession } from '../services/api.js'
import { resetFavoriteCache } from '../services/favorites.js'

export default function LogoutButton({ className = '', compact = false }) {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const logout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    const refreshToken = localStorage.getItem('tasteloop-refresh-token')
    try {
      if (refreshToken) await api.post('/auth/logout', { refresh_token: refreshToken }, { skipToast: true })
    } catch {
      // Local logout must still complete if the token expired or the API is offline.
    } finally {
      clearSession()
      resetFavoriteCache()
      toast.success('Logged out successfully')
      navigate('/login', { replace: true })
    }
  }

  return <button type="button" className={`logout-button${compact ? ' logout-button--compact' : ''}${className ? ` ${className}` : ''}`} onClick={logout} disabled={loggingOut} aria-label="Log out of TasteLoop" title="Logout"><span aria-hidden="true">⏻</span>{compact ? '' : loggingOut ? 'Logging out…' : 'Logout'}</button>
}
