import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CustomerNav from '../components/CustomerNav.jsx'
import Footer from '../components/Footer.jsx'
import api, { apiError } from '../services/api.js'

export default function Cart() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { api.get('/cart').then(({ data }) => setItems(data.data.items)).catch((requestError) => setError(apiError(requestError))) }, [])
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const updateQty = async (id, amount) => {
    const item = items.find((row) => row.id === id)
    const quantity = Math.max(1, item.quantity + amount)
    try { const { data } = await api.patch(`/cart/items/${id}`, { quantity }); setItems(data.data.items) }
    catch (requestError) { setError(apiError(requestError)) }
  }
  const remove = async (id) => {
    try { const { data } = await api.delete(`/cart/items/${id}`); setItems(data.data.items) }
    catch (requestError) { setError(apiError(requestError)) }
  }

  return (
    <div className="page"><CustomerNav /><main className="page-content"><section className="container" style={styles.wrap}>
      <span className="eyebrow">Your basket</span><h1 style={styles.h1}>Cart</h1>
      {error && <p style={{ color: 'var(--color-chili)' }}>{error}</p>}
      <div className="cart-layout" style={styles.layout}>
        <div>
          <div style={styles.cookLine}><span>Order from</span><strong>Nadeesha’s Kitchen</strong><span className="stitched">★ 4.9</span></div>
          <div className="card" style={styles.list}>{items.map((item, index) => <div style={{ ...styles.item, borderTop: index ? '1px solid var(--color-border)' : 0 }} key={item.id}>
            <div style={{ ...styles.image, background: item.color }}>{item.emoji}</div><div style={{ flex: 1 }}><h3 style={styles.name}>{item.name}</h3><p style={styles.meta}>{item.category} · Made fresh today</p><button onClick={() => remove(item.id)} style={styles.remove}>Remove</button></div>
            <div style={styles.right}><div style={styles.stepper}><button onClick={() => updateQty(item.id, -1)}>−</button><strong>{item.quantity}</strong><button onClick={() => updateQty(item.id, 1)}>+</button></div><strong style={styles.price}>Rs {item.price * item.quantity}</strong></div>
          </div>)}</div>
          <div style={styles.note}><label htmlFor="note">Note for the cook</label><textarea id="note" placeholder="Allergies, spice preference, or delivery notes…" style={styles.textarea} /></div>
          <Link to="/search" style={styles.continue}>← Continue browsing</Link>
        </div>
        <aside className="card" style={styles.summary}><h2 style={styles.summaryTitle}>Order summary</h2><div style={styles.row}><span>Subtotal</span><span>Rs {subtotal}</span></div><div style={styles.row}><span>Delivery fee</span><span>Rs 200</span></div><div style={styles.row}><span>Service fee</span><span>Rs 100</span></div><div style={styles.promo}><input placeholder="Promo code" /><button>Apply</button></div><div style={styles.total}><span>Total</span><strong>Rs {subtotal + 300}</strong></div><Link to="/checkout" className="btn btn-primary btn-block">Continue to checkout</Link><p style={styles.secure}>🔒 Secure checkout · No hidden charges</p></aside>
      </div>
    </section></main><Footer /></div>
  )
}

const styles = {
  wrap: { paddingTop: 48, paddingBottom: 70 }, h1: { fontSize: 38, margin: '8px 0 30px' }, layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 30, alignItems: 'start' },
  cookLine: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, color: 'var(--color-ink-soft)', fontSize: 13 }, list: { padding: '0 22px' }, item: { display: 'flex', gap: 16, padding: '22px 0', alignItems: 'center' }, image: { width: 82, height: 82, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 40, flexShrink: 0 }, name: { fontSize: 17, margin: '0 0 5px' }, meta: { margin: 0, fontSize: 12.5 }, remove: { border: 0, background: 'none', padding: '7px 0 0', color: 'var(--color-chili)', cursor: 'pointer', fontSize: 11.5 }, right: { alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'end', justifyContent: 'space-between' },
  stepper: { display: 'flex', gap: 11, alignItems: 'center' }, price: { color: 'var(--color-chili)' }, note: { marginTop: 22, fontSize: 13, fontWeight: 700 }, textarea: { display: 'block', marginTop: 8, padding: 13, width: '100%', minHeight: 78, resize: 'vertical', border: '1px solid var(--color-border-strong)', borderRadius: 10, background: 'white', font: 'inherit' }, continue: { display: 'inline-block', marginTop: 20, color: 'var(--color-forest)', fontSize: 13, fontWeight: 700 },
  summary: { padding: 24, position: 'sticky', top: 100 }, summaryTitle: { fontSize: 22, marginBottom: 20 }, row: { display: 'flex', justifyContent: 'space-between', margin: '13px 0', color: 'var(--color-ink-soft)', fontSize: 13.5 }, promo: { display: 'flex', margin: '20px 0', gap: 8 }, total: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', padding: '20px 0', fontSize: 19 }, secure: { fontSize: 11, textAlign: 'center', margin: '14px 0 0' },
}
