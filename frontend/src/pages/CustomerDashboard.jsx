import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CustomerNav from '../components/CustomerNav.jsx'
import Footer from '../components/Footer.jsx'
import FoodCard from '../components/FoodCard.jsx'
import api, { apiError, currentUser, firstName } from '../services/api.js'

export default function CustomerDashboard() {
  const [foods, setFoods] = useState([])
  const [foodError, setFoodError] = useState('')
  const [favorites, setFavorites] = useState([])
  const [favoritesError, setFavoritesError] = useState('')
  const [customerName, setCustomerName] = useState(() => currentUser()?.full_name || '')

  useEffect(() => {
    api.get('/foods', { params: { limit: 3 } })
      .then(({ data }) => setFoods(data.data))
      .catch((error) => setFoodError(apiError(error)))
    api.get('/favorites', { skipToast: true })
      .then(({ data }) => setFavorites(data.data.slice(0, 2)))
      .catch((error) => setFavoritesError(apiError(error)))
    api.get('/profile', { skipToast: true })
      .then(({ data }) => setCustomerName(data.data.full_name || ''))
      .catch(() => {})
  }, [])

  return (
    <div className="page">
      <CustomerNav />
      <main className="page-content">
        <section style={styles.welcome}>
          <div className="container customer-hero-grid" style={styles.welcomeGrid}>
            <div>
              <span className="eyebrow">Good afternoon, {firstName(customerName)}</span>
              <h1 style={styles.h1}>What feels like home today?</h1>
              <p style={styles.lead}>Fresh meals from talented cooks in your neighbourhood.</p>
              <Link to="/search" className="btn btn-primary">Find something delicious</Link>
            </div>
          </div>
        </section>

        <section className="container" style={styles.section}>
          <div style={styles.headingRow}><div><span className="eyebrow">Picked for you</span><h2>Popular near Kilinochchi</h2></div><Link to="/search" className="btn btn-secondary btn-sm">View all</Link></div>
          {foodError && <div className="error-banner">{foodError}</div>}
          {!foodError && foods.length === 0 && <div className="card" style={styles.empty}>No approved foods are available yet.</div>}
          <div className="grid-3" style={styles.grid}>{foods.map((food) => <FoodCard food={food} key={food.id} />)}</div>
        </section>

        <section className="container" style={{ ...styles.section, paddingBottom: 70 }}>
          <div style={styles.headingRow}><div><span className="eyebrow">Saved for later</span><h2>Your recent favourites</h2></div><Link to="/favorites" style={styles.textLink}>View all favourites →</Link></div>
          {favoritesError && <div className="error-banner">{favoritesError}</div>}
          {!favoritesError && favorites.length === 0 && <div className="card" style={styles.empty}>You have not saved any favourites yet. Tap the heart on a dish to add it here.</div>}
          <div className="grid-2" style={styles.recentGrid}>{favorites.map((food) => <FoodCard key={food.id} food={food} favorite onFavoriteChange={(next) => !next && setFavorites((current) => current.filter((item) => item.id !== food.id))} />)}</div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

const styles = {
  welcome: { padding: '58px 0', background: 'linear-gradient(135deg, var(--color-mustard-tint), var(--color-bg) 72%)' },
  welcomeGrid: { display: 'grid', gridTemplateColumns: 'minmax(0, 680px)', alignItems: 'center' },
  h1: { fontSize: 42, margin: '12px 0' }, lead: { margin: '0 0 24px' },
  section: { paddingTop: 54 }, headingRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20, marginBottom: 24 }, grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 },
  textLink: { color: 'var(--color-forest)', fontSize: 13, fontWeight: 700 }, recentGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 },
  empty: { padding: 24, color: 'var(--color-ink-soft)' },
}
