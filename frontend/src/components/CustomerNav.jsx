import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/customer/dashboard', label: 'Dashboard' },
  { to: '/search', label: 'Find Food' },
  { to: '/orders', label: 'My Orders' },
]

export default function CustomerNav() {
  const { pathname } = useLocation()

  return (
    <header style={styles.header}>
      <div className="container" style={styles.bar}>
        <Link to="/customer/dashboard"><img src="/logo-centered-transparent.png" alt="TasteLoop" style={styles.logo} /></Link>
        <nav className="hide-mobile" style={styles.nav}>
          {links.map((link) => (
            <Link key={link.to} to={link.to} style={{ ...styles.link, color: pathname === link.to ? 'var(--color-forest)' : 'var(--color-ink-soft)' }}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div style={styles.actions}>
          <Link to="/cart" className="btn btn-secondary btn-sm">🛒 Cart <span style={styles.badge}>2</span></Link>
          <div style={styles.avatar} title="Ayesha Fernando">AF</div>
        </div>
      </div>
    </header>
  )
}

const styles = {
  header: { position: 'sticky', top: 0, zIndex: 50, background: 'rgba(251,245,232,.94)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--color-border)' },
  bar: { minHeight: 78, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 22 },
  logo: { display: 'block', height: 58, width: 58, objectFit: 'cover' },
  nav: { display: 'flex', gap: 28 },
  link: { fontSize: 14, fontWeight: 700 },
  actions: { display: 'flex', alignItems: 'center', gap: 12 },
  badge: { minWidth: 20, height: 20, display: 'inline-grid', placeItems: 'center', borderRadius: 10, background: 'var(--color-chili)', color: 'white', fontSize: 11 },
  avatar: { width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: '50%', background: 'var(--color-forest)', color: 'white', fontSize: 12, fontWeight: 700 },
}
