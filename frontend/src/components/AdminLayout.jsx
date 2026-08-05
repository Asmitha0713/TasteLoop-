import AdminNav from './AdminNav.jsx'
import '../pages/Admin.css'
import { useTranslation } from '../i18n/LanguageContext.jsx'

export default function AdminLayout({ title, eyebrow, children, action }) {
  const { t, language } = useTranslation()
  return <div className="admin-shell"><AdminNav /><main className="admin-main"><header className="admin-topbar"><button className="admin-menu" aria-label="Open navigation">☰</button><div className="admin-top-actions"><button aria-label={t('Notifications')}>♢<b>3</b></button><span>{new Intl.DateTimeFormat(language === 'ta' ? 'ta-IN' : 'en-GB', { dateStyle: 'long' }).format(new Date())}</span></div></header><div className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow">{t(eyebrow)}</span><h1>{t(title)}</h1></div>{action}</div>{children}</div></main></div>
}
