import { Link } from 'react-router-dom'
import CustomerNav from '../components/CustomerNav.jsx'
import Footer from '../components/Footer.jsx'

export default function OrderConfirmation() {
  return (
    <div className="page"><CustomerNav /><main className="page-content" style={styles.main}><div className="container" style={styles.inner}>
      <div style={styles.check}>✓</div><span className="eyebrow">Order confirmed</span><h1 style={styles.h1}>Your home-cooked meal is on its way!</h1><p style={styles.lead}>Nadeesha has received your order and will start preparing it shortly.</p>
      <div className="card" style={styles.card}><div style={styles.top}><div><small>ORDER NUMBER</small><strong>#TL-2049</strong></div><span className="stitched">Confirmed</span></div><div style={styles.timeline}><div style={styles.line}><span style={styles.fill} /></div><div style={styles.steps}><div><b>✓</b><strong>Confirmed</strong><small>2:15 PM</small></div><div><b>2</b><strong>Preparing</strong><small>Starts soon</small></div><div><b>3</b><strong>On the way</strong><small>Est. 2:50 PM</small></div><div><b>4</b><strong>Delivered</strong><small>Est. 3:05 PM</small></div></div></div>
        <div className="confirmation-grid" style={styles.details}><div><small>DELIVERING TO</small><strong>Ayesha Fernando</strong><p>No. 18, Station Road,<br />Kilinochchi</p></div><div><small>ORDER FROM</small><strong>Nadeesha’s Kitchen</strong><p>2 × Chicken Rice & Curry<br />1 × Watalappan</p></div><div><small>PAYMENT</small><strong>Cash on delivery</strong><p style={styles.amount}>Rs 2,500</p></div></div>
      </div>
      <div style={styles.actions}><Link to="/orders" className="btn btn-primary">Track my order</Link><Link to="/customer/dashboard" className="btn btn-secondary">Back to dashboard</Link></div><p style={styles.help}>Need help? Call us on <strong>074 062 5386</strong></p>
    </div></main><Footer /></div>
  )
}

const styles = {
  main: { background: 'linear-gradient(180deg, var(--color-mustard-tint), var(--color-bg) 42%)' }, inner: { maxWidth: 820, paddingTop: 54, paddingBottom: 70, textAlign: 'center' }, check: { width: 68, height: 68, margin: '0 auto 18px', display: 'grid', placeItems: 'center', borderRadius: '50%', background: 'var(--color-forest)', color: 'white', fontSize: 34, boxShadow: '0 8px 20px rgba(40,85,66,.22)' }, h1: { fontSize: 38, margin: '10px auto', maxWidth: 650 }, lead: { margin: '0 auto 28px' },
  card: { textAlign: 'left', padding: 28 }, top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 22, borderBottom: '1px solid var(--color-border)' }, timeline: { padding: '30px 8px' }, line: { height: 5, margin: '0 35px -13px', background: 'var(--color-surface-alt)', borderRadius: 4 }, fill: { display: 'block', height: '100%', width: '18%', background: 'var(--color-forest)' }, steps: { position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center' }, details: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, borderTop: '1px solid var(--color-border)', paddingTop: 24 }, amount: { color: 'var(--color-chili)', fontSize: 18, fontWeight: 700 }, actions: { display: 'flex', justifyContent: 'center', gap: 12, marginTop: 26, flexWrap: 'wrap' }, help: { fontSize: 12.5, marginTop: 24 },
}
