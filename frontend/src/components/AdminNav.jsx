import { Link, NavLink } from 'react-router-dom'
import LogoutButton from './LogoutButton.jsx'

const links = [
  { to: '/admin/dashboard', label: 'Overview', icon: '⌂' },
  { to: '/admin/users', label: 'Users', icon: '♙' },
  { to: '/admin/foods', label: 'Foods', icon: '♨' },
  { to: '/admin/reports', label: 'Reports', icon: '⚑' },
  { to: '/admin/complaints', label: 'Complaints', icon: '!' },
  { to: '/admin/delivery-management', label: 'Delivery', icon: '➜' },
]

export default function AdminNav() {
  return <aside className="admin-sidebar">
    <Link className="admin-logo" to="/admin/dashboard"><img src="/tasteloop-logo.png" alt="TasteLoop home-cooked food marketplace" /><span>ADMIN</span></Link>
    <nav>{links.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'active' : ''}><i>{item.icon}</i>{item.label}</NavLink>)}</nav>
    <div className="admin-account"><span>AD</span><div><strong>Admin User</strong><small>Super admin</small></div><LogoutButton compact /></div>
  </aside>
}
