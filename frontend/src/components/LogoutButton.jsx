import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api, { clearSession } from '../services/api.js'
import { resetFavoriteCache } from '../services/favorites.js'
import { useTranslation } from '../i18n/LanguageContext.jsx'

export default function LogoutButton({ className = '', compact = false }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
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

  return <button type="button" className={`logout-button${compact ? ' logout-button--compact' : ''}${className ? ` ${className}` : ''}`} onClick={logout} disabled={loggingOut} aria-label={t('Logout')} title={t('Logout')}><span aria-hidden="true">⏻</span>{compact ? '' : loggingOut ? '…' : t('Logout')}</button>
}
