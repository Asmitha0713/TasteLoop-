import api from './api.js'

let favoriteIds = null
let loading = null

export const loadFavoriteIds = async () => {
  if (favoriteIds) return favoriteIds
  loading ||= api.get('/favorites', { skipToast: true }).then(({ data }) => {
    favoriteIds = new Set(data.favorite_ids || data.data.map(food => food.id))
    return favoriteIds
  }).finally(() => { loading = null })
  return loading
}

export const setFavorite = async (foodId, favorite) => {
  if (favorite) await api.post(`/favorites/${foodId}`)
  else await api.delete(`/favorites/${foodId}`)
  favoriteIds ||= new Set()
  if (favorite) favoriteIds.add(foodId)
  else favoriteIds.delete(foodId)
  window.dispatchEvent(new CustomEvent('tasteloop:favorites', { detail: { foodId, favorite } }))
}

export const resetFavoriteCache = () => { favoriteIds = null }
