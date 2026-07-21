import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import api, { apiError } from '../services/api.js'

export default function FoodDetails() {
  const [qty, setQty] = useState(1)
  const [food, setFood] = useState(null)
  const [message, setMessage] = useState('')
  const { id } = useParams()
  const navigate = useNavigate()
  useEffect(() => { api.get(`/foods/${id}`).then(({ data }) => setFood(data.data)).catch((error) => setMessage(apiError(error))) }, [id])
  const addToCart = async () => {
    try { await api.post('/cart/items', { food_id: id, quantity: qty }); navigate('/cart') }
    catch (error) { setMessage(apiError(error)) }
  }

  if (!food) return <div className="page"><Navbar /><main className="page-content"><div className="container" style={styles.wrap}>{message || 'Loading dish…'}</div></main><Footer /></div>

  return (
    <div className="page">
      <Navbar />

      <main className="page-content">
        <div className="container" style={styles.wrap}>
          <Link to="/browse" style={styles.back}>← Back to Browse</Link>

          <div className="grid-2" style={styles.grid}>
            <div style={{ ...styles.imageBox, background: food.color }}>
              <span style={styles.emoji}>{food.emoji}</span>
            </div>

            <div>
              <span className="stitched">{food.category}</span>
              <h1 style={styles.title}>{food.name}</h1>
              <p style={styles.cook}>
                by <strong>{food.cook_name || food.cook?.kitchen_name || food.cook?.full_name}</strong> · <span style={styles.rating}>★ {food.rating}</span>{' '}
                <span style={{ color: 'var(--color-ink-faint)' }}>({food.review_count || 0} reviews)</span>
              </p>

              <p style={styles.description}>{food.description}</p>

              <div style={styles.ingredientsBox}>
                <h4 style={{ margin: '0 0 10px' }}>Ingredients</h4>
                <div style={styles.ingredientTags}>
                  {(food.ingredients || []).map((ing) => (
                    <span key={ing} style={styles.ingredientTag}>{ing}</span>
                  ))}
                </div>
              </div>

              <div style={styles.orderBar}>
                <div>
                  <div style={styles.priceLabel}>Price</div>
                  <div style={styles.price}>Rs {food.price * qty}</div>
                </div>

                <div style={styles.stepper}>
                  <button
                    style={styles.stepBtn}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span style={styles.qty}>{qty}</span>
                  <button
                    style={styles.stepBtn}
                    onClick={() => setQty((q) => q + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button className="btn btn-primary" onClick={addToCart}>Add to Cart</button>
              </div>
              {message && <p style={{ color: 'var(--color-chili)' }}>{message}</p>}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

const styles = {
  wrap: { padding: '40px 0 80px' },
  back: { fontSize: 13.5, fontWeight: 600, color: 'var(--color-forest)', display: 'inline-block', marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 44, alignItems: 'start' },
  imageBox: {
    borderRadius: 'var(--radius-lg)',
    height: 380,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 100,
    boxShadow: 'var(--shadow-card)',
  },
  emoji: { filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.18))' },
  title: { fontSize: 34, margin: '12px 0 8px' },
  cook: { fontSize: 14, color: 'var(--color-ink-soft)', marginBottom: 18 },
  rating: { color: 'var(--color-mustard-dark)', fontWeight: 700 },
  description: { fontSize: 15, lineHeight: 1.7, marginBottom: 24 },
  ingredientsBox: { marginBottom: 28 },
  ingredientTags: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  ingredientTag: {
    background: 'var(--color-surface-alt)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-pill)',
    padding: '6px 14px',
    fontSize: 12.5,
    color: 'var(--color-ink-soft)',
  },
  orderBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '18px 20px',
    boxShadow: 'var(--shadow-card)',
    flexWrap: 'wrap',
  },
  priceLabel: { fontSize: 11.5, color: 'var(--color-ink-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' },
  price: { fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--color-chili)' },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    border: '1.5px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-pill)',
    padding: '6px 14px',
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: 'none',
    background: 'var(--color-forest-tint)',
    color: 'var(--color-forest)',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },
  qty: { fontWeight: 700, minWidth: 16, textAlign: 'center' },
}
