import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CustomerNav from '../components/CustomerNav.jsx'
import Footer from '../components/Footer.jsx'
import FoodCard from '../components/FoodCard.jsx'
import api, { apiError } from '../services/api.js'

export default function SearchFilter() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('query') || '')
  const [category, setCategory] = useState('All')
  const [maxPrice, setMaxPrice] = useState(1500)
  const [sort, setSort] = useState('Recommended')
  const [results, setResults] = useState([])
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { api.get('/foods/categories').then(({data}) => setCategories(data.data.map(name => ({name})))).catch(requestError => setError(apiError(requestError))) }, [])
  useEffect(() => {
    const timer = window.setTimeout(() => {
      api.get('/foods', { params: { query: query || undefined, category: category === 'All' ? undefined : category, max_price: maxPrice, sort: sort === 'Price: Low to high' ? 'price_low' : 'recommended' } })
        .then(({data}) => setResults(data.data.map(food => ({...food,cook:food.cook_name}))))
        .catch(requestError => setError(apiError(requestError)))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query, category, maxPrice, sort])

  return (
    <div className="page"><CustomerNav /><main className="page-content">
      <section style={styles.hero}><div className="container"><span className="eyebrow">Find your next meal</span><h1 style={styles.h1}>Search homemade food</h1><div style={styles.search}><span>🔍</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dishes or home cooks…" style={styles.input} /><button className="btn btn-primary">Search</button></div></div></section>
      <section className="container search-layout" style={styles.layout}>
        {error && <p style={{ color: 'var(--color-chili)' }}>{error}</p>}
        <aside className="card" style={styles.filters}>
          <div style={styles.filterHead}><h3 style={{ margin: 0 }}>Filters</h3><button onClick={() => { setCategory('All'); setMaxPrice(1500); setQuery('') }} style={styles.clear}>Clear all</button></div>
          <div style={styles.group}><strong style={styles.label}>Category</strong>{['All', ...categories.map((c) => c.name)].map((name) => <label style={styles.check} key={name}><input type="radio" name="category" checked={category === name} onChange={() => setCategory(name)} /> {name}</label>)}</div>
          <div style={styles.group}><strong style={styles.label}>Maximum price</strong><input type="range" min="400" max="1500" step="50" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} style={{ width: '100%' }} /><div style={styles.range}><span>Rs 400</span><strong>Rs {maxPrice}</strong></div></div>
          <div style={styles.group}><strong style={styles.label}>Dietary preference</strong>{['Vegetarian', 'Halal', 'No dairy'].map((name) => <label style={styles.check} key={name}><input type="checkbox" /> {name}</label>)}</div>
        </aside>
        <div><div style={styles.resultHead}><div><h2 style={{ margin: 0 }}>Food near you</h2><p style={styles.count}>{results.length} dishes found</p></div><select value={sort} onChange={(e) => setSort(e.target.value)} style={styles.select}><option>Recommended</option><option>Rating</option><option>Price: Low to high</option></select></div>
          <div className="grid-2" style={styles.grid}>{results.map((food) => <FoodCard key={food.id} food={food} />)}</div>{!results.length && <div className="card" style={styles.empty}>No meals match those filters. Try widening your search.</div>}
        </div>
      </section>
    </main><Footer /></div>
  )
}

const styles = {
  hero: { padding: '46px 0 38px', background: 'linear-gradient(180deg, var(--color-mustard-tint), var(--color-bg))' }, h1: { margin: '10px 0 22px', fontSize: 36 },
  search: { maxWidth: 720, display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px 8px 18px', border: '1.5px solid var(--color-border-strong)', background: 'white', borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-card)' }, input: { flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent' },
  layout: { paddingTop: 42, paddingBottom: 72, display: 'grid', gridTemplateColumns: '240px 1fr', gap: 30, alignItems: 'start' }, filters: { padding: 22, position: 'sticky', top: 100 },
  filterHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }, clear: { border: 0, background: 'none', color: 'var(--color-chili)', cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  group: { padding: '18px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 10 }, label: { fontSize: 13, marginBottom: 2 }, check: { fontSize: 13, color: 'var(--color-ink-soft)', cursor: 'pointer' }, range: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-ink-faint)' },
  resultHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }, count: { margin: '5px 0 0', fontSize: 12.5 }, select: { padding: '10px 14px', border: '1px solid var(--color-border-strong)', borderRadius: 10, background: 'white', color: 'var(--color-ink)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }, empty: { padding: 40, textAlign: 'center', color: 'var(--color-ink-faint)' },
}
