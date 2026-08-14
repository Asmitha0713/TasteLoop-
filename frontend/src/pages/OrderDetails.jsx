import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CustomerNav from '../components/CustomerNav.jsx'
import Footer from '../components/Footer.jsx'
import ComplaintForm from '../components/ComplaintForm.jsx'
import ReviewForm from '../components/ReviewForm.jsx'
import StripePaymentForm from '../components/StripePaymentForm.jsx'
import api, { apiError, assetUrl } from '../services/api.js'
import './Complaints.css'

const statusMessages = {
  pending_cook_confirmation: 'Waiting for Home Cook confirmation.',
  awaiting_payment: 'Your order has been accepted successfully. Please complete the payment.',
  paid: 'Payment received. Your Home Cook can now prepare the order.',
  preparing: 'Your Home Cook is preparing your meal.',
  ready_for_delivery: 'Your meal is ready and waiting for a Delivery Partner.',
  delivery_partner_assigned: 'A Delivery Partner has accepted your order.',
  picked_up: 'Your order has been picked up and is on the way.',
  out_for_delivery: 'Your order is out for delivery.',
  delivered: 'Your order has been delivered successfully.',
  rejected: 'Your order was rejected by the Home Cook.',
}

export default function OrderDetails() {
  const { id } = useParams(); const [order, setOrder] = useState(null); const [error, setError] = useState(''); const [reporting, setReporting] = useState(false); const [reviewFood, setReviewFood] = useState(null); const [reviewedFoods, setReviewedFoods] = useState(new Set()); const [stripePayment, setStripePayment] = useState(null); const [paying, setPaying] = useState(false)
  const load = useCallback(() => api.get(`/orders/${id}`).then(({ data }) => setOrder(data.data)).catch(requestError => setError(apiError(requestError))), [id])
  useEffect(() => { load() }, [load])
  const pay = async () => { setPaying(true); setError(''); try { const { data } = await api.post(`/orders/${id}/payment-intent`); setStripePayment(data.payment) } catch (requestError) { setError(apiError(requestError)) } finally { setPaying(false) } }
  const confirm = async () => { await api.post(`/orders/${id}/confirm-received`); await load() }
  return <div className="page"><CustomerNav /><main className="page-content"><section className="container complaints-wrap"><Link to="/orders" className="eyebrow">← Order history</Link>{error && <div className="error-banner">{error}</div>}{!order && !error && <p>Loading order…</p>}{order && <article className="card order-details-card"><div className="complaint-card-top"><div><span className="eyebrow">Order details</span><h1>#{order.order_number}</h1><p>{new Date(order.created_at).toLocaleString()}</p></div><span className={`complaint-status ${order.status.replaceAll('_', '-')}`}>{order.status.replaceAll('_', ' ')}</span></div><div className="success-banner"><strong>{statusMessages[order.status] || order.status.replaceAll('_', ' ')}</strong></div><div className="order-detail-items">{order.items.map(item => <div className="order-detail-item" key={item.food_id}>{item.image_url ? <img src={assetUrl(item.image_url)} alt={item.name} /> : <span>{item.emoji}</span>}<div><h3>{item.quantity} × {item.name}</h3><small>Rs {Number(item.total).toLocaleString()}</small></div>{order.status === 'delivered' && <button className="btn btn-secondary btn-sm order-review-button" onClick={() => setReviewFood(item)}>{reviewedFoods.has(item.food_id) ? 'Edit review' : 'Review'}</button>}</div>)}</div><div className="complaint-meta"><span>Payment: {(order.payment_status || 'not started').replaceAll('_', ' ')}</span><span>Delivery: {order.delivery?.address || '—'}, {order.delivery?.city || '—'}</span></div>{order.delivery_partner && <div className="delivery-partner-public"><h3>Delivery Partner</h3><p>{order.delivery_partner.full_name} · {order.delivery_partner.phone}</p><p>{order.delivery_partner.vehicle_type} · {order.delivery_partner.vehicle_number}</p><p>Status: {order.delivery_tracking?.status?.replaceAll('_', ' ')}</p></div>}<div className="order-detail-actions">{order.status === 'awaiting_payment' && <button className="btn btn-primary" disabled={paying} onClick={pay}>{paying ? 'Opening payment…' : 'Pay Now'}</button>}{order.status === 'delivered' && <><button className="btn btn-primary" onClick={confirm}>Confirm Order Received</button><button className="btn btn-outline" onClick={() => setReporting(true)}>Report a Problem</button></>}</div></article>}{stripePayment && <StripePaymentForm payment={stripePayment} orderId={id} onClose={() => { setStripePayment(null); load() }} />}{reviewFood && <ReviewForm food={reviewFood} onClose={() => setReviewFood(null)} onSaved={() => setReviewedFoods(current => new Set(current).add(reviewFood.food_id))} />}{reporting && <ComplaintForm order={order} onClose={() => setReporting(false)} />}</section></main><Footer /></div>
}
