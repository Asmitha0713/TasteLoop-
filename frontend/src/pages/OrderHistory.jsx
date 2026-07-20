import { useState } from 'react'
import CustomerNav from '../components/CustomerNav.jsx'
import Footer from '../components/Footer.jsx'
import { orders } from '../data/customerData.js'

export default function OrderHistory() {
  const [tab, setTab] = useState('All')
  const shown = tab === 'All' ? orders : orders.filter((order) => tab === 'Active' ? order.status === 'Preparing' : order.status !== 'Preparing')
  return (
    <div className="page"><CustomerNav /><main className="page-content"><section className="container" style={styles.wrap}>
      <span className="eyebrow">Your meals</span><div style={styles.heading}><div><h1 style={styles.h1}>Order history</h1><p style={styles.lead}>Track current orders or revisit a meal you loved.</p></div><button className="btn btn-primary">Browse food</button></div>
      <div style={styles.tabs}>{['All', 'Active', 'Past orders'].map((name) => <button key={name} onClick={() => setTab(name)} style={{ ...styles.tab, color: tab === name ? 'var(--color-forest)' : 'var(--color-ink-faint)', borderColor: tab === name ? 'var(--color-forest)' : 'transparent' }}>{name}</button>)}</div>
      <div style={styles.list}>{shown.map((order) => <article className="card order-history-row" style={styles.order} key={order.id}><div style={{ ...styles.image, background: order.color }}>{order.emoji}</div><div style={styles.info}><div style={styles.orderTop}><div><h3 style={styles.name}>{order.cook}</h3><p style={styles.meta}>#{order.id} · {order.date}</p></div><span style={{ ...styles.status, ...statusColors[order.status] }}>{order.status}</span></div><p style={styles.items}>{order.items}</p><div style={styles.bottom}><strong style={styles.total}>Rs {order.total}</strong><div style={styles.actions}>{order.status === 'Preparing' ? <button className="btn btn-primary btn-sm">Track order</button> : <><button className="btn btn-secondary btn-sm">View details</button>{order.status === 'Delivered' && <button className="btn btn-primary btn-sm">Order again</button>}</>}</div></div></div></article>)}</div>
      {!shown.length && <div className="card" style={styles.empty}>No orders in this section yet.</div>}
    </section></main><Footer /></div>
  )
}

const statusColors = { Preparing: { background: '#f8e8ba', color: '#825900' }, Delivered: { background: '#dfece4', color: '#285542' }, Cancelled: { background: '#f6dcd0', color: '#9f3720' } }
const styles = {
  wrap: { maxWidth: 900, paddingTop: 50, paddingBottom: 75 }, heading: { display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20 }, h1: { fontSize: 38, margin: '8px 0 5px' }, lead: { margin: 0 }, tabs: { display: 'flex', gap: 28, borderBottom: '1px solid var(--color-border)', margin: '34px 0 22px' }, tab: { padding: '0 2px 12px', border: 0, borderBottom: '2px solid', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }, list: { display: 'flex', flexDirection: 'column', gap: 15 }, order: { padding: 18, display: 'flex', gap: 18 }, image: { width: 92, height: 92, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 44, flexShrink: 0 }, info: { flex: 1 }, orderTop: { display: 'flex', justifyContent: 'space-between', gap: 15 }, name: { fontSize: 18, margin: '2px 0 4px' }, meta: { margin: 0, fontSize: 11.5 }, status: { padding: '5px 10px', borderRadius: 20, alignSelf: 'start', fontSize: 11, fontWeight: 700 }, items: { fontSize: 13, margin: '10px 0' }, bottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, total: { color: 'var(--color-chili)' }, actions: { display: 'flex', gap: 8 }, empty: { padding: 40, textAlign: 'center' },
}
