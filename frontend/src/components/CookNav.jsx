import { Link, NavLink } from 'react-router-dom'

const links = [
  { to: '/cook/foods', label: 'My Foods' },
  { to: '/cook/add-food', label: 'Add Food' },
  { to: '/cook/earnings', label: 'Earnings' },
  { to: '/cook/profile', label: 'Profile' },
]

export default function CookNav() {
  return (
    <header className="cook-nav">
      <div className="container cook-nav__bar">
        <Link to="/" className="cook-nav__logo"><img src="/logo.jpeg" alt="TasteLoop" /></Link>
        <nav className="cook-nav__links" aria-label="Cook navigation">
          {links.map((link) => <NavLink key={link.to} to={link.to} className={({ isActive }) => `cook-nav__link${isActive ? ' active' : ''}`}>{link.label}</NavLink>)}
        </nav>
        <Link to="/cook/profile" className="cook-profile"><span className="cook-profile__avatar">NP</span><span className="hide-mobile"><strong>Nadeesha</strong><small>Home cook</small></span></Link>
      </div>
    </header>
  )
}
