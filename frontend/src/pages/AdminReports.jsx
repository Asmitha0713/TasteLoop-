import { useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout.jsx'
import { adminReports } from '../data/adminData.js'

export default function AdminReports() {
  const [reports,setReports]=useState(adminReports)
  const [filter,setFilter]=useState('All reports')
  const [selected,setSelected]=useState(null)
  const visible=useMemo(()=>reports.filter(r=>filter==='All reports'||r.status===filter),[reports,filter])
  const resolve=id=>{setReports(current=>current.map(r=>r.id===id?{...r,status:'Resolved'}:r));setSelected(null)}
  return <AdminLayout title="Reports & disputes" eyebrow="Trust and safety" action={<select className="admin-select" value={filter} onChange={e=>setFilter(e.target.value)}><option>All reports</option><option>Open</option><option>Investigating</option><option>Resolved</option></select>}>
    <div className="report-stats"><article className="card"><i className="red">!</i><div><strong>{reports.filter(r=>r.status==='Open').length}</strong><span>Open reports</span></div></article><article className="card"><i className="yellow">⌕</i><div><strong>{reports.filter(r=>r.status==='Investigating').length}</strong><span>Under investigation</span></div></article><article className="card"><i className="green">✓</i><div><strong>{reports.filter(r=>r.status==='Resolved').length}</strong><span>Resolved</span></div></article></div>
    <div className="reports-layout"><section className="card report-list">{visible.map(report=><button key={report.id} onClick={()=>setSelected(report)} className={selected?.id===report.id?'selected':''}><div className="report-line"><span className={`priority ${report.priority.toLowerCase()}`}>{report.priority}</span><small>#{report.id} · {report.date}</small></div><h3>{report.type}</h3><p>{report.subject}</p><div className="report-line"><small>Against: <b>{report.against}</b></small><span className={`admin-status ${report.status.toLowerCase()}`}>{report.status}</span></div></button>)}{!visible.length&&<div className="admin-empty">No reports in this category.</div>}</section>
      <aside className="card report-detail">{selected?<><span className="eyebrow">Report #{selected.id}</span><h2>{selected.type}</h2><p>{selected.details}</p><dl><div><dt>Reported by</dt><dd>{selected.reporter}</dd></div><div><dt>Reported against</dt><dd>{selected.against}</dd></div><div><dt>Related item</dt><dd>{selected.subject}</dd></div><div><dt>Priority</dt><dd>{selected.priority}</dd></div></dl>{selected.status!=='Resolved'&&<div className="report-actions"><button className="btn btn-secondary" onClick={()=>setReports(current=>current.map(r=>r.id===selected.id?{...r,status:'Investigating'}:r))}>Investigate</button><button className="btn btn-forest" onClick={()=>resolve(selected.id)}>Mark Resolved</button></div>}</>:<div className="report-placeholder"><span>⚑</span><h2>Select a report</h2><p>Choose a report to review its details and take action.</p></div>}</aside>
    </div>
  </AdminLayout>
}
