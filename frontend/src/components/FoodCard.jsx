import { Link } from 'react-router-dom'

export default function FoodCard({ food }) {
  return (
    <article className="card" style={styles.card}>
      <div style={{ ...styles.image, background: food.color }}><span>{food.emoji}</span></div>
      <div style={styles.body}>
        <div style={styles.meta}><span className="stitched">{food.category}</span><span>★ {food.rating}</span></div>
        <h3 style={styles.title}>{food.name}</h3>
        <p style={styles.cook}>by {food.cook}</p>
        <div style={styles.bottom}><strong>Rs {food.price}</strong><Link className="btn btn-primary btn-sm" to={`/food/${food.id}`}>View dish</Link></div>
      </div>
    </article>
  )
}

const styles = {
  card: { overflow: 'hidden' },
  image: { height: 180, display: 'grid', placeItems: 'center', fontSize: 70 },
  body: { padding: 20 },
  meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-mustard-dark)', fontSize: 13, fontWeight: 700 },
  title: { margin: '14px 0 4px', fontSize: 20 },
  cook: { margin: 0, fontSize: 13 },
  bottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, color: 'var(--color-chili)' },
}
