import { Link } from 'react-router-dom'
import FavoriteButton from './FavoriteButton.jsx'
import { assetUrl } from '../services/api.js'

export default function FoodCard({ food, favorite, onFavoriteChange }) {
  return (
    <article className="card" style={styles.card}>
      <div style={{ ...styles.image, background: food.color }}>{food.image_url ? <img src={assetUrl(food.image_url)} alt={food.name} style={styles.foodImage} loading="lazy" /> : <span>{food.emoji}</span>}<FavoriteButton foodId={food.id} initialFavorite={favorite} onChange={onFavoriteChange} /></div>
      <div style={styles.body}>
        <div style={styles.meta}><span className="stitched">{food.category}</span><span>★ {food.rating}</span></div>
        <h3 style={styles.title}>{food.name}</h3>
        <p style={styles.cook}>by {food.cook || food.cook_name}</p>
        <div style={styles.bottom}><strong>Rs {food.price}</strong><Link className="btn btn-primary btn-sm" to={`/food/${food.id}`}>View dish</Link></div>
      </div>
    </article>
  )
}

const styles = {
  card: { overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' },
  image: {
    height: 180,
    flex: '0 0 180px',
    overflow: 'hidden',
    display: 'grid',
    placeItems: 'center',
    fontSize: 70,
    position: 'relative',
  },
  foodImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    display: 'block',
    objectFit: 'cover',
  },
  body: { padding: 20, display: 'flex', flex: 1, flexDirection: 'column' },
  meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-mustard-dark)', fontSize: 13, fontWeight: 700 },
  title: { margin: '14px 0 4px', fontSize: 20 },
  cook: { margin: 0, fontSize: 13 },
  bottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 18, color: 'var(--color-chili)' },
}
