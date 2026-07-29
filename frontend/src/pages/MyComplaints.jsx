import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CustomerNav from '../components/CustomerNav.jsx'
import Footer from '../components/Footer.jsx'
import { complaintIssueLabel } from '../components/ComplaintForm.jsx'
import api, { apiError, assetUrl } from '../services/api.js'
import './Complaints.css'

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(()=>{api.get('/complaints/my').then(({data})=>setComplaints(data.data)).catch(requestError=>setError(apiError(requestError))).finally(()=>setLoading(false))},[])
  return <div className="page"><CustomerNav/><main className="page-content"><section className="container complaints-wrap">
    <div className="complaints-head"><div><span className="eyebrow">Support centre</span><h1>My complaints</h1><p>Track refunds, replacements, and decisions for reported orders.</p></div><Link className="btn btn-secondary" to="/orders">View orders</Link></div>
    {error&&<div className="error-banner">{error}</div>}{loading&&<p>Loading complaints…</p>}
    {!loading&&!error&&!complaints.length&&<div className="card favorites-message"><span>!</span><h2>No complaints submitted</h2><p>If a delivered order arrives damaged or incorrect, report it from your order history.</p><Link className="btn btn-primary" to="/orders">Open order history</Link></div>}
    <div className="complaint-list">{complaints.map(complaint=><article className="card complaint-card" key={complaint.id}><div className="complaint-card-top"><div><span className="eyebrow">Order #{complaint.order?.order_number}</span><h2>{complaintIssueLabel(complaint.issue_type)}</h2><div className="complaint-meta"><span>{new Date(complaint.created_at).toLocaleString()}</span><span>Requested: {complaint.requested_solution}</span>{complaint.refund_amount>0&&<span>Refund: Rs {Number(complaint.refund_amount).toLocaleString()}</span>}</div></div><span className={`complaint-status ${complaint.complaint_status.replaceAll('_','-')}`}>{complaint.complaint_status.replaceAll('_',' ')}</span></div><div className="complaint-body"><img src={assetUrl(complaint.evidence_image_url)} alt="Complaint evidence"/><div><p>{complaint.description}</p>{complaint.admin_notes&&<div className="complaint-notes"><strong>Admin notes</strong><br/>{complaint.admin_notes}</div>}{complaint.replacement_order_id&&<div className="complaint-notes">Replacement order created: {complaint.replacement_order_id}</div>}</div></div></article>)}</div>
  </section></main><Footer/></div>
}
