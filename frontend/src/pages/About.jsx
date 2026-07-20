import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SteamDivider from '../components/SteamDivider.jsx'

const values = [
  { title: 'Trust First', text: 'Every cook is verified before their first listing goes live, so you always know who made your meal.' },
  { title: 'Fair to Cooks', text: 'Home cooks keep the majority of every order — TasteLoop takes a small, transparent service fee.' },
  { title: 'Real Food', text: 'No factory kitchens. Every dish is prepared in a home kitchen, in small batches, the same day.' },
  { title: 'Community Over Scale', text: 'We grow one neighbourhood at a time, so quality never gets diluted for the sake of speed.' },
]

export default function About() {
  return (
    <div className="page">
      <Navbar />

      <main className="page-content">
        <section style={styles.hero}>
          <div className="container" style={styles.heroInner}>
            <span className="eyebrow">About TasteLoop</span>
            <h1 style={styles.h1}>Bringing the neighbourhood kitchen back to the table.</h1>
            <p style={styles.heroText}>
              TasteLoop started with a simple idea: the best meals aren't made
              in a commercial kitchen, they're made by someone who genuinely
              loves cooking. We built a marketplace where that person can be
              found — and paid fairly — by the people around them.
            </p>
          </div>
        </section>

        <div style={{ color: 'var(--color-surface)' }}><SteamDivider /></div>

        <section className="container" style={styles.missionSection}>
          <div className="grid-2" style={styles.missionGrid}>
            <div className="card" style={styles.missionCard}>
              <span className="stitched">Our Mission</span>
              <h3 style={{ marginTop: 14 }}>Make real home cooking accessible again</h3>
              <p style={{ margin: 0 }}>
                We connect people craving an honest, home-cooked meal with
                talented cooks in their own neighbourhood — cutting out
                commercial kitchens and delivery-app markups along the way.
              </p>
            </div>
            <div className="card" style={styles.missionCard}>
              <span className="stitched" style={{ background: 'var(--color-mustard-tint)', color: 'var(--color-mustard-dark)' }}>
                Our Vision
              </span>
              <h3 style={{ marginTop: 14 }}>A home kitchen on every street, earning what it's worth</h3>
              <p style={{ margin: 0 }}>
                We imagine a future where cooking well is a viable livelihood
                for anyone, anywhere — not just those who can afford a
                commercial storefront.
              </p>
            </div>
          </div>
        </section>

        <section style={styles.valuesSection}>
          <div className="container">
            <div style={styles.sectionHead}>
              <span className="eyebrow">What guides us</span>
              <h2>Our Values</h2>
            </div>
            <div className="grid-4" style={styles.valuesGrid}>
              {values.map((v, i) => (
                <div key={v.title} className="card" style={styles.valueCard}>
                  <span style={styles.valueNumber}>0{i + 1}</span>
                  <h4 style={{ margin: '14px 0 8px' }}>{v.title}</h4>
                  <p style={{ fontSize: 13.5, margin: 0 }}>{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

const styles = {
  hero: {
    background: 'linear-gradient(180deg, var(--color-mustard-tint) 0%, var(--color-bg) 100%)',
    padding: '72px 0 56px',
  },
  heroInner: { maxWidth: 680 },
  h1: { fontSize: 42, margin: '16px 0 18px' },
  heroText: { fontSize: 16.5 },
  missionSection: { padding: '48px 0 60px' },
  missionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  missionCard: { padding: '32px 28px' },
  valuesSection: { background: 'var(--color-surface-alt)', padding: '64px 0' },
  sectionHead: { marginBottom: 32, maxWidth: 520 },
  valuesGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 },
  valueCard: { padding: '26px 22px' },
  valueNumber: {
    fontFamily: 'var(--font-display)',
    fontSize: 24,
    color: 'var(--color-mustard-dark)',
    fontWeight: 700,
  },
}
