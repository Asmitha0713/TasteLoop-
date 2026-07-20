import { Link } from 'react-router-dom'
import CustomerNav from '../components/CustomerNav.jsx'
import Footer from '../components/Footer.jsx'
import FoodCard from '../components/FoodCard.jsx'
import { foods } from '../data/sampleData.js'
import { orders } from '../data/customerData.js'

export default function CustomerDashboard() {
  const activeOrder = orders[0]
  return (
    <div className="page">
      <CustomerNav />
      <main className="page-content">
        <section style={styles.welcome}>
          <div className="container customer-hero-grid" style={styles.welcomeGrid}>
            <div>
              <span className="eyebrow">Good afternoon, Ayesha</span>
              <h1 style={styles.h1}>What feels like home today?</h1>
              <p style={styles.lead}>Fresh meals from talented cooks in your neighbourhood.</p>
              <Link to="/search" className="btn btn-primary">Find something delicious</Link>
            </div>
            <div className="card" style={styles.activeCard}>
              <div style={styles.cardTop}><span className="stitched">Live order</span><strong>#{activeOrder.id}</strong></div>
              <div style={styles.orderBody}><div style={{ ...styles.orderEmoji, background: activeOrder.color }}>{activeOrder.emoji}</div><div><h3 style={styles.orderTitle}>Your lunch is being prepared</h3><p style={styles.small}>{activeOrder.cook} · Around 35 minutes</p></div></div>
              <div style={styles.progress}><span style={styles.progressFill} /></div>
              <div style={styles.steps}><span>Confirmed</span><strong>Preparing</strong><span>On the way</span></div>
            </div>
          </div>
        </section>

        <section className="container" style={styles.section}>
          <div style={styles.headingRow}><div><span className="eyebrow">Picked for you</span><h2>Popular near Kilinochchi</h2></div><Link to="/search" className="btn btn-secondary btn-sm">View all</Link></div>
          <div className="grid-3" style={styles.grid}>{foods.slice(0, 3).map((food) => <FoodCard food={food} key={food.id} />)}</div>
        </section>

        <section className="container" style={{ ...styles.section, paddingBottom: 70 }}>
          <div style={styles.headingRow}><div><span className="eyebrow">Order again</span><h2>Your recent favourites</h2></div><Link to="/orders" style={styles.textLink}>See order history →</Link></div>
          <div className="grid-2" style={styles.recentGrid}>{orders.slice(1, 3).map((order) => <div className="card" style={styles.recent} key={order.id}><div style={{ ...styles.miniEmoji, background: order.color }}>{order.emoji}</div><div style={{ flex: 1 }}><h3 style={styles.orderTitle}>{order.cook}</h3><p style={styles.small}>{order.items}</p></div><button className="btn btn-secondary btn-sm">Reorder</button></div>)}</div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

const styles = {
  welcome: { padding: '58px 0', background: 'linear-gradient(135deg, var(--color-mustard-tint), var(--color-bg) 72%)' },
  welcomeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 44, alignItems: 'center' },
  h1: { fontSize: 42, margin: '12px 0' }, lead: { margin: '0 0 24px' },
  activeCard: { padding: 24 }, cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 },
  orderBody: { display: 'flex', gap: 15, alignItems: 'center', margin: '22px 0' }, orderEmoji: { width: 62, height: 62, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 32 },
  orderTitle: { fontSize: 17, margin: '0 0 5px' }, small: { fontSize: 12.5, margin: 0 },
  progress: { height: 7, background: 'var(--color-surface-alt)', borderRadius: 8, overflow: 'hidden' }, progressFill: { display: 'block', width: '52%', height: '100%', background: 'var(--color-chili)' },
  steps: { display: 'flex', justifyContent: 'space-between', marginTop: 8, color: 'var(--color-ink-faint)', fontSize: 10.5 },
  section: { paddingTop: 54 }, headingRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20, marginBottom: 24 }, grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 },
  textLink: { color: 'var(--color-forest)', fontSize: 13, fontWeight: 700 }, recentGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 },
  recent: { padding: 16, display: 'flex', gap: 14, alignItems: 'center' }, miniEmoji: { width: 50, height: 50, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: 12, fontSize: 25 },
}
