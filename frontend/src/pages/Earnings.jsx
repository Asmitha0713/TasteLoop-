import { useMemo, useState } from 'react'
import CookNav from '../components/CookNav.jsx'
import './CookFoods.css'

const transactions = [
  { id: 'TL-2084', date: '21 Jul 2026', customer: 'Ayesha S.', item: 'Chicken Rice & Curry × 2', amount: 1700, status: 'Paid' },
  { id: 'TL-2081', date: '20 Jul 2026', customer: 'Kasun P.', item: 'Watalappan × 2', amount: 1000, status: 'Paid' },
  { id: 'TL-2076', date: '19 Jul 2026', customer: 'Nimali R.', item: 'Cheese Chicken Kottu', amount: 1050, status: 'Processing' },
  { id: 'TL-2068', date: '17 Jul 2026', customer: 'Ruwan J.', item: 'Fish Cutlets × 3', amount: 1440, status: 'Paid' },
  { id: 'TL-2051', date: '12 Jul 2026', customer: 'Mariam A.', item: 'Chicken Rice & Curry', amount: 850, status: 'Paid' },
]

const bars = [42, 58, 47, 76, 63, 88, 72]

export default function Earnings() {
  const [period, setPeriod] = useState('This month')
  const multiplier = period === 'This week' ? 0.28 : period === 'This year' ? 8.4 : 1
  const summary = useMemo(() => ({ earned: Math.round(28450 * multiplier), orders: Math.round(38 * multiplier), average: 749 }), [multiplier])

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

        <section className="card transactions-card"><div className="panel-heading"><div><h2>Recent transactions</h2><p>Your latest completed customer orders.</p></div><button className="text-button">Download statement ↓</button></div><div className="food-table-wrap"><table className="food-table earnings-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Status</th><th>Amount</th></tr></thead><tbody>{transactions.map((row) => <tr key={row.id}><td><strong>#{row.id}</strong><small>{row.date}</small></td><td>{row.customer}</td><td>{row.item}</td><td><span className={`payment-status ${row.status.toLowerCase()}`}>{row.status}</span></td><td><strong>Rs. {row.amount.toLocaleString()}</strong></td></tr>)}</tbody></table></div></section>
      </div></main>
    </div>
  )
}
