import { useCallback, useEffect, useState } from 'react'
import CookNav from '../components/CookNav.jsx'
import api, { apiError } from '../services/api.js'

const actions = { paid: ['Start Preparing', 'preparing'], preparing: ['Ready for Delivery', 'ready_for_delivery'] }

export default function CookOrders() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const load = useCallback(() => api.get('/cook/orders').then(response => setOrders(response.data.data)).catch(requestError => setError(apiError(requestError))), [])
  useEffect(() => { load() }, [load])
  const act = async (order, action, nextStatus) => {
    setBusy(`${order.id}-${action}`); setError('')
    try {
      if (action === 'accept') await api.post(`/orders/${order.id}/accept`)
      else await api.patch(`/orders/${order.id}/status`, { status: nextStatus })
      await load()
    } catch (requestError) { setError(apiError(requestError)) } finally { setBusy('') }
  }
  return <div className="page"><CookNav /><main className="delivery-main"><span className="eyebrow">Kitchen workflow</span><h1>Customer Orders</h1>{error && <div className="form-error">{error}</div>}<div className="delivery-list">{orders.map(order => <article className="card delivery-card" key={order.id}><div><h3>{order.order_number}</h3><p>{order.items.map(item => `${item.quantity} × ${item.name}`).join(', ')}</p><p><b>Payment:</b> {order.payment_status.replaceAll('_', ' ')}</p><span className="status-badge">{order.status.replaceAll('_', ' ')}</span>{order.delivery_partner && <p><b>Delivery Partner:</b> {order.delivery_partner.full_name} · {order.delivery_partner.phone} · {order.delivery_partner.vehicle_type} {order.delivery_partner.vehicle_number}</p>}</div><div className="delivery-actions">{order.status === 'pending_cook_confirmation' && <><button disabled={!!busy} className="btn btn-primary" onClick={() => act(order, 'accept')}>Accept Order</button><button disabled={!!busy} className="btn btn-outline" onClick={() => act(order, 'status', 'rejected')}>Reject Order</button></>}{actions[order.status] && <button disabled={!!busy} className="btn btn-primary" onClick={() => act(order, 'status', actions[order.status][1])}>{actions[order.status][0]}</button>}</div></article>)}</div></main></div>
}
