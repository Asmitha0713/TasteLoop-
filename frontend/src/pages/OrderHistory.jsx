import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CustomerNav from '../components/CustomerNav.jsx'
import Footer from '../components/Footer.jsx'
import ComplaintForm from '../components/ComplaintForm.jsx'
import api, { apiError, assetUrl } from '../services/api.js'
import './Complaints.css'

export default function OrderHistory() {
  const [tab, setTab] = useState('All')
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [reportOrder, setReportOrder] = useState(null)
  useEffect(() => { api.get('/orders').then(({ data }) => setOrders(data.data.map(order => ({ ...order, date: new Date(order.created_at).toLocaleDateString(), cook: order.items[0]?.cook_name || 'Home Cook', item_summary: order.items.map(item => `${item.quantity} × ${item.name}`).join(', '), image_url: order.items[0]?.image_url, emoji: order.items[0]?.emoji || '🍽️', color: order.items[0]?.color || '#f4dfb8', display_status: order.status[0].toUpperCase() + order.status.slice(1).replaceAll('_', ' ') })))).catch(requestError => setError(apiError(requestError))) }, [])
  const shown = tab === 'All' ? orders : orders.filter((order) => tab === 'Active' ? !['delivered','rejected','cancelled'].includes(order.status) : ['delivered','rejected','cancelled'].includes(order.status))
  return (
    <div className="page"><CustomerNav /><main className="page-content"><section className="container" style={styles.wrap}>
      <span className="eyebrow">Your meals</span><div style={styles.heading}><div><h1 style={styles.h1}>Order history</h1><p style={styles.lead}>Track current orders or revisit a meal you loved.</p></div><Link to="/search" className="btn btn-primary">Browse food</Link></div>
      {error && <p style={{ color: 'var(--color-chili)' }}>{error}</p>}
      <div style={styles.tabs}>{['All', 'Active', 'Past orders'].map((name) => <button key={name} onClick={() => setTab(name)} style={{ ...styles.tab, color: tab === name ? 'var(--color-forest)' : 'var(--color-ink-faint)', borderColor: tab === name ? 'var(--color-forest)' : 'transparent' }}>{name}</button>)}</div>
      <div style={styles.list}>{shown.map((order) => <article className="card order-history-row" style={styles.order} key={order.id}><div style={{ ...styles.image, background: order.color }}>{order.image_url ? <img src={assetUrl(order.image_url)} alt={order.item_summary} style={styles.foodImage} /> : order.emoji}</div><div style={styles.info}><div style={styles.orderTop}><div><h3 style={styles.name}>{order.cook}</h3><p style={styles.meta}>#{order.order_number} · {order.date}</p></div><span className={`order-status-badge ${order.status.replaceAll('_', '-')}`} style={{ ...styles.status, ...statusColors[order.display_status] }}>{order.display_status}</span></div><p style={styles.items}>{order.item_summary}</p><div style={styles.bottom}><strong style={styles.total}>Rs {order.total}</strong><div style={styles.actions}><Link to={`/orders/${order.id}`} className="btn btn-secondary btn-sm">View details</Link>{order.status==='delivered'&&<button className="btn btn-primary btn-sm" onClick={()=>setReportOrder(order)}>Report a Problem</button>}</div></div></div></article>)}</div>
      {!shown.length && <div className="card" style={styles.empty}>No orders in this section yet.</div>}
      {reportOrder&&<ComplaintForm order={reportOrder} onClose={()=>setReportOrder(null)}/>}</section></main><Footer /></div>
  )
}

const statusColors = { Preparing: { background: '#0F3D2E', color: '#D8C27A' }, Delivered: { background: '#0F3D2E', color: '#F5E9C8' }, Cancelled: { background: '#11251D', color: '#D8CCB0' } }
const styles = {
  wrap: { maxWidth: 900, paddingTop: 50, paddingBottom: 75 }, heading: { display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20 }, h1: { fontSize: 38, margin: '8px 0 5px' }, lead: { margin: 0 }, tabs: { display: 'flex', gap: 28, borderBottom: '1px solid var(--color-border)', margin: '34px 0 22px' }, tab: { padding: '0 2px 12px', border: 0, borderBottom: '2px solid', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }, list: { display: 'flex', flexDirection: 'column', gap: 15 }, order: { padding: 18, display: 'flex', gap: 18 }, image: { width: 92, height: 92, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 44, flexShrink: 0, overflow: 'hidden' }, foodImage: { width: '100%', height: '100%', display: 'block', objectFit: 'cover' }, info: { flex: 1 }, orderTop: { display: 'flex', justifyContent: 'space-between', gap: 15 }, name: { fontSize: 18, margin: '2px 0 4px' }, meta: { margin: 0, fontSize: 11.5 }, status: { padding: '5px 10px', borderRadius: 20, alignSelf: 'start', fontSize: 11, fontWeight: 700 }, items: { fontSize: 13, margin: '10px 0' }, bottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, total: { color: 'var(--color-chili)' }, actions: { display: 'flex', gap: 8 }, empty: { padding: 40, textAlign: 'center' },
}
