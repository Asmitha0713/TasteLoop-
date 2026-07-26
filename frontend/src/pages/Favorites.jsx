import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CustomerNav from '../components/CustomerNav.jsx'
import Footer from '../components/Footer.jsx'
import FoodCard from '../components/FoodCard.jsx'
import api, { apiError } from '../services/api.js'

export default function Favorites() {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/favorites', { skipToast: true })
      .then(({ data }) => setFoods(data.data))
      .catch(requestError => setError(apiError(requestError)))
      .finally(() => setLoading(false))
  }, [])

  const removed = foodId => setFoods(current => current.filter(food => food.id !== foodId))

  return <div className="page"><CustomerNav /><main className="page-content">
    <section className="favorites-hero"><div className="container"><span className="eyebrow">Saved for later</span><h1>Your favorites</h1><p>Keep the home-cooked dishes you love in one convenient place.</p></div></section>
    <section className="container favorites-content">
      {error && <div className="card favorites-message"><span>!</span><h2>We couldn’t load your favorites</h2><p>{error}</p><button className="btn btn-secondary" onClick={() => window.location.reload()}>Try again</button></div>}
      {!error && loading && <div className="favorites-loading" aria-live="polite">Loading your favorites…</div>}
      {!error && !loading && foods.length > 0 && <><div className="favorites-heading"><h2>Saved dishes</h2><span>{foods.length} {foods.length === 1 ? 'dish' : 'dishes'}</span></div><div className="grid-3 favorites-grid">{foods.map(food => <FoodCard key={food.id} food={food} favorite onFavoriteChange={next => !next && removed(food.id)} />)}</div></>}
      {!error && !loading && foods.length === 0 && <div className="card favorites-message"><span>♡</span><h2>Your wishlist is waiting</h2><p>Tap the heart on any dish to save it here for later.</p><Link className="btn btn-primary" to="/search">Find food</Link></div>}
    </section>
  </main><Footer /></div>
}
