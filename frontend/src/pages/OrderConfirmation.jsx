import { Link, useLocation } from 'react-router-dom'
import CustomerNav from '../components/CustomerNav.jsx'
import Footer from '../components/Footer.jsx'

export default function OrderConfirmation() {
  const order = useLocation().state?.order
  if (!order) return <div className="page"><CustomerNav /><main className="page-content" style={styles.main}><div className="container" style={styles.inner}><h1>Order details unavailable</h1><p>Please open your order from My Orders.</p><Link to="/orders" className="btn btn-primary">View my orders</Link></div></main><Footer /></div>
  const delivery = order.delivery || {}
  const paymentLabel = 'Payment unavailable until accepted'
  return (
    <div className="page"><CustomerNav /><main className="page-content" style={styles.main}><div className="container" style={styles.inner}>
      <div style={styles.check}>…</div><span className="eyebrow">Order requested</span><h1 style={styles.h1}>Waiting for Home Cook confirmation.</h1><p style={styles.lead}>We will notify you when your Home Cook accepts or rejects the order. Payment is not available yet.</p>
      <div className="card" style={styles.card}><div style={styles.top}><div><small>ORDER NUMBER</small><strong>#{order.order_number}</strong></div><span className="stitched">Awaiting cook</span></div><div style={styles.timeline}><div style={styles.line}><span style={styles.fill} /></div><div style={styles.steps}><div><b>1</b><strong>Requested</strong><small>Now</small></div><div><b>2</b><strong>Accepted</strong><small>Cook confirms</small></div><div><b>3</b><strong>Payment</strong><small>After acceptance</small></div><div><b>4</b><strong>Delivery</strong><small>After preparation</small></div></div></div>
        <div className="confirmation-grid" style={styles.details}><div><small>DELIVERING TO</small><strong>{delivery.full_name}</strong><p>{delivery.address}<br />{delivery.city}</p></div><div><small>ORDER ITEMS</small><p>{order.items.map((item) => <span style={styles.orderItem} key={item.food_id}>{item.quantity} × {item.name}</span>)}</p></div><div><small>PAYMENT</small><strong>{paymentLabel}</strong><p style={styles.amount}>Rs {Number(order.total).toLocaleString()}</p></div></div>
      </div>
      <div style={styles.actions}><Link to="/orders" className="btn btn-primary">Track my order</Link><Link to="/customer/dashboard" className="btn btn-secondary">Back to dashboard</Link></div><p style={styles.help}>Need help? Call us on <strong>074 062 5386</strong></p>
    </div></main><Footer /></div>
  )
}

const styles = {
  main: { background: 'linear-gradient(180deg, var(--color-mustard-tint), var(--color-bg) 42%)' }, inner: { maxWidth: 820, paddingTop: 54, paddingBottom: 70, textAlign: 'center' }, check: { width: 68, height: 68, margin: '0 auto 18px', display: 'grid', placeItems: 'center', borderRadius: '50%', background: 'var(--color-forest)', color: 'white', fontSize: 34, boxShadow: '0 8px 20px rgba(40,85,66,.22)' }, h1: { fontSize: 38, margin: '10px auto', maxWidth: 650 }, lead: { margin: '0 auto 28px' },
  card: { textAlign: 'left', padding: 28 }, top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 22, borderBottom: '1px solid var(--color-border)' }, timeline: { padding: '30px 8px' }, line: { height: 5, margin: '0 35px -13px', background: 'var(--color-surface-alt)', borderRadius: 4 }, fill: { display: 'block', height: '100%', width: '18%', background: 'var(--color-forest)' }, steps: { position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center' }, details: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, borderTop: '1px solid var(--color-border)', paddingTop: 24 }, orderItem: { display: 'block', marginBottom: 5 }, amount: { color: 'var(--color-chili)', fontSize: 18, fontWeight: 700 }, actions: { display: 'flex', justifyContent: 'center', gap: 12, marginTop: 26, flexWrap: 'wrap' }, help: { fontSize: 12.5, marginTop: 24 },
}
