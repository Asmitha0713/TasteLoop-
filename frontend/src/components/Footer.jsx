import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div className="container footer-grid" style={styles.grid}>
        <div style={styles.brandCol}>
          <div style={styles.logo}>
            <img src="/logo.jpeg" alt="TasteLoop" style={styles.logoImg} />
          </div>
          <p style={styles.tag}>
            Delicious homemade food, made with love. Connecting home cooks
            with neighbours who want a real meal.
          </p>
        </div>

        <div>
          <h4 style={styles.heading}>Quick Links</h4>
          <ul style={styles.list}>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/browse">Browse Foods</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={styles.heading}>For Customers</h4>
          <ul style={styles.list}>
            <li><Link to="/login">Log In</Link></li>
            <li><Link to="/register">Create Account</Link></li>
            <li><Link to="/browse">Order Food</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={styles.heading}>For Home Cooks</h4>
          <ul style={styles.list}>
            <li><Link to="/choose-role">Become a Home Cook</Link></li>
            <li><Link to="/cook/foods">Cook Dashboard</Link></li>
            <li><Link to="/cook/earnings">Earnings</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={styles.heading}>Contact Us</h4>
          <ul style={styles.list}>
            <li>Hello@Tasteloop.app</li>
            <li>0740625386</li>
            <li>Kilinochchi, Sri Lanka</li>
          </ul>
          <div style={styles.social}>
            {['IG', 'FB', 'X'].map((s) => (
              <a key={s} href="#" style={styles.socialIcon} aria-label={s}>{s}</a>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={styles.bottomBar}>
        <span>© {new Date().getFullYear()} TasteLoop. All rights reserved.</span>
        <div style={styles.bottomLinks}>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <Link to="/admin/dashboard">Admin</Link>
        </div>
      </div>
    </footer>
  )
}

const styles = {
  footer: {
    background: 'var(--color-ink)',
    color: '#e8dcc4',
    marginTop: 60,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1.2fr',
    gap: 32,
    padding: '56px 24px 36px',
  },
  brandCol: { paddingRight: 12 },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: 20,
    fontWeight: 700,
    color: '#fff8ee',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoImg: {
    display: 'block',
    height: 54,
    width: 'auto',
    borderRadius: 6,
  },
  tag: {
    color: '#c9bda6',
    fontSize: 13.5,
    lineHeight: 1.6,
  },
  heading: {
    color: '#fff8ee',
    fontSize: 14,
    marginBottom: 14,
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    letterSpacing: '0.03em',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    fontSize: 13.5,
    color: '#c9bda6',
  },
  social: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '1px solid #4a4033',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: '#e8dcc4',
  },
  bottomBar: {
    borderTop: '1px solid #4a4033',
    padding: '18px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12.5,
    color: '#a5977f',
  },
  bottomLinks: {
    display: 'flex',
    gap: 18,
  },
}
