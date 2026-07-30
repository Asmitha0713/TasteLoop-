import { useEffect, useMemo, useState } from 'react'
import CookNav from '../components/CookNav.jsx'
import api, { apiError } from '../services/api.js'
import './CookFoods.css'

const bars = [42, 58, 47, 76, 63, 88, 72]

export default function Earnings() {
  const [period, setPeriod] = useState('This month')
  const [transactions, setTransactions] = useState([])
  const [ordersError, setOrdersError] = useState('')
  const [ordersLoading, setOrdersLoading] = useState(true)
  const multiplier = period === 'This week' ? 0.28 : period === 'This year' ? 8.4 : 1
  const summary = useMemo(() => ({ earned: Math.round(28450 * multiplier), orders: Math.round(38 * multiplier), average: 749 }), [multiplier])
  useEffect(() => {
    api.get('/cook/orders/recent')
      .then(({ data }) => setTransactions(data.data.map(order => ({
        ...order,
        date: new Date(order.created_at).toLocaleDateString(),
        customer: order.customer_name,
        item: order.items.map(item => `${item.name} × ${item.quantity}`).join(', '),
        displayStatus: (order.payment_status === 'paid' ? 'Paid' : order.status).replaceAll('_', ' '),
      }))))
      .catch(error => setOrdersError(apiError(error)))
      .finally(() => setOrdersLoading(false))
  }, [])

  return (
    <div className="page cook-page"><CookNav />
      <main className="page-content cook-main"><div className="container">
        <div className="manage-heading"><div><span className="eyebrow">Kitchen performance</span><h1>Your earnings</h1><p>See what you’ve earned and keep track of every payment.</p></div><select className="period-select" value={period} onChange={(e) => setPeriod(e.target.value)}><option>This week</option><option>This month</option><option>This year</option></select></div>

        <div className="earning-stats">
          <article className="card earning-card featured"><div><span>Total earnings</span><strong>Rs. {summary.earned.toLocaleString()}</strong><small>↑ 12.5% from last period</small></div><i>රු</i></article>
          <article className="card earning-card"><div><span>Completed orders</span><strong>{summary.orders}</strong><small>4 more than last period</small></div><i>✓</i></article>
          <article className="card earning-card"><div><span>Average order</span><strong>Rs. {summary.average}</strong><small>Across all menu items</small></div><i>↗</i></article>
        </div>

        <div className="earnings-grid">
          <section className="card chart-card"><div className="panel-heading"><div><h2>Earnings overview</h2><p>Daily earnings for the selected period</p></div><span className="stitched">+12.5%</span></div><div className="bar-chart" aria-label="Weekly earnings chart">{bars.map((height, index) => <div className="bar-column" key={index}><div className="bar-track"><span style={{ height: `${height}%` }} /></div><small>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][index]}</small></div>)}</div></section>
          <aside className="card payout-card"><span className="eyebrow">Next payout</span><strong>Rs. 8,340</strong><p>Scheduled for 25 July</p><div className="bank-row"><span>🏦</span><div><b>Commercial Bank</b><small>•••• 4821</small></div></div><button className="btn btn-secondary btn-block">Manage payout details</button></aside>
        </div>

        <section className="card transactions-card"><div className="panel-heading"><div><h2>Recent customers</h2><p>Customers who recently placed orders from your kitchen.</p></div></div>{ordersError&&<div className="error-banner">{ordersError}</div>}{ordersLoading&&<div className="empty-foods">Loading recent customers…</div>} {!ordersLoading&&!ordersError&&<div className="food-table-wrap"><table className="food-table earnings-table"><thead><tr><th>Order</th><th>Customer name</th><th>Items</th><th>Status</th><th>Amount</th></tr></thead><tbody>{transactions.map((row) => <tr key={row.id}><td><strong>#{row.order_number}</strong><small>{row.date}</small></td><td><strong>{row.customer}</strong></td><td>{row.item}</td><td><span className={`payment-status ${row.displayStatus.toLowerCase().replaceAll(' ','-')}`}>{row.displayStatus}</span></td><td><strong>Rs. {Number(row.amount).toLocaleString()}</strong></td></tr>)}</tbody></table>{!transactions.length&&<div className="empty-foods"><span>👥</span><h2>No customer orders yet</h2><p>Customer names will appear here after they place an order from your kitchen.</p></div>}</div>}</section>
      </div></main>
    </div>
  )
}
