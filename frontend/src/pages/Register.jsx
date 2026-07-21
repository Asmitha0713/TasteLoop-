import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import api, { apiError, saveSession } from '../services/api.js'

const initial = { fullName: '', email: '', phoneNumber: '', password: '', confirm: '', role: 'customer' }

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const next = {}
    if (!form.fullName.trim()) next.fullName = 'Enter your full name.'
    if (!form.email.trim()) next.email = 'Enter your email address.'
    if (!form.phoneNumber.trim()) next.phoneNumber = 'Enter your phone number.'
    if (!form.password) next.password = 'Choose a password.'
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters.'
    if (!form.confirm) next.confirm = 'Confirm your password.'
    else if (form.confirm !== form.password) next.confirm = 'Passwords do not match.'
    return next
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      const { data } = await api.post('/auth/register', {
        full_name: form.fullName, email: form.email, phone_number: form.phoneNumber,
        password: form.password, confirm_password: form.confirm, role: form.role,
      })
      saveSession(data.data)
      navigate(form.role === 'home_cook' ? '/login' : '/customer/dashboard')
    } catch (error) {
      setErrors({ form: apiError(error) })
    } finally {
      setSubmitting(false)
    }
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
                {errors.form && <p style={styles.error}>{errors.form}</p>}
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
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email" type="email" placeholder="you@example.com"
                    value={form.email} onChange={update('email')} aria-invalid={!!errors.email}
                  />
                  {errors.email && <p style={styles.error}>{errors.email}</p>}
                </div>

                <div className="field"><label htmlFor="phoneNumber">Phone number</label><input id="phoneNumber" placeholder="0771234567" value={form.phoneNumber} onChange={update('phoneNumber')} aria-invalid={!!errors.phoneNumber} />{errors.phoneNumber && <p style={styles.error}>{errors.phoneNumber}</p>}</div>
                <div className="field"><label htmlFor="role">Account type</label><select id="role" value={form.role} onChange={update('role')}><option value="customer">Customer</option><option value="home_cook">Home Cook</option></select></div>

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
