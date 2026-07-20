import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

const initial = { fullName: '', identifier: '', password: '', confirm: '' }

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const next = {}
    if (!form.fullName.trim()) next.fullName = 'Enter your full name.'
    if (!form.identifier.trim()) next.identifier = 'Enter your email or phone number.'
    if (!form.password) next.password = 'Choose a password.'
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters.'
    if (!form.confirm) next.confirm = 'Confirm your password.'
    else if (form.confirm !== form.password) next.confirm = 'Passwords do not match.'
    return next
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    // Backend: Register API (with bcrypt hashing) would be wired in here.
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      navigate('/choose-role')
    }, 700)
  }

  return (
    <div className="page">
      <Navbar />

      <main className="page-content">
        <section style={styles.wrap}>
          <div className="container" style={styles.inner}>
            <div className="card" style={styles.formCard}>
              <span className="eyebrow">Join TasteLoop</span>
              <h1 style={styles.h1}>Create your account</h1>
              <p style={styles.sub}>Order home-cooked meals, or start selling from your own kitchen.</p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="field">
                  <label htmlFor="fullName">Full name</label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Ashen Perera"
                    value={form.fullName}
                    onChange={update('fullName')}
                    aria-invalid={!!errors.fullName}
                  />
                  {errors.fullName && <p style={styles.error}>{errors.fullName}</p>}
                </div>

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
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={update('password')}
                    aria-invalid={!!errors.password}
                  />
                  {errors.password && <p style={styles.error}>{errors.password}</p>}
                </div>

                <div className="field">
                  <label htmlFor="confirm">Confirm password</label>
                  <input
                    id="confirm"
                    type="password"
                    placeholder="Re-enter your password"
                    value={form.confirm}
                    onChange={update('confirm')}
                    aria-invalid={!!errors.confirm}
                  />
                  {errors.confirm && <p style={styles.error}>{errors.confirm}</p>}
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                  {submitting ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <p style={styles.terms}>
                By creating an account you agree to TasteLoop's Terms &amp; Privacy Policy.
              </p>

              <p style={styles.footNote}>
                Already have an account?{' '}
                <Link to="/login" style={styles.link}>Log in</Link>
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
  inner: { display: 'flex', justifyContent: 'center' },
  formCard: {
    width: '100%',
    maxWidth: 440,
    padding: '40px 36px',
    textAlign: 'left',
  },
  h1: { fontSize: 30, margin: '10px 0 6px' },
  sub: { fontSize: 14, marginBottom: 26 },
  error: { color: 'var(--color-chili)', fontSize: 12.5, marginTop: 6, marginBottom: 0 },
  terms: { fontSize: 12, color: 'var(--color-ink-faint)', marginTop: 18, textAlign: 'center' },
  footNote: { textAlign: 'center', fontSize: 13.5, marginTop: 10, marginBottom: 0 },
  link: { color: 'var(--color-forest)', fontWeight: 700 },
}
