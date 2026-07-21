import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout.jsx'
import api, { apiError } from '../services/api.js'

export default function AdminFoods() {
  const [foods, setFoods] = useState([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const visible = useMemo(() => foods.filter(f => (status === 'All statuses' || f.status === status) && `${f.name} ${f.cook}`.toLowerCase().includes(query.toLowerCase())), [foods,query,status])
  const display = food => ({ ...food, cook: food.cook_name, status: food.moderation_status[0].toUpperCase() + food.moderation_status.slice(1), date: new Date(food.created_at).toLocaleDateString() })
  useEffect(() => { api.get('/admin/foods').then(({data}) => setFoods(data.data.map(display))).catch(requestError => setError(apiError(requestError))) }, [])
  const moderate = async (id,next) => {
    try { await api.patch(`/admin/foods/${id}/moderation`, { moderation_status: next.toLowerCase() }); setFoods(current=>current.map(food=>food.id===id?{...food,status:next}:food)) }
    catch (requestError) { setError(apiError(requestError)) }
  }
  return <AdminLayout title="Manage foods" eyebrow="Marketplace moderation">
    {error && <p className="admin-form-error">{error}</p>}
    <div className="admin-summary-row"><span><strong>{foods.length}</strong> Total listings</span><span><strong>{foods.filter(f=>f.status==='Approved').length}</strong> Approved</span><span><strong>{foods.filter(f=>f.status==='Pending').length}</strong> Awaiting review</span></div>
    <section className="card admin-table-card"><div className="admin-toolbar"><label className="admin-search">⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search foods or cooks…" /></label><select value={status} onChange={e=>setStatus(e.target.value)} className="admin-select"><option>All statuses</option><option>Approved</option><option>Pending</option><option>Flagged</option><option>Rejected</option></select></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Food listing</th><th>Cook</th><th>Price</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map(food=><tr key={food.id}><td><div className="admin-food-cell"><i style={{background:food.color}}>{food.emoji}</i><div><strong>{food.name}</strong><small>{food.category}</small></div></div></td><td>{food.cook}</td><td><strong>Rs. {food.price.toLocaleString()}</strong></td><td>{food.date}</td><td><span className={`admin-status ${food.status.toLowerCase()}`}>{food.status}</span></td><td><div className="moderation-actions"><button title="Approve" onClick={()=>moderate(food.id,'Approved')}>✓</button><button title="Reject" onClick={()=>moderate(food.id,'Rejected')}>×</button></div></td></tr>)}</tbody></table></div>{!visible.length&&<div className="admin-empty">No matching food listings found.</div>}
    </section>
  </AdminLayout>
}
