import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CustomerNav from '../components/CustomerNav.jsx'
import Footer from '../components/Footer.jsx'
import api, { apiError } from '../services/api.js'

export default function Checkout() {
  const navigate = useNavigate()
  const [payment, setPayment] = useState('cash')
  const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    try {
      const { data } = await api.post('/orders', {
        full_name: form.querySelector('#name').value,
        phone_number: form.querySelector('#phone').value,
        address: form.querySelector('#address').value,
        city: form.querySelector('#city').value,
        landmark: form.querySelector('#landmark').value || null,
        payment_method: payment,
      })
      navigate('/order-confirmation', { state: { order: data.data } })
    } catch (requestError) { setError(apiError(requestError)) }
  }
  return (
    <div className="page"><CustomerNav /><main className="page-content"><form onSubmit={submit} className="container" style={styles.wrap}>
      <Link to="/cart" style={styles.back}>← Back to cart</Link><span className="eyebrow">Almost there</span><h1 style={styles.h1}>Checkout</h1>
      {error && <p style={{ color: 'var(--color-chili)' }}>{error}</p>}
      <div className="checkout-layout" style={styles.layout}><div>
        <section className="card" style={styles.section}><div style={styles.sectionHead}><span style={styles.number}>1</span><div><h2 style={styles.title}>Delivery details</h2><p style={styles.sub}>Where should we bring your meal?</p></div></div><div className="grid-2" style={styles.formGrid}><div className="field"><label htmlFor="name">Full name</label><input id="name" defaultValue="Ayesha Fernando" required /></div><div className="field"><label htmlFor="phone">Phone number</label><input id="phone" defaultValue="074 062 5386" required /></div><div className="field" style={{ gridColumn: '1 / -1' }}><label htmlFor="address">Delivery address</label><input id="address" defaultValue="No. 18, Station Road, Kilinochchi" required /></div><div className="field"><label htmlFor="city">City</label><input id="city" defaultValue="Kilinochchi" required /></div><div className="field"><label htmlFor="landmark">Nearby landmark</label><input id="landmark" placeholder="Optional" /></div></div></section>
        <section className="card" style={styles.section}><div style={styles.sectionHead}><span style={styles.number}>2</span><div><h2 style={styles.title}>Delivery time</h2><p style={styles.sub}>Choose when you would like it.</p></div></div><div className="grid-2" style={styles.optionGrid}><label style={styles.option}><input type="radio" name="time" defaultChecked /> <span><strong>As soon as possible</strong><small>35–45 minutes</small></span></label><label style={styles.option}><input type="radio" name="time" /> <span><strong>Schedule for later</strong><small>Choose a time</small></span></label></div></section>
        <section className="card" style={styles.section}><div style={styles.sectionHead}><span style={styles.number}>3</span><div><h2 style={styles.title}>Payment method</h2><p style={styles.sub}>Select your preferred payment.</p></div></div><div style={styles.optionGrid}>{[['cash','💵','Cash on delivery'],['card','💳','Credit or debit card']].map(([id, icon, label]) => <label key={id} style={{ ...styles.option, borderColor: payment === id ? 'var(--color-forest)' : 'var(--color-border)' }}><input type="radio" name="payment" checked={payment === id} onChange={() => setPayment(id)} /><span style={{ fontSize: 22 }}>{icon}</span><strong>{label}</strong></label>)}</div>{payment === 'card' && <div className="field" style={{ marginTop: 18 }}><label htmlFor="card">Card number</label><input id="card" placeholder="1234 5678 9012 3456" required /></div>}</section>
      </div><aside className="card" style={styles.summary}><h2 style={styles.title}>Your order</h2><p style={styles.cook}>Nadeesha’s Kitchen</p><div style={styles.item}><span>2 × Chicken Rice & Curry</span><strong>Rs 1700</strong></div><div style={styles.item}><span>1 × Watalappan</span><strong>Rs 500</strong></div><div style={styles.item}><span>Fees</span><strong>Rs 300</strong></div><div style={styles.total}><span>Total</span><strong>Rs 2500</strong></div><button className="btn btn-primary btn-block" type="submit">Place order</button><p style={styles.secure}>By ordering, you agree to TasteLoop’s order terms.</p></aside></div>
    </form></main><Footer /></div>
  )
}

const styles = {
  wrap: { paddingTop: 38, paddingBottom: 70 }, back: { display: 'block', marginBottom: 28, color: 'var(--color-forest)', fontSize: 13, fontWeight: 700 }, h1: { fontSize: 38, margin: '8px 0 28px' }, layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' },
  section: { padding: 26, marginBottom: 20 }, sectionHead: { display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 22 }, number: { width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--color-forest)', color: 'white', fontWeight: 700, fontSize: 13 }, title: { fontSize: 21, margin: 0 }, sub: { margin: '4px 0 0', fontSize: 12.5 }, formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }, optionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }, option: { display: 'flex', alignItems: 'center', gap: 10, padding: 15, border: '1.5px solid var(--color-border)', borderRadius: 12, cursor: 'pointer', fontSize: 13 },
  summary: { padding: 24, position: 'sticky', top: 100 }, cook: { margin: '6px 0 20px', fontSize: 13 }, item: { display: 'flex', justifyContent: 'space-between', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--color-border)', fontSize: 12.5, color: 'var(--color-ink-soft)' }, total: { display: 'flex', justifyContent: 'space-between', padding: '20px 0', fontSize: 19 }, secure: { textAlign: 'center', fontSize: 10.5, marginBottom: 0 },
}
