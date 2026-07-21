import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SteamDivider from '../components/SteamDivider.jsx'
import FoodCard from '../components/FoodCard.jsx'
import CookCard from '../components/CookCard.jsx'
import api from '../services/api.js'

const features = [
  { icon: '🍲', title: 'Real Home Cooking', text: 'Every dish is made fresh, in a real kitchen, by a real neighbour — not a commercial line.' },
  { icon: '⏱️', title: 'Made-to-Order Timing', text: "You see exactly when your cook starts, so there's no guessing when it'll arrive." },
  { icon: '🤝', title: 'Support Local Cooks', text: 'Your order goes straight to the person who made it — fair pay, no middle layers.' },
  { icon: '🌿', title: 'Know Your Ingredients', text: 'Every listing shows ingredients up front, so allergies and preferences are easy to check.' },
]

export default function Landing() {
  const [foods, setFoods] = useState([])
  const [cooks, setCooks] = useState([])
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  useEffect(() => {
    Promise.all([api.get('/foods', { params: { limit: 3 } }), api.get('/cooks')]).then(([foodResponse, cookResponse]) => {
      setFoods(foodResponse.data.data.map(food => ({ ...food, cook: food.cook_name })))
      setCooks(cookResponse.data.data.map(cook => ({ ...cook, name: cook.full_name, emoji: '👩‍🍳', color: '#f5d89c', orders: cook.order_count || 0 })))
    })
  }, [])
  const search = () => navigate(`/search${query ? `?query=${encodeURIComponent(query)}` : ''}`)
  return (
    <div className="page">
      <Navbar />

      <main className="page-content">
        {/* HERO */}
        <section style={styles.hero}>
          <div className="container" style={styles.heroInner}>
            <span className="eyebrow">Homecook marketplace</span>
            <h1 style={styles.h1}>
              Delicious Homemade Food,<br />Made with Love.
            </h1>
            <p style={styles.heroText}>
              Skip the commercial kitchens. Order real home-cooked meals from
              trusted cooks in your neighbourhood — or turn your own kitchen
              into a source of income.
            </p>

            <div style={styles.searchBar}>
              <span style={{ opacity: 0.5 }}>🔍</span>
              <input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => event.key === 'Enter' && search()} placeholder="Search for kottu, rice & curry, desserts…" style={styles.searchInput} />
              <button className="btn btn-primary btn-sm" onClick={search}>Search</button>
            </div>

            <div style={styles.heroActions}>
              <Link to="/browse" className="btn btn-primary">Order Food</Link>
              <Link to="/choose-role" className="btn btn-secondary">Become a Home Cook</Link>
            </div>
          </div>
        </section>

        <div style={{ color: 'var(--color-surface)' }}>
          <SteamDivider />
        </div>

        {/* WHY CHOOSE */}
        <section style={styles.whySection}>
          <div className="container">
            <div style={styles.sectionHead}>
              <span className="eyebrow" style={{ color: 'var(--color-mustard)' }}>Why TasteLoop</span>
              <h2 style={{ color: '#fff8ee' }}>A kitchen you can trust, two doors away</h2>
            </div>

            <div className="grid-4" style={styles.featureGrid}>
              {features.map((f) => (
                <div key={f.title} className="card" style={styles.featureCard}>
                  <div style={styles.featureIcon}>{f.icon}</div>
                  <h4 style={{ margin: '10px 0 6px' }}>{f.title}</h4>
                  <p style={{ fontSize: 13.5, margin: 0 }}>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* POPULAR NEAR YOU */}
        <section className="container" style={styles.section}>
          <div style={styles.sectionHeadRow}>
            <div>
              <span className="eyebrow">Near you</span>
              <h2>Popular Right Now</h2>
            </div>
            <Link to="/browse" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div className="grid-3" style={styles.foodGrid}>
            {foods.slice(0, 3).map((f) => <FoodCard key={f.id} food={f} />)}
          </div>
        </section>

        {/* TOP HOME COOKS */}
        <section className="container" style={{ ...styles.section, paddingBottom: 80 }}>
          <div style={styles.sectionHead}>
            <span className="eyebrow">Community favourites</span>
            <h2>Top Home Cooks</h2>
          </div>
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
    padding: '72px 0 56px',
  },
  heroInner: { maxWidth: 720 },
  h1: { fontSize: 52, margin: '16px 0 18px' },
  heroText: { fontSize: 17, maxWidth: 540, marginBottom: 30 },
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
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontFamily: 'var(--font-body)',
    fontSize: 14.5,
  },
  heroActions: { display: 'flex', gap: 14, flexWrap: 'wrap' },
  whySection: { background: 'var(--color-forest)', padding: '64px 0', color: '#fff8ee' },
  sectionHead: { marginBottom: 32, maxWidth: 520 },
  sectionHeadRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 28,
    flexWrap: 'wrap',
    gap: 12,
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 20,
  },
  featureCard: { padding: '26px 20px', background: '#fff8ee' },
  featureIcon: { fontSize: 30 },
  section: { padding: '60px 0 20px' },
  foodGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 },
  cookGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 },
}
