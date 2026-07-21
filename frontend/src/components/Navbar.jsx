import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/browse', label: 'Browse Foods' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <header style={styles.header}>
      <div className="container" style={styles.bar}>
        <Link to="/" style={styles.logo}>
          <img src="/tasteloop-logo.png" alt="TasteLoop home" style={styles.logoImg} />
          <span>TasteLoop</span>
        </Link>

        <nav style={styles.nav} className="hide-mobile">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              style={{
                ...styles.navLink,
                color: pathname === l.to ? 'var(--color-forest)' : 'var(--color-ink-soft)',
                fontWeight: pathname === l.to ? 700 : 500,
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div style={styles.actions}>
          <Link to="/login" className="btn btn-secondary btn-sm">Log In</Link>
          <Link to="/choose-role" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </div>
    </header>
  )
}

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'rgba(251,245,232,0.9)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid var(--color-border)',
  },
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    gap: 24,
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--color-ink)',
  },
  logoImg: {
    display: 'block',
    width: 58,
    height: 58,
    objectFit: 'contain',
  },
  nav: {
    display: 'flex',
    gap: 28,
  },
  navLink: {
    fontSize: 14.5,
  },
  actions: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
}
