import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import FoodCard from '../components/FoodCard.jsx'
import CookCard from '../components/CookCard.jsx'
import api, { apiError } from '../services/api.js'

export default function Browse() {
  const [active, setActive] = useState('All')
  const [query, setQuery] = useState('')
  const [foods, setFoods] = useState([])
  const [categories, setCategories] = useState([])
  const [cooks, setCooks] = useState([])
  const [error, setError] = useState('')

  const loadFoods = async () => {
    try {
      const { data } = await api.get('/foods', { params: { query: query || undefined, category: active === 'All' ? undefined : active } })
      setFoods(data.data.map((food) => ({ ...food, cook: food.cook_name })))
      setError('')
    } catch (requestError) { setError(apiError(requestError)) }
  }

  useEffect(() => {
    api.get('/foods', { params: { category: active === 'All' ? undefined : active } })
      .then(({ data }) => setFoods(data.data.map((food) => ({ ...food, cook: food.cook_name }))))
      .catch((requestError) => setError(apiError(requestError)))
  }, [active])
  useEffect(() => {
    Promise.all([api.get('/foods/categories'), api.get('/cooks')]).then(([categoryResponse, cookResponse]) => {
      setCategories(categoryResponse.data.data.map((name) => ({ name, emoji: '🍽️' })))
      setCooks(cookResponse.data.data.map((cook) => ({ ...cook, name: cook.full_name, emoji: '👩‍🍳', color: '#f5d89c', orders: cook.order_count || 0 })))
    }).catch((requestError) => setError(apiError(requestError)))
  }, [])

  const filtered = foods

  return (
    <div className="page">
      <Navbar />

      <main className="page-content">
        <section style={styles.hero}>
          <div className="container">
            <span className="eyebrow">Browse Foods</span>
            <h1 style={styles.h1}>What are you craving today?</h1>

            <div style={styles.searchBar}>
              <span style={{ opacity: 0.5 }}>🔍</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && loadFoods()} placeholder="Search dishes or cooks…" style={styles.searchInput} />
              <button className="btn btn-forest btn-sm" onClick={loadFoods}>Search</button>
            </div>

            <div style={styles.categoryRow}>
              <button
                className="stitched"
                style={{
                  ...styles.categoryPill,
                  background: active === 'All' ? 'var(--color-forest)' : 'var(--color-forest-tint)',
                  color: active === 'All' ? '#fff8ee' : 'var(--color-forest)',
                }}
                onClick={() => setActive('All')}
              >
                🍽️ All
              </button>
              {categories.map((c) => (
                <button
                  key={c.name}
                  className="stitched"
                  style={{
                    ...styles.categoryPill,
                    background: active === c.name ? 'var(--color-forest)' : 'var(--color-forest-tint)',
                    color: active === c.name ? '#fff8ee' : 'var(--color-forest)',
                  }}
                  onClick={() => setActive(c.name)}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="container" style={styles.section}>
          {error && <p style={{ color: 'var(--color-chili)' }}>{error}</p>}
          <div style={styles.sectionHeadRow}>
            <h2 style={{ margin: 0 }}>Popular Near You</h2>
            <span style={styles.count}>{filtered.length} dishes</span>
          </div>
          <div className="grid-3" style={styles.foodGrid}>
            {filtered.map((f) => <FoodCard key={f.id} food={f} />)}
          </div>
          {filtered.length === 0 && (
            <p style={styles.empty}>No dishes in this category yet — check back soon.</p>
          )}
        </section>

        <section className="container" style={{ ...styles.section, paddingBottom: 80 }}>
          <h2>Top Home Cooks</h2>
          <div className="grid-3" style={styles.cookGrid}>
            {cooks.map((c) => <CookCard key={c.id} cook={c} />)}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

const styles = {
  hero: {
    background: 'linear-gradient(180deg, var(--color-mustard-tint) 0%, var(--color-bg) 100%)',
    padding: '56px 0 40px',
  },
  h1: { fontSize: 36, margin: '14px 0 24px' },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--color-surface)',
    border: '1.5px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-pill)',
    padding: '8px 8px 8px 20px',
    maxWidth: 520,
    boxShadow: 'var(--shadow-card)',
    marginBottom: 22,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontFamily: 'var(--font-body)',
    fontSize: 14.5,
  },
  categoryRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  categoryPill: { border: 'none', cursor: 'pointer', padding: '9px 16px', fontSize: 13 },
  section: { padding: '48px 0 20px' },
  sectionHeadRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22 },
  count: { fontSize: 13, color: 'var(--color-ink-faint)', fontWeight: 600 },
  foodGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 },
  cookGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 22 },
  empty: { color: 'var(--color-ink-faint)', fontStyle: 'italic' },
}
