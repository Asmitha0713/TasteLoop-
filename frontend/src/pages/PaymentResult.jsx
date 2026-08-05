import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CustomerNav from '../components/CustomerNav.jsx'
import Footer from '../components/Footer.jsx'
import api, { apiError } from '../services/api.js'

export default function PaymentResult() {
  const [params] = useSearchParams()
  const orderId = params.get('order_id')
  const cancelled = params.get('cancelled') === '1'
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId) return setError('Payment order was not provided.')
    let attempts = 0
    const check = async () => {
      try {
        const { data } = await api.get(`/orders/${orderId}/payment`, { skipToast: true })
        setResult(data.data)
        if (data.data.payment_status === 'pending' && attempts++ < 10) setTimeout(check, 2000)
      } catch (requestError) { setError(apiError(requestError)) }
    }
    check()
  }, [orderId])

  const paid = result?.payment_status === 'paid'
  const waiting = result?.payment_status === 'pending'
  return <div className="page"><CustomerNav /><main className="page-content"><section className="container" style={styles.wrap}><div className="card" style={styles.card}>
    <div style={{ ...styles.icon, background: paid ? 'var(--color-forest-tint)' : 'var(--color-mustard-tint)' }}>{paid ? '✓' : cancelled ? '×' : '…'}</div>
    <span className="eyebrow">Card payment</span>
    <h1>{paid ? 'Payment successful' : cancelled ? 'Payment cancelled' : waiting ? 'Confirming your payment' : 'Payment not completed'}</h1>
    {error ? <p>{error}</p> : <p>{paid ? `Order #${result.order_number} is confirmed.` : waiting ? 'Stripe is still confirming the transaction. This page updates automatically.' : 'No money was confirmed for this order.'}</p>}
    <div style={styles.actions}><Link className="btn btn-primary" to="/orders">View my orders</Link>{!paid && <Link className="btn btn-secondary" to="/search">Browse food</Link>}</div>
  </div></section></main><Footer /></div>
}

const styles = { wrap: { maxWidth: 680, paddingTop: 70, paddingBottom: 90 }, card: { padding: 42, textAlign: 'center' }, icon: { width: 68, height: 68, margin: '0 auto 18px', display: 'grid', placeItems: 'center', borderRadius: '50%', fontSize: 30, fontWeight: 800 }, actions: { display: 'flex', justifyContent: 'center', gap: 10, marginTop: 24, flexWrap: 'wrap' } }
