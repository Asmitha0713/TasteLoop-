import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useTranslation } from '../i18n/LanguageContext.jsx'

const values = [
  { icon: '🛡️', title: 'Trust First', text: 'Every cook is verified before their first listing goes live, so you always know who made your meal.' },
  { icon: '⚖️', title: 'Fair to Cooks', text: 'Home cooks keep the majority of every order — TasteLoop takes a small, transparent service fee.' },
  { icon: '🍲', title: 'Real Food', text: 'No factory kitchens. Every dish is prepared in a home kitchen, in small batches, the same day.' },
  { icon: '🤝', title: 'Community Over Scale', text: 'We grow one neighbourhood at a time, so quality never gets diluted for the sake of speed.' },
]

export default function About() {
  const { t } = useTranslation()

  return (
    <div className="page">
      <Navbar />

      <main className="page-content">
        <section className="landing-hero" style={styles.hero}>
          <div className="container" style={styles.heroInner}>
            <span className="eyebrow">{t('About TasteLoop')}</span>
            <h1 style={styles.h1}>{t('Bringing the neighbourhood kitchen back to the table.')}</h1>
            <p style={styles.heroText}>
              {t("TasteLoop started with a simple idea: the best meals aren't made in a commercial kitchen, they're made by someone who genuinely loves cooking. We built a marketplace where that person can be found — and paid fairly — by the people around them.")}
            </p>
          </div>
        </section>

        <section className="container" style={styles.missionSection}>
          <div className="grid-2" style={styles.missionGrid}>
            <div className="card" style={styles.missionCard}>
              <span className="stitched">{t('Our Mission')}</span>
              <h3 style={{ marginTop: 14 }}>{t('Make real home cooking accessible again')}</h3>
              <p style={{ margin: 0 }}>
                {t('We connect people craving an honest, home-cooked meal with talented cooks in their own neighbourhood — cutting out commercial kitchens and delivery-app markups along the way.')}
              </p>
            </div>
            <div className="card" style={styles.missionCard}>
              <span className="stitched">
                {t('Our Vision')}
              </span>
              <h3 style={{ marginTop: 14 }}>{t("A home kitchen on every street, earning what it's worth")}</h3>
              <p style={{ margin: 0 }}>
                {t('We imagine a future where cooking well is a viable livelihood for anyone, anywhere — not just those who can afford a commercial storefront.')}
              </p>
            </div>
          </div>
        </section>

        <section className="landing-why" style={styles.valuesSection}>
          <div className="container">
            <div style={styles.sectionHead}>
              <span className="eyebrow">{t('What guides us')}</span>
              <h2>{t('Our Values')}</h2>
            </div>
            <div className="grid-4" style={styles.valuesGrid}>
              {values.map((v) => (
                <div key={v.title} className="card" style={styles.valueCard}>
                  <span style={styles.valueIcon} aria-hidden="true">{v.icon}</span>
                  <h4 style={{ margin: '14px 0 8px' }}>{t(v.title)}</h4>
                  <p style={{ fontSize: 13.5, margin: 0 }}>{t(v.text)}</p>
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
    background: 'var(--color-bg)',
    padding: '82px 0 70px',
  },
  heroInner: { maxWidth: 760 },
  h1: { fontSize: 'clamp(42px, 5vw, 56px)', margin: '16px 0 18px' },
  heroText: { maxWidth: 700, fontSize: 17 },
  missionSection: { padding: '60px 24px' },
  missionGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 },
  missionCard: { padding: '32px 28px', minHeight: 250 },
  valuesSection: { background: 'var(--color-surface-alt)', padding: '64px 0' },
  sectionHead: { marginBottom: 32, maxWidth: 520 },
  valuesGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 },
  valueCard: { padding: '26px 22px', minHeight: 230 },
  valueIcon: { display: 'block', fontSize: 30, lineHeight: 1 },
}
