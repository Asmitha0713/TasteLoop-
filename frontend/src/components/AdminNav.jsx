import { Link, NavLink } from 'react-router-dom'

const links = [
  { to: '/admin/dashboard', label: 'Overview', icon: '⌂' },
  { to: '/admin/users', label: 'Users', icon: '♙' },
  { to: '/admin/foods', label: 'Foods', icon: '♨' },
  { to: '/admin/reports', label: 'Reports', icon: '⚑' },
]

export default function AdminNav() {
  return <aside className="admin-sidebar">
    <Link className="admin-logo" to="/admin/dashboard"><img src="/logo.jpeg" alt="TasteLoop" /><span>ADMIN</span></Link>
    <nav>{links.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'active' : ''}><i>{item.icon}</i>{item.label}</NavLink>)}</nav>
    <div className="admin-account"><span>AD</span><div><strong>Admin User</strong><small>Super admin</small></div></div>
  </aside>
}
