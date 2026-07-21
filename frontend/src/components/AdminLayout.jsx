import AdminNav from './AdminNav.jsx'
import '../pages/Admin.css'

export default function AdminLayout({ title, eyebrow, children, action }) {
  return <div className="admin-shell"><AdminNav /><main className="admin-main"><header className="admin-topbar"><button className="admin-menu" aria-label="Open navigation">☰</button><div className="admin-top-actions"><button aria-label="Notifications">♢<b>3</b></button><span>21 July 2026</span></div></header><div className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>{action}</div>{children}</div></main></div>
}
