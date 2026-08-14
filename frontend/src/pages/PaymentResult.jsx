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

  const checkPayment = async () => {
    if (!orderId) return setError('Payment order was not provided.')
    setError('')
    try {
      const { data } = await api.get(`/orders/${orderId}/payment`, { skipToast: true })
      setResult(data.data)
      return data.data
    } catch (requestError) { setError(apiError(requestError)); return null }
  }

  useEffect(() => {
    if (!orderId) return setError('Payment order was not provided.')
    let attempts = 0
    const check = async () => {
      const payment = await checkPayment()
      if (payment?.payment_status === 'pending' && attempts++ < 10) setTimeout(check, 2000)
    }
    check()
    // checkPayment reads the stable order ID captured by this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const paid = result?.payment_status === 'paid'
  const waiting = result?.payment_status === 'pending'
  return <div className="page"><CustomerNav /><main className="page-content"><section className="container" style={styles.wrap}><div className="card" style={styles.card}>
    <div style={{ ...styles.icon, background: paid ? 'var(--color-forest-tint)' : 'var(--color-mustard-tint)' }}>{paid ? '✓' : cancelled ? '×' : '…'}</div>
    <span className="eyebrow">Card payment</span>
    <h1>{paid ? 'Payment successful' : cancelled ? 'Payment cancelled' : waiting ? 'Confirming your payment' : 'Payment not completed'}</h1>
    {error ? <p>{error}</p> : <p>{paid ? `Payment for order #${result.order_number} was received. Your Home Cook can now prepare it.` : waiting ? 'Stripe is still confirming the transaction. This page updates automatically.' : 'No money was confirmed for this order.'}</p>}
    <div style={styles.actions}>{error && <button className="btn btn-primary" onClick={checkPayment}>Try again</button>}<Link className={error ? 'btn btn-secondary' : 'btn btn-primary'} to="/orders">View my orders</Link>{!paid && !error && <Link className="btn btn-secondary" to="/search">Browse food</Link>}</div>
  </div></section></main><Footer /></div>
}

const styles = { wrap: { maxWidth: 680, paddingTop: 70, paddingBottom: 90 }, card: { padding: 42, textAlign: 'center' }, icon: { width: 68, height: 68, margin: '0 auto 18px', display: 'grid', placeItems: 'center', borderRadius: '50%', fontSize: 30, fontWeight: 800 }, actions: { display: 'flex', justifyContent: 'center', gap: 10, marginTop: 24, flexWrap: 'wrap' } }
