import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CustomerNav from '../components/CustomerNav.jsx'
import Footer from '../components/Footer.jsx'
import ComplaintForm from '../components/ComplaintForm.jsx'
import api, { apiError, assetUrl } from '../services/api.js'
import './Complaints.css'

export default function OrderDetails(){
  const {id}=useParams();const[order,setOrder]=useState(null);const[error,setError]=useState('');const[reporting,setReporting]=useState(false)
  useEffect(()=>{api.get(`/orders/${id}`).then(({data})=>setOrder(data.data)).catch(requestError=>setError(apiError(requestError)))},[id])
  return <div className="page"><CustomerNav/><main className="page-content"><section className="container complaints-wrap"><Link to="/orders" className="eyebrow">← Order history</Link>{error&&<div className="error-banner">{error}</div>}{!order&&!error&&<p>Loading order…</p>}{order&&<article className="card order-details-card"><div className="complaint-card-top"><div><span className="eyebrow">Order details</span><h1>#{order.order_number}</h1><p>{new Date(order.created_at).toLocaleString()}</p></div><span className={`complaint-status ${order.status.replaceAll('_','-')}`}>{order.status.replaceAll('_',' ')}</span></div><div className="order-detail-items">{order.items.map(item=><div className="order-detail-item" key={item.food_id}>{item.image_url?<img src={assetUrl(item.image_url)} alt={item.name}/>:<span>{item.emoji}</span>}<div><h3>{item.quantity} × {item.name}</h3><small>Rs {Number(item.total).toLocaleString()}</small></div></div>)}</div><div className="complaint-meta"><span>Payment: {order.payment_status.replaceAll('_',' ')}</span><span>Delivery: {order.delivery?.address}, {order.delivery?.city}</span></div><div className="order-detail-actions">{order.status==='delivered'&&<button className="btn btn-primary" onClick={()=>setReporting(true)}>Report a Problem</button>}</div></article>}{reporting&&<ComplaintForm order={order} onClose={()=>setReporting(false)}/>}</section></main><Footer/></div>
}
