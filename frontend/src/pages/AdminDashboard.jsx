import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout.jsx'
import { adminFoods, adminReports, adminUsers } from '../data/adminData.js'

const activity = [
  { icon: '👩🏽‍🍳', text: 'Rani Selvarajah applied as a home cook', time: '12 min ago' },
  { icon: '🍲', text: 'Seafood Kottu was flagged for review', time: '34 min ago' },
  { icon: '✓', text: 'Order #TL-2084 was completed', time: '1 hr ago' },
  { icon: '⚑', text: 'A new food quality report was submitted', time: '2 hrs ago' },
]

export default function AdminDashboard() {
  return <AdminLayout title="Dashboard overview" eyebrow="Welcome back, Admin" action={<select className="admin-select"><option>Last 30 days</option><option>Last 7 days</option><option>This year</option></select>}>
    <div className="admin-stats">
      <article className="admin-stat card"><i className="green">♙</i><div><span>Total users</span><strong>1,248</strong><small>↑ 8.2% this month</small></div></article>
      <article className="admin-stat card"><i className="orange">♨</i><div><span>Active foods</span><strong>386</strong><small>↑ 24 new listings</small></div></article>
      <article className="admin-stat card"><i className="yellow">▣</i><div><span>Total orders</span><strong>2,914</strong><small>↑ 12.5% this month</small></div></article>
      <article className="admin-stat card"><i className="red">⚑</i><div><span>Open reports</span><strong>{adminReports.filter(r => r.status !== 'Resolved').length}</strong><small>2 need urgent review</small></div></article>
    </div>
    <div className="admin-dashboard-grid">
      <section className="card admin-panel revenue-panel"><div className="admin-panel-head"><div><h2>Platform activity</h2><p>Orders completed over the last seven days</p></div><span className="admin-growth">+12.5%</span></div><div className="admin-chart">{[45,62,51,76,66,90,82].map((height,i) => <div key={i}><span style={{height:`${height}%`}} /><small>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</small></div>)}</div></section>
      <section className="card admin-panel"><div className="admin-panel-head"><div><h2>User breakdown</h2><p>Current platform community</p></div></div><div className="donut-wrap"><div className="donut"><strong>1,248</strong><small>Users</small></div><div className="donut-legend"><span><i className="customer" />Customers <b>78%</b></span><span><i className="cook" />Home cooks <b>22%</b></span></div></div></section>
    </div>
    <div className="admin-dashboard-grid lower">
      <section className="card admin-panel"><div className="admin-panel-head"><div><h2>Recent activity</h2><p>Latest changes across TasteLoop</p></div><Link to="/admin/reports">View reports →</Link></div><div className="activity-list">{activity.map((item) => <div key={item.text}><i>{item.icon}</i><p>{item.text}<small>{item.time}</small></p></div>)}</div></section>
      <section className="card admin-panel"><div className="admin-panel-head"><div><h2>Needs attention</h2><p>Items waiting for review</p></div></div><div className="attention-list"><Link to="/admin/users"><span>Cook applications</span><strong>{adminUsers.filter(u => u.status === 'Pending').length} pending</strong></Link><Link to="/admin/foods"><span>Food listings</span><strong>{adminFoods.filter(f => f.status === 'Pending').length} pending</strong></Link><Link to="/admin/reports"><span>High priority reports</span><strong>{adminReports.filter(r => r.priority === 'High' && r.status !== 'Resolved').length} open</strong></Link></div></section>
    </div>
  </AdminLayout>
}
