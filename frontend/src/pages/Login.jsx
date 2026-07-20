import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const next = {}
    if (!form.identifier.trim()) next.identifier = 'Enter your email or phone number.'
    if (!form.password) next.password = 'Enter your password.'
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters.'
    return next
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    // Backend: Login API + JWT issuance would be wired in here.
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      navigate('/')
    }, 700)
  }

  return (
    <div className="page">
      <Navbar />

      <main className="page-content">
        <section style={styles.wrap}>
          <div className="container" style={styles.inner}>
            <div className="card" style={styles.formCard}>
              <span className="eyebrow">Welcome back</span>
              <h1 style={styles.h1}>Log in to TasteLoop</h1>
              <p style={styles.sub}>Pick up where you left off — order, cook, or check your kitchen.</p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="field">
                  <label htmlFor="identifier">Email or phone number</label>
                  <input
                    id="identifier"
                    type="text"
                    placeholder="you@example.com or 07X XXX XXXX"
                    value={form.identifier}
                    onChange={update('identifier')}
                    aria-invalid={!!errors.identifier}
                  />
                  {errors.identifier && <p style={styles.error}>{errors.identifier}</p>}
                </div>

                <div className="field">
                  <div style={styles.labelRow}>
                    <label htmlFor="password" style={{ margin: 0 }}>Password</label>
                    <Link to="#" style={styles.forgot}>Forgot password?</Link>
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={update('password')}
                    aria-invalid={!!errors.password}
                  />
                  {errors.password && <p style={styles.error}>{errors.password}</p>}
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                  {submitting ? 'Logging in…' : 'Log In'}
                </button>
              </form>

              <div style={styles.divider}>
                <span style={styles.dividerLine} />
                <span style={styles.dividerText}>or continue with</span>
                <span style={styles.dividerLine} />
              </div>

              <div style={styles.socialRow}>
                <button type="button" className="btn btn-secondary btn-block btn-sm">🟢 Google</button>
                <button type="button" className="btn btn-secondary btn-block btn-sm">🔵 Facebook</button>
                <button type="button" className="btn btn-secondary btn-block btn-sm">⚫ Apple</button>
              </div>

              <p style={styles.footNote}>
                New to TasteLoop?{' '}
                <Link to="/register" style={styles.link}>Create an account</Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

const styles = {
  wrap: {
    background: 'linear-gradient(180deg, var(--color-mustard-tint) 0%, var(--color-bg) 45%)',
    padding: '64px 0 80px',
  },
  inner: {
    display: 'flex',
    justifyContent: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: 440,
    padding: '40px 36px',
    textAlign: 'left',
  },
  h1: { fontSize: 30, margin: '10px 0 6px' },
  sub: { fontSize: 14, marginBottom: 26 },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  forgot: { fontSize: 12.5, fontWeight: 600, color: 'var(--color-chili)' },
  error: { color: 'var(--color-chili)', fontSize: 12.5, marginTop: 6, marginBottom: 0 },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '26px 0 18px' },
  dividerLine: { flex: 1, height: 1, background: 'var(--color-border-strong)' },
  dividerText: { fontSize: 12, color: 'var(--color-ink-faint)', whiteSpace: 'nowrap' },
  socialRow: { display: 'flex', flexDirection: 'column', gap: 10 },
  footNote: { textAlign: 'center', fontSize: 13.5, marginTop: 26, marginBottom: 0 },
  link: { color: 'var(--color-forest)', fontWeight: 700 },
}
