export default function CookCard({ cook }) {
  return (
    <article className="card" style={styles.card}>
      <div style={{ ...styles.avatar, background: cook.color }}>{cook.emoji}</div>
      <div>
        <h3 style={styles.name}>{cook.name}</h3>
        <p style={styles.specialty}>{cook.specialty}</p>
        <span style={styles.rating}>★ {cook.rating} · {cook.orders} orders</span>
      </div>
    </article>
  )
}

const styles = {
  card: { padding: 22, display: 'flex', alignItems: 'center', gap: 16 },
  avatar: { width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 32, flexShrink: 0 },
  name: { margin: '0 0 4px', fontSize: 18 },
  specialty: { margin: '0 0 5px', fontSize: 13 },
  rating: { color: 'var(--color-mustard-dark)', fontSize: 12, fontWeight: 700 },
}
