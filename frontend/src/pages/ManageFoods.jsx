import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import CookNav from '../components/CookNav.jsx'
import api, { apiError, currentUser } from '../services/api.js'
import './CookFoods.css'

export default function ManageFoods() {
  const location = useLocation()
  const [foods, setFoods] = useState([])
  const [error, setError] = useState('')
  const user = currentUser()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const visible = useMemo(() => foods.filter((food) => (filter === 'All' || food.status === filter) && food.name.toLowerCase().includes(query.toLowerCase())), [foods, query, filter])

  const display = (food) => ({ ...food, status: food.portions === 0 ? 'Sold out' : food.available ? 'Available' : 'Unavailable' })
  useEffect(() => { api.get('/foods/mine/list').then(({ data }) => setFoods(data.data.map(display))).catch((requestError) => setError(apiError(requestError))) }, [])
  const toggle = async (id) => {
    const food = foods.find((item) => item.id === id)
    try { const { data } = await api.patch(`/foods/${id}`, { available: food.status !== 'Available' }); setFoods((current) => current.map((item) => item.id === id ? display(data.data) : item)) }
    catch (requestError) { setError(apiError(requestError)) }
  }
  const remove = async (id, name) => {
    if (!window.confirm(`Remove “${name}” from your menu?`)) return
    try { await api.delete(`/foods/${id}`); setFoods((current) => current.filter((food) => food.id !== id)) }
    catch (requestError) { setError(apiError(requestError)) }
  }

  return (
    <div className="page cook-page"><CookNav />
      <main className="page-content cook-main"><div className="container">
        {location.state?.message && <div className="success-banner">✓ {location.state.message}</div>}
        {user?.account_status === 'pending_approval' && <div className="success-banner">Your cook account is awaiting admin approval. You can prepare your menu now; approved dishes become public after your account is approved.</div>}
        {error && <div className="success-banner">{error}</div>}
        <div className="manage-heading"><div><span className="eyebrow">Your kitchen</span><h1>Manage foods</h1><p>Update your menu, stock and availability in one place.</p></div><Link to="/cook/add-food" className="btn btn-primary">＋ Add New Food</Link></div>
        <div className="food-stats">
          <div className="card"><span>Menu items</span><strong>{foods.length}</strong></div>
          <div className="card"><span>Available today</span><strong>{foods.filter((f) => f.status === 'Available').length}</strong></div>
          <div className="card"><span>Total portions</span><strong>{foods.reduce((sum, f) => sum + Number(f.portions), 0)}</strong></div>
        </div>
        <section className="card manage-card">
          <div className="manage-toolbar"><label className="food-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your foods…" aria-label="Search foods" /></label><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status"><option>All</option><option>Available</option><option>Unavailable</option><option>Sold out</option></select></div>
          <div className="food-table-wrap"><table className="food-table"><thead><tr><th>Food</th><th>Price</th><th>Portions</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {visible.map((food) => <tr key={food.id}><td><div className="food-cell"><span style={{ background: food.color }}>{food.emoji}</span><div><strong>{food.name}</strong><small>{food.category}</small></div></div></td><td><strong>Rs. {Number(food.price).toLocaleString()}</strong></td><td>{food.portions}</td><td><button className={`status-pill ${food.status.toLowerCase().replace(' ', '-')}`} onClick={() => toggle(food.id)}><i />{food.status}</button></td><td><div className="row-actions"><Link to={`/cook/foods/${food.id}/edit`} aria-label={`Edit ${food.name}`}>✎</Link><button onClick={() => remove(food.id, food.name)} aria-label={`Delete ${food.name}`}>♲</button></div></td></tr>)}
          </tbody></table></div>
          {!visible.length && <div className="empty-foods"><span>🍽️</span><h2>No foods found</h2><p>Try another search or add something new to your menu.</p><Link to="/cook/add-food" className="btn btn-forest btn-sm">Add a food</Link></div>}
        </section>
      </div></main>
    </div>
  )
}
