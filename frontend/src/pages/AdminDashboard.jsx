import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout.jsx'
import api, { apiError } from '../services/api.js'

const relativeTime = (value) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`
  const days = Math.floor(seconds / 86400)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [activeReports, setActiveReports] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/admin/dashboard'), api.get('/admin/reports?active_only=true')])
      .then(([dashboardResponse, reportsResponse]) => {
        setStats(dashboardResponse.data.data)
        setActiveReports(reportsResponse.data.data.slice(0, 4))
      })
      .catch(requestError => setError(apiError(requestError)))
  }, [])

  const users = stats?.users ?? 0
  const customerPercentage = useMemo(
    () => users ? Math.round(((stats?.customers ?? 0) / users) * 100) : 0,
    [stats, users],
  )
  const cookPercentage = users ? Math.round(((stats?.home_cooks ?? 0) / users) * 100) : 0

  return <AdminLayout title="Dashboard overview" eyebrow="Welcome back, Admin" action={<select className="admin-select"><option>Last 30 days</option><option>Last 7 days</option><option>This year</option></select>}>
    {error && <p className="admin-form-error">{error}</p>}
    <div className="admin-stats">
      <article className="admin-stat card"><i className="green">♙</i><div><span>Total users</span><strong>{stats ? users.toLocaleString() : '—'}</strong><small>{stats?.pending_users ?? 0} awaiting approval</small></div></article>
      <article className="admin-stat card"><i className="orange">♨</i><div><span>Food listings</span><strong>{stats ? stats.foods.toLocaleString() : '—'}</strong><small>{stats?.pending_foods ?? 0} awaiting review</small></div></article>
      <article className="admin-stat card"><i className="yellow">▣</i><div><span>Delivered orders</span><strong>{stats ? stats.orders.toLocaleString() : '—'}</strong><small>Rs. {(stats?.revenue ?? 0).toLocaleString()} revenue</small></div></article>
      <article className="admin-stat card"><i className="red">⚑</i><div><span>Open reports</span><strong>{stats ? stats.open_reports.toLocaleString() : '—'}</strong><small>Require administrator review</small></div></article>
    </div>
    <div className="admin-dashboard-grid">
      <section className="card admin-panel revenue-panel"><div className="admin-panel-head"><div><h2>Platform activity</h2><p>Orders completed over the last seven days</p></div><span className="admin-growth">+12.5%</span></div><div className="admin-chart">{[45,62,51,76,66,90,82].map((height,i) => <div key={i}><span style={{height:`${height}%`}} /><small>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</small></div>)}</div></section>
      <section className="card admin-panel"><div className="admin-panel-head"><div><h2>User breakdown</h2><p>Current platform community</p></div></div><div className="donut-wrap"><div className="donut"><strong>{stats ? users.toLocaleString() : '—'}</strong><small>Users</small></div><div className="donut-legend"><span><i className="customer" />Customers <b>{customerPercentage}%</b></span><span><i className="cook" />Home cooks <b>{cookPercentage}%</b></span></div></div></section>
    </div>
    <div className="admin-dashboard-grid lower">
      <section className="card admin-panel"><div className="admin-panel-head"><div><h2>Active reports</h2><p>Reports currently requiring administrator attention</p></div><Link to="/admin/reports">View reports →</Link></div><div className="activity-list">{activeReports.map((report) => <div key={report.id}><i>⚑</i><p>{report.report_type}: {report.subject}<small>{report.status === 'investigating' ? 'Under investigation' : 'Open'} · {relativeTime(report.created_at)}</small></p></div>)}{!activeReports.length && !error && <div className="admin-empty">No active reports.</div>}</div></section>
      <section className="card admin-panel"><div className="admin-panel-head"><div><h2>Needs attention</h2><p>Items waiting for review</p></div></div><div className="attention-list"><Link to="/admin/users"><span>User approvals</span><strong>{stats?.pending_users ?? 0} pending</strong></Link><Link to="/admin/foods"><span>Food listings</span><strong>{stats?.pending_foods ?? 0} pending</strong></Link><Link to="/admin/reports"><span>Open reports</span><strong>{stats?.open_reports ?? 0} open</strong></Link></div></section>
    </div>
  </AdminLayout>
}
