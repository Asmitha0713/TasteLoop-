import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CustomerNav from '../components/CustomerNav.jsx'
import CookNav from '../components/CookNav.jsx'
import Footer from '../components/Footer.jsx'
import ComplaintForm, { complaintIssueLabel } from '../components/ComplaintForm.jsx'
import api, { apiError, assetUrl, currentUser } from '../services/api.js'
import './Complaints.css'

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reporting, setReporting] = useState(false)
  const isCook = currentUser()?.role === 'home_cook'
  useEffect(()=>{api.get('/complaints/my').then(({data})=>setComplaints(data.data)).catch(requestError=>setError(apiError(requestError))).finally(()=>setLoading(false))},[])
  return <div className="page">{isCook?<CookNav/>:<CustomerNav/>}<main className="page-content"><section className="container complaints-wrap">
    <div className="complaints-head"><div><span className="eyebrow">Support centre</span><h1>My complaints</h1><p>Track submitted complaints and admin responses.</p></div><div className="complaint-head-actions">{!isCook&&<Link className="btn btn-secondary" to="/orders">View orders</Link>}<button className="btn btn-primary" onClick={()=>setReporting(true)}>Submit Complaint</button></div></div>
    {error&&<div className="error-banner">{error}</div>}{loading&&<p>Loading complaints…</p>}
    {!loading&&!error&&!complaints.length&&<div className="card favorites-message"><span>!</span><h2>No complaints submitted</h2><p>Submit a complaint related to one of your orders when you need support.</p><button className="btn btn-primary" onClick={()=>setReporting(true)}>Submit Complaint</button></div>}
    <div className="complaint-list">{complaints.map(complaint=><article className="card complaint-card" key={complaint.id}><div className="complaint-card-top"><div><span className="eyebrow">Order #{complaint.order?.order_number}</span><h2>{complaintIssueLabel(complaint.issue_type)}</h2><div className="complaint-meta"><span>{new Date(complaint.created_at).toLocaleString()}</span>{complaint.requested_solution!=='resolution'&&<span>Requested: {complaint.requested_solution}</span>}{complaint.refund_amount>0&&<span>Refund: Rs {Number(complaint.refund_amount).toLocaleString()}</span>}</div></div><span className={`complaint-status ${complaint.complaint_status.replaceAll('_','-')}`}>{complaint.complaint_status.replaceAll('_',' ')}</span></div><div className={`complaint-body${complaint.evidence_image_url?'':' no-image'}`}>{complaint.evidence_image_url&&<img src={assetUrl(complaint.evidence_image_url)} alt="Complaint evidence"/>}<div><p>{complaint.description}</p>{complaint.admin_response&&<div className="complaint-notes"><strong>Admin response</strong><br/>{complaint.admin_response}</div>}{complaint.replacement_order_id&&<div className="complaint-notes">Replacement order created: {complaint.replacement_order_id}</div>}</div></div></article>)}</div>
    {reporting&&<ComplaintForm onClose={()=>setReporting(false)} onSubmitted={item=>setComplaints(current=>[item,...current])}/>} 
  </section></main><Footer/></div>
}
