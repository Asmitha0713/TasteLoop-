import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

const roles = [
  {
    id: 'customer',
    title: "I'm a Customer",
    emoji: '🧑‍🍳',
    text: 'Browse dishes from home cooks near you and get a real home-cooked meal delivered.',
    points: ['Order from trusted home kitchens', 'Track your order in real time', 'Save favourite cooks & dishes'],
    cta: 'Continue as Customer',
    to: '/customer/dashboard',
    accent: 'var(--color-forest)',
    accentTint: 'var(--color-forest-tint)',
  },
  {
    id: 'homecook',
    title: "I'm a Home Cook",
    emoji: '👩‍🍳',
    text: 'Turn your kitchen into a source of income. List your dishes and start earning.',
    points: ['List dishes in minutes', 'Set your own prices & hours', 'Get paid straight to your account'],
    cta: 'Continue as Home Cook',
    to: '/cook/dashboard',
    accent: 'var(--color-chili)',
    accentTint: '#f6dcd0',
  },
]

export default function ChooseRole() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)

  const handleContinue = () => {
    const role = roles.find((r) => r.id === selected)
    if (role) navigate(role.to)
  }

  return (
    <div className="page">
      <Navbar />

      <main className="page-content">
        <section style={styles.wrap}>
          <div className="container" style={{ textAlign: 'center' }}>
            <span className="eyebrow" style={{ justifyContent: 'center' }}>One last step</span>
            <h1 style={styles.h1}>How will you use TasteLoop?</h1>
            <p style={styles.sub}>You can always switch roles later from your profile.</p>

            <div className="grid-2" style={styles.grid}>
              {roles.map((r) => {
                const active = selected === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelected(r.id)}
                    className="card"
                    style={{
                      ...styles.roleCard,
                      borderColor: active ? r.accent : 'var(--color-border)',
                      boxShadow: active ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
                    }}
                  >
                    <div style={{ ...styles.iconWrap, background: r.accentTint }}>{r.emoji}</div>
                    <h3 style={styles.roleTitle}>{r.title}</h3>
                    <p style={styles.roleText}>{r.text}</p>
                    <ul style={styles.pointList}>
                      {r.points.map((p) => (
                        <li key={p} style={styles.pointItem}>
                          <span style={{ color: r.accent }}>✓</span> {p}
                        </li>
                      ))}
                    </ul>
                    <div
                      style={{
                        ...styles.radioDot,
                        borderColor: active ? r.accent : 'var(--color-border-strong)',
                        background: active ? r.accent : 'transparent',
                      }}
                      aria-hidden="true"
                    />
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 36, minWidth: 240 }}
              disabled={!selected}
              onClick={handleContinue}
            >
              {selected ? roles.find((r) => r.id === selected).cta : 'Select a role to continue'}
            </button>
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
  h1: { fontSize: 34, margin: '10px 0 8px' },
  sub: { fontSize: 14, marginBottom: 44 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 24,
    maxWidth: 780,
    margin: '0 auto',
  },
  roleCard: {
    position: 'relative',
    textAlign: 'left',
    padding: '30px 26px',
    borderWidth: 2,
    borderStyle: 'solid',
    background: 'var(--color-surface)',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
    font: 'inherit',
    color: 'inherit',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 26,
    marginBottom: 16,
  },
  roleTitle: { fontSize: 20, marginBottom: 8 },
  roleText: { fontSize: 13.5, marginBottom: 16 },
  pointList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  pointItem: { fontSize: 13, color: 'var(--color-ink-soft)', display: 'flex', gap: 8, alignItems: 'flex-start' },
  radioDot: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 18,
    height: 18,
    borderRadius: '50%',
    borderWidth: 2,
    borderStyle: 'solid',
    transition: 'all 0.15s ease',
  },
}
