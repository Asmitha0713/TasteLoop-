import { useEffect, useState } from 'react'
import { currentUser } from '../services/api.js'
import { loadFavoriteIds, setFavorite } from '../services/favorites.js'

export default function FavoriteButton({ foodId, initialFavorite, onChange, large = false }) {
  const [favorite, setIsFavorite] = useState(Boolean(initialFavorite))
  const [busy, setBusy] = useState(false)
  const customer = currentUser()?.role === 'customer'

  useEffect(() => {
    if (!customer || initialFavorite !== undefined) return
    loadFavoriteIds().then(ids => setIsFavorite(ids.has(foodId))).catch(() => {})
  }, [customer, foodId, initialFavorite])

  useEffect(() => {
    const sync = event => event.detail.foodId === foodId && setIsFavorite(event.detail.favorite)
    window.addEventListener('tasteloop:favorites', sync)
    return () => window.removeEventListener('tasteloop:favorites', sync)
  }, [foodId])

  if (!customer) return null

  const toggle = async () => {
    if (busy) return
    const next = !favorite
    setBusy(true)
    try {
      await setFavorite(foodId, next)
      setIsFavorite(next)
      onChange?.(next)
    } catch {
      // Axios displays the API error as a toast; keep the previous heart state.
    } finally { setBusy(false) }
  }

  return <button type="button" className={`favorite-button${favorite ? ' active' : ''}${large ? ' favorite-button--large' : ''}`} onClick={toggle} disabled={busy} aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'} title={favorite ? 'Remove from favorites' : 'Add to favorites'}>{favorite ? '♥' : '♡'}</button>
}
